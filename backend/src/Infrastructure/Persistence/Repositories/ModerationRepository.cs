// Chức năng: kiểm duyệt nội dung và kết quả kiểm tra AI. Tầng Infrastructure thực hiện truy vấn, lưu trữ hoặc giao tiếp dịch vụ ngoài.
using Application.Features.Moderation;
using Domain.Entities;
using Domain.Enums;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

// ModerationRepository: thực hiện truy vấn và lưu dữ liệu của tính năng qua EF Core.
public sealed class ModerationRepository(AppDbContext dbContext) : IModerationRepository
{
    // AuthorNamesAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public async Task<IReadOnlyDictionary<string, string>> AuthorNamesAsync(IEnumerable<string> userIds, CancellationToken cancellationToken)
    {
        var ids = userIds.Distinct().ToArray();
        return await dbContext.Users.AsNoTracking().Where(user => ids.Contains(user.Id))
            .ToDictionaryAsync(user => user.Id, user => user.FullName, cancellationToken);
    }

    // GetByIdAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public Task<ModerationSubmission?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return dbContext.Set<ModerationSubmission>()
            .Include(x => x.Decisions)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    // GetLatestForContentAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public Task<ModerationSubmission?> GetLatestForContentAsync(
        Guid contentId,
        CancellationToken cancellationToken)
    {
        return dbContext.Set<ModerationSubmission>()
            .Include(x => x.Decisions)
            .OrderByDescending(x => x.Version)
            .FirstOrDefaultAsync(x => x.ContentId == contentId, cancellationToken);
    }

    // GetCurrentPublishedAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public Task<ModerationSubmission?> GetCurrentPublishedAsync(
        Guid contentId,
        CancellationToken cancellationToken)
    {
        return dbContext.Set<ModerationSubmission>()
            .FirstOrDefaultAsync(
                x => x.ContentId == contentId && x.IsCurrentPublished,
                cancellationToken);
    }

    // GetCheckingIdsAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<IReadOnlyList<Guid>> GetCheckingIdsAsync(int count, CancellationToken cancellationToken) =>
        await dbContext.ModerationSubmissions.AsNoTracking()
            .Where(x => x.ContentType == ModeratedContentType.Article &&
                x.AiFlagStatus == AiFlagStatus.Checking &&
                !dbContext.ModerationSubmissions.Any(newer =>
                    newer.ContentId == x.ContentId && newer.Version > x.Version))
            .OrderBy(x => x.SubmittedAt).Select(x => x.Id).Take(count)
            .ToArrayAsync(cancellationToken);

    // SearchAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<ModerationPage> SearchAsync(
        ModerationSearch search,
        CancellationToken cancellationToken)
    {
        var query = dbContext.Set<ModerationSubmission>().AsNoTracking().AsQueryable();

        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (search.OwnerUserId is not null)
            query = query.Where(x => x.OwnerUserId == search.OwnerUserId);
        if (search.ContentType is { } contentType)
            query = query.Where(x => x.ContentType == contentType);
        if (search.AiStatus is { } aiStatus)
            query = query.Where(x => x.AiFlagStatus == aiStatus);
        if (search.AdminStatus is { } adminStatus)
            query = query.Where(x => x.AdminReviewStatus == adminStatus);
        if (search.AdminStatus == AdminReviewStatus.Published)
            query = query.Where(x => x.IsCurrentPublished);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(x => x.SubmittedAt)
            .ThenByDescending(x => x.Id)
            .Skip((search.Page - 1) * search.PageSize)
            .Take(search.PageSize)
            .Include(x => x.Decisions)
            .AsSplitQuery()
            .ToListAsync(cancellationToken);

        return new ModerationPage(items, totalCount, search.Page, search.PageSize);
    }

    // AddAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public async Task AddAsync(
        ModerationSubmission submission,
        CancellationToken cancellationToken)
    {
        await dbContext.Set<ModerationSubmission>().AddAsync(submission, cancellationToken);
    }

    // SaveChangesAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public async Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new ModerationException(
                ModerationError.Conflict,
                "Nội dung vừa được cập nhật ở nơi khác. Vui lòng tải lại để xem trạng thái mới nhất.");
        }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException { Number: 2601 or 2627 })
        {
            throw new ModerationException(
                ModerationError.Conflict,
                "Đã có phiên bản mới hoặc phiên bản công khai khác. Vui lòng tải lại trước khi tiếp tục.");
        }
    }

    // ExecuteInTransactionAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public async Task ExecuteInTransactionAsync(
        Func<CancellationToken, Task> operation,
        CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        await operation(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
    }
}
