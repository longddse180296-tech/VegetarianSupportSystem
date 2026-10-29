// Chức năng: bài viết và phiên bản gửi duyệt. Tầng Infrastructure thực hiện truy vấn, lưu trữ hoặc giao tiếp dịch vụ ngoài.
using Application.Features.Articles;
using Domain.Entities;
using Domain.Enums;
using Domain.Rules;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

// ArticleRepository: thực hiện truy vấn và lưu dữ liệu của tính năng qua EF Core.
public sealed class ArticleRepository(AppDbContext db) : IArticleRepository
{
    // Chỉ đối chiếu bản đã duyệt đang công khai; bỏ qua chính bài đang sửa, bài chờ duyệt và các trạng thái khác.
    public async Task<bool> HasDuplicatePublishedTitleAsync(Guid excludingArticleId, string title, CancellationToken ct)
    {
        var normalized = ArticleTitleRules.Normalize(title);
        var candidates = db.Set<ArticleVersion>().AsNoTracking().Where(version => version.ArticleId != excludingArticleId
            && version.Submission.AdminReviewStatus == AdminReviewStatus.Published
            && version.Submission.IsCurrentPublished).Select(version => version.Title).AsAsyncEnumerable();
        await foreach (var candidate in candidates.WithCancellation(ct))
            if (ArticleTitleRules.Normalize(candidate) == normalized) return true;
        return false;
    }

    // WithVersions: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private IQueryable<Article> WithVersions(bool tracking = false)
    {
        var query = db.Articles.Include(x => x.Categories)
            .Include(x => x.DietaryTypes)
            .Include(x => x.Versions).ThenInclude(x => x.Categories)
            .Include(x => x.Versions).ThenInclude(x => x.DietaryTypes)
            .Include(x => x.Versions).ThenInclude(x => x.Submission)
            .ThenInclude(x => x.Decisions).AsSplitQuery();
        return tracking ? query : query.AsNoTracking();
    }

    // GetAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public Task<Article?> GetAsync(Guid id, CancellationToken ct) =>
        WithVersions(true).FirstOrDefaultAsync(x => x.Id == id, ct);

    // ListMineAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<ArticlePage<Article>> ListMineAsync(string ownerId, MyArticleListQuery search, CancellationToken ct)
    {
        var query = db.Articles.AsNoTracking().Where(x => x.OwnerUserId == ownerId);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (search.Status is { } status)
        {
            query = status == AdminReviewStatus.Draft
                ? query.Where(x => !x.Versions.Any())
                : query.Where(x => x.Versions.OrderByDescending(v => v.Version)
                    .Select(v => v.Submission.AdminReviewStatus).FirstOrDefault() == status);
        }
        if (search.AiStatus is { } aiStatus)
            query = query.Where(x => x.Versions.OrderByDescending(v => v.Version)
                .Select(v => v.Submission.AiFlagStatus).FirstOrDefault() == aiStatus);
        var count = await query.CountAsync(ct);
        var ids = await query.OrderByDescending(x => x.UpdatedAt).ThenBy(x => x.Id)
            .Skip((search.Page - 1) * search.PageSize).Take(search.PageSize)
            .Select(x => x.Id).ToArrayAsync(ct);
        var articles = await WithVersions().Where(x => ids.Contains(x.Id)).ToListAsync(ct);
        var ordered = ids.Select(id => articles.Single(x => x.Id == id)).ToArray();
        return new(ordered, count, search.Page, search.PageSize);
    }

    // PublicVersions: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private IQueryable<ArticleVersion> PublicVersions() =>
        db.Set<ArticleVersion>().AsNoTracking()
            .Where(x => x.Submission.AdminReviewStatus == AdminReviewStatus.Published
                && x.Submission.IsCurrentPublished);

    // PublicWithDetails: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private IQueryable<ArticleVersion> PublicWithDetails() => PublicVersions()
        .Include(x => x.Categories)
        .Include(x => x.DietaryTypes)
        .Include(x => x.Submission).ThenInclude(x => x.Decisions).AsSplitQuery();

    // ListPublicAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<ArticlePage<ArticleVersion>> ListPublicAsync(ArticleListQuery search, CancellationToken ct)
    {
        var query = PublicVersions();
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (!string.IsNullOrWhiteSpace(search.Search))
        {
            var term = search.Search.Trim();
            query = query.Where(x => x.Title.Contains(term) || x.Content.Contains(term));
        }
        if (!string.IsNullOrWhiteSpace(search.Category))
        {
            var category = search.Category.Trim();
            query = query.Where(x => x.Categories.Any(item => item.Category == category));
        }
        if (search.DietaryType is { } dietaryType)
            query = query.Where(x => x.DietaryTypes.Any(type => type.DietaryType == dietaryType));
        var count = await query.CountAsync(ct);
        var ids = await query.OrderByDescending(x => x.SubmittedAt).ThenBy(x => x.Id)
            .Skip((search.Page - 1) * search.PageSize).Take(search.PageSize)
            .Select(x => x.Id).ToArrayAsync(ct);
        var versions = await PublicWithDetails().Where(x => ids.Contains(x.Id)).ToListAsync(ct);
        return new(ids.Select(id => versions.Single(x => x.Id == id)).ToArray(), count, search.Page, search.PageSize);
    }

    // GetPublicAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public Task<ArticleVersion?> GetPublicAsync(Guid id, CancellationToken ct) =>
        PublicWithDetails().FirstOrDefaultAsync(x => x.ArticleId == id, ct);

    // GetRelatedAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<IReadOnlyList<ArticleVersion>> GetRelatedAsync(Guid articleId, IReadOnlyCollection<string> categories, int count, CancellationToken ct) =>
        await PublicWithDetails().Where(x => x.ArticleId != articleId &&
                x.Categories.Any(item => categories.Contains(item.Category)))
            .OrderByDescending(x => x.SubmittedAt).ThenBy(x => x.Id).Take(count).ToListAsync(ct);

    // AuthorNamesAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public async Task<IReadOnlyDictionary<string, string>> AuthorNamesAsync(IEnumerable<string> authorIds, CancellationToken ct)
    {
        var ids = authorIds.Distinct().ToArray();
        return await db.Users.AsNoTracking().Where(x => ids.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, x => x.FullName, ct);
    }

    // AddAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public Task AddAsync(Article article, CancellationToken ct) => db.Articles.AddAsync(article, ct).AsTask();
    // Remove: Xóa dữ liệu trong phạm vi cho phép và xử lý các liên kết liên quan.
    public void Remove(Article article) => db.Articles.Remove(article);

    // SaveAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public async Task SaveAsync(CancellationToken ct)
    {
        try { await db.SaveChangesAsync(ct); }
        catch (DbUpdateConcurrencyException)
        { throw new ArticleException(ArticleError.Conflict, "Bài viết vừa được cập nhật ở nơi khác. Vui lòng tải lại trước khi lưu."); }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException { Number: 2601 or 2627 })
        { throw new ArticleException(ArticleError.Conflict, "Phiên bản bài viết vừa được gửi từ một yêu cầu khác. Vui lòng tải lại để xem trạng thái mới nhất."); }
    }

    // InTransactionAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public async Task<T> InTransactionAsync<T>(Func<CancellationToken, Task<T>> action, CancellationToken ct)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        var result = await action(ct);
        await transaction.CommitAsync(ct);
        return result;
    }
}
