using Application.Features.Comments;
using Domain.Entities;
using Domain.Enums;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public sealed class CommentRepository(AppDbContext db) : ICommentRepository
{
    public Task<bool> IsPublicTargetAsync(CommentTargetType type, Guid id, CancellationToken ct) => type switch
    {
        CommentTargetType.Article => db.ArticleVersions.AsNoTracking().AnyAsync(x => x.ArticleId == id &&
            x.Submission.ContentType == ModeratedContentType.Article &&
            x.Submission.AdminReviewStatus == AdminReviewStatus.Published && x.Submission.IsCurrentPublished, ct),
        CommentTargetType.Video => db.ModerationSubmissions.AsNoTracking().AnyAsync(x => x.ContentId == id &&
            x.ContentType == ModeratedContentType.Video && x.AdminReviewStatus == AdminReviewStatus.Published && x.IsCurrentPublished, ct),
        _ => Task.FromResult(false)
    };

    public Task<Comment?> GetAsync(Guid id, CancellationToken ct) => db.Comments.SingleOrDefaultAsync(x => x.Id == id, ct);

    public async Task<(IReadOnlyList<Comment> Items, int Total)> ListAsync(CommentQuery query, string? ownerId, bool admin, CancellationToken ct)
    {
        var comments = db.Comments.AsNoTracking().AsQueryable();
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

    public async Task<IReadOnlyDictionary<Guid, int>> LikeCountsAsync(IEnumerable<Guid> ids, CancellationToken ct)
    {
        var keys = ids.Distinct().ToArray();
        return await db.Set<ContentReaction>().AsNoTracking()
            .Where(x => x.TargetType == ReactionTargetType.CommentLike && keys.Contains(x.TargetId))
            .GroupBy(x => x.TargetId).Select(g => new { Id = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Id, x => x.Count, ct);
    }

    public Task<ContentReaction?> GetReactionAsync(string userId, ReactionTargetType type, Guid id, CancellationToken ct) =>
        db.Set<ContentReaction>().SingleOrDefaultAsync(x => x.UserId == userId && x.TargetType == type && x.TargetId == id, ct);

    public async Task<ReactionResponse> ReactionStatusAsync(string? userId, ReactionTargetType type, Guid id, CancellationToken ct)
    {
        var query = db.Set<ContentReaction>().AsNoTracking().Where(x => x.TargetType == type && x.TargetId == id);
        return new ReactionResponse(await query.CountAsync(ct),
            userId is not null && await query.AnyAsync(x => x.UserId == userId, ct));
    }

    public void Add(Comment comment) => db.Comments.Add(comment);
    public void Add(ContentReaction reaction) => db.Set<ContentReaction>().Add(reaction);
    public void Remove(ContentReaction reaction) => db.Set<ContentReaction>().Remove(reaction);
    public async Task SaveAsync(CancellationToken ct)
    {
        try { await db.SaveChangesAsync(ct); }
        catch (DbUpdateConcurrencyException ex) when (ex.Entries.All(x => x.Entity is ContentReaction && x.State == EntityState.Deleted))
        {
            foreach (var entry in ex.Entries) entry.State = EntityState.Detached;
        }
        catch (DbUpdateConcurrencyException) { throw new CommentException(CommentError.Conflict, "Comment changed during the request."); }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException { Number: 2601 or 2627 } &&
            ex.Entries.All(x => x.Entity is ContentReaction && x.State == EntityState.Added))
        {
            foreach (var entry in ex.Entries) entry.State = EntityState.Detached;
        }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException { Number: 2601 or 2627 })
        { throw new CommentException(CommentError.Conflict, "Interaction changed concurrently; retry the request."); }
    }
}
