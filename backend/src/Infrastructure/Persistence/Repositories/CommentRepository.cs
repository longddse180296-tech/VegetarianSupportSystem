// Chức năng: bình luận và tương tác cộng đồng. Tầng Infrastructure thực hiện truy vấn, lưu trữ hoặc giao tiếp dịch vụ ngoài.
using Application.Features.Comments;
using Domain.Entities;
using Domain.Enums;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

// CommentRepository: thực hiện truy vấn và lưu dữ liệu của tính năng qua EF Core.
public sealed class CommentRepository(AppDbContext db) : ICommentRepository
{
    // IsPublicTargetAsync: Đánh giá điều kiện nghiệp vụ để quyết định nhánh xử lý.
    public Task<bool> IsPublicTargetAsync(CommentTargetType type, Guid id, CancellationToken ct) => type switch
    {
        CommentTargetType.Article => db.ArticleVersions.AsNoTracking().AnyAsync(x => x.ArticleId == id &&
            x.Submission.ContentType == ModeratedContentType.Article &&
            x.Submission.AdminReviewStatus == AdminReviewStatus.Published && x.Submission.IsCurrentPublished, ct),
        CommentTargetType.Video => db.ModerationSubmissions.AsNoTracking().AnyAsync(x => x.ContentId == id &&
            x.ContentType == ModeratedContentType.Video && x.AdminReviewStatus == AdminReviewStatus.Published && x.IsCurrentPublished, ct),
        _ => Task.FromResult(false)
    };

    // GetAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public Task<Comment?> GetAsync(Guid id, CancellationToken ct) => db.Comments.SingleOrDefaultAsync(x => x.Id == id, ct);

    // ListAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<(IReadOnlyList<Comment> Items, int Total)> ListAsync(CommentQuery query, string? ownerId, bool admin, CancellationToken ct)
    {
        var comments = db.Comments.AsNoTracking().AsQueryable();
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (ownerId is not null) comments = comments.Where(x => x.AuthorId == ownerId);
        if (query.TargetType is { } type) comments = comments.Where(x => x.TargetType == type);
        if (query.TargetId is { } id) comments = comments.Where(x => x.TargetId == id);
        if (admin)
        {
            if (query.Status is { } status) comments = comments.Where(x => x.Status == status);
            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var term = query.Search.Trim();
                comments = comments.Where(x => x.Body.Contains(term) || x.AuthorId.Contains(term));
            }
        }
        else if (ownerId is null)
            comments = comments.Where(x => x.Status == CommentStatus.Visible ||
                db.Comments.Any(reply => reply.ParentId == x.Id && reply.Status == CommentStatus.Visible));
        var total = await comments.CountAsync(ct);
        var items = await comments.OrderBy(x => x.CreatedAt).ThenBy(x => x.Id)
            .Skip((query.Page - 1) * query.PageSize).Take(query.PageSize).ToListAsync(ct);
        return (items, total);
    }

    // AuthorNamesAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public async Task<IReadOnlyDictionary<string, string>> AuthorNamesAsync(IEnumerable<string> authorIds, CancellationToken ct)
    {
        var ids = authorIds.Distinct().ToArray();
        return await db.Users.AsNoTracking().Where(x => ids.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, x => x.FullName, ct);
    }

    // LikeCountsAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public async Task<IReadOnlyDictionary<Guid, int>> LikeCountsAsync(IEnumerable<Guid> ids, CancellationToken ct)
    {
        var keys = ids.Distinct().ToArray();
        return await db.Set<ContentReaction>().AsNoTracking()
            .Where(x => x.TargetType == ReactionTargetType.CommentLike && keys.Contains(x.TargetId))
            .GroupBy(x => x.TargetId).Select(g => new { Id = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Id, x => x.Count, ct);
    }

    // GetReactionAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public Task<ContentReaction?> GetReactionAsync(string userId, ReactionTargetType type, Guid id, CancellationToken ct) =>
        db.Set<ContentReaction>().SingleOrDefaultAsync(x => x.UserId == userId && x.TargetType == type && x.TargetId == id, ct);

    // ReactionStatusAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public async Task<ReactionResponse> ReactionStatusAsync(string? userId, ReactionTargetType type, Guid id, CancellationToken ct)
    {
        var query = db.Set<ContentReaction>().AsNoTracking().Where(x => x.TargetType == type && x.TargetId == id);
        return new ReactionResponse(await query.CountAsync(ct),
            userId is not null && await query.AnyAsync(x => x.UserId == userId, ct));
    }

    // Add: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public void Add(Comment comment) => db.Comments.Add(comment);
    // Add: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public void Add(ContentReaction reaction) => db.Set<ContentReaction>().Add(reaction);
    // Remove: Xóa dữ liệu trong phạm vi cho phép và xử lý các liên kết liên quan.
    public void Remove(ContentReaction reaction) => db.Set<ContentReaction>().Remove(reaction);
    // SaveAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public async Task SaveAsync(CancellationToken ct)
    {
        try { await db.SaveChangesAsync(ct); }
        catch (DbUpdateConcurrencyException ex) when (ex.Entries.All(x => x.Entity is ContentReaction && x.State == EntityState.Deleted))
        {
            foreach (var entry in ex.Entries) entry.State = EntityState.Detached;
        }
        catch (DbUpdateConcurrencyException) { throw new CommentException(CommentError.Conflict, "Bình luận vừa được cập nhật ở nơi khác. Vui lòng tải lại trước khi thao tác."); }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException { Number: 2601 or 2627 } &&
            ex.Entries.All(x => x.Entity is ContentReaction && x.State == EntityState.Added))
        {
            foreach (var entry in ex.Entries) entry.State = EntityState.Detached;
        }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException { Number: 2601 or 2627 })
        { throw new CommentException(CommentError.Conflict, "Interaction changed concurrently; retry the request."); }
    }
}
