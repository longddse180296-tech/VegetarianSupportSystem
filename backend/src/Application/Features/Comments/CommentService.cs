using Domain.Entities;
using Domain.Enums;

namespace Application.Features.Comments;

public sealed class CommentService(ICommentRepository repository, TimeProvider clock)
{
    public async Task<CommentPage> ListPublicAsync(CommentQuery query, CancellationToken ct)
    {
        ValidatePage(query);
        if (query.TargetType is not { } type || query.TargetId is not { } id ||
            !Enum.IsDefined(type) || id == Guid.Empty)
            throw new CommentException(CommentError.Validation, "Valid targetType and targetId are required.");
        await RequirePublicTarget(type, id, ct);
        return await Page(query, null, false, false, ct);
    }

    public async Task<CommentPage> ListMineAsync(string userId, CommentQuery query, CancellationToken ct)
    {
        ValidatePage(query);
        return await Page(query, userId, false, true, ct);
    }

    public async Task<CommentResponse> GetPublicAsync(Guid id, CancellationToken ct)
    {
        var comment = await repository.GetAsync(id, ct) ?? throw NotFound();
        if (comment.Status != CommentStatus.Visible) throw NotFound();
        await RequirePublicTarget(comment.TargetType, comment.TargetId, ct);
        return await Map(comment, false, ct);
    }

    public async Task<CommentPage> ListAdminAsync(CommentQuery query, CancellationToken ct)
    {
        ValidatePage(query);
        return await Page(query, null, true, true, ct);
    }

    public async Task<CommentResponse> GetAdminAsync(Guid id, CancellationToken ct)
    {
        var comment = await repository.GetAsync(id, ct) ?? throw NotFound();
        return await Map(comment, true, ct);
    }

    public async Task<CommentResponse> CreateAsync(string userId, CreateCommentRequest request, CancellationToken ct)
    {
        if (!Enum.IsDefined(request.TargetType) || request.TargetId == Guid.Empty)
            throw new CommentException(CommentError.Validation, "Invalid target.");
        await RequirePublicTarget(request.TargetType, request.TargetId, ct);
        if (request.ParentId is { } parentId)
        {
            var parent = await repository.GetAsync(parentId, ct) ?? throw NotFound();
            if (parent.TargetType != request.TargetType || parent.TargetId != request.TargetId ||
                parent.Status != CommentStatus.Visible || parent.ParentId is not null)
                throw new CommentException(CommentError.Validation, "Parent must be a visible root comment on this content.");
        }
        Comment comment;
        try { comment = new Comment(request.TargetType, request.TargetId, request.ParentId, userId, request.Body, clock.GetUtcNow()); }
        catch (ArgumentException ex) { throw new CommentException(CommentError.Validation, ex.Message); }
        repository.Add(comment);
        await repository.SaveAsync(ct);
        return await Map(comment, false, ct);
    }

    public async Task<CommentResponse> EditAsync(Guid id, string userId, EditCommentRequest request, CancellationToken ct)
    {
        var comment = await repository.GetAsync(id, ct) ?? throw NotFound();
        if (comment.AuthorId != userId) throw new CommentException(CommentError.Forbidden, "Only the owner can edit this comment.");
        await RequirePublicTarget(comment.TargetType, comment.TargetId, ct);
        try { comment.Edit(request.Body, clock.GetUtcNow()); }
        catch (ArgumentException ex) { throw new CommentException(CommentError.Validation, ex.Message); }
        catch (InvalidOperationException ex) { throw new CommentException(CommentError.Conflict, ex.Message); }
        await repository.SaveAsync(ct);
        return await Map(comment, true, ct);
    }

    public async Task DeleteAsync(Guid id, string userId, CancellationToken ct)
    {
        var comment = await repository.GetAsync(id, ct) ?? throw NotFound();
        if (comment.AuthorId != userId) throw new CommentException(CommentError.Forbidden, "Only the owner can remove this comment.");
        try { comment.RemoveByOwner(clock.GetUtcNow()); }
        catch (InvalidOperationException ex) { throw new CommentException(CommentError.Conflict, ex.Message); }
        await repository.SaveAsync(ct);
    }

    public async Task<CommentResponse> ModerateAsync(Guid id, string adminId, CommentStatus status, string reason, CancellationToken ct)
    {
        var comment = await repository.GetAsync(id, ct) ?? throw NotFound();
        try { comment.Moderate(status, adminId, reason, clock.GetUtcNow()); }
        catch (ArgumentException ex) { throw new CommentException(CommentError.Validation, ex.Message); }
        catch (InvalidOperationException ex) { throw new CommentException(CommentError.Conflict, ex.Message); }
        await repository.SaveAsync(ct);
        return await Map(comment, true, ct);
    }

    public async Task<ReactionResponse> ReactionAsync(string? userId, ReactionTargetType type, Guid id, bool? active, CancellationToken ct)
    {
        if (!Enum.IsDefined(type) || id == Guid.Empty)
            throw new CommentException(CommentError.Validation, "Invalid reaction target.");
        if (type == ReactionTargetType.CommentLike)
        {
            var comment = await repository.GetAsync(id, ct) ?? throw NotFound();
            if (comment.Status != CommentStatus.Visible) throw NotFound();
            await RequirePublicTarget(comment.TargetType, comment.TargetId, ct);
        }
        else
            await RequirePublicTarget(type == ReactionTargetType.ArticleHelpful ? CommentTargetType.Article : CommentTargetType.Video, id, ct);

        if (active is not null)
        {
            if (string.IsNullOrWhiteSpace(userId)) throw new CommentException(CommentError.Forbidden, "Login required.");
            var existing = await repository.GetReactionAsync(userId, type, id, ct);
            if (active.Value && existing is null) repository.Add(new ContentReaction(userId, type, id, clock.GetUtcNow()));
            if (!active.Value && existing is not null) repository.Remove(existing);
            if ((active.Value && existing is null) || (!active.Value && existing is not null)) await repository.SaveAsync(ct);
        }
        return await repository.ReactionStatusAsync(userId, type, id, ct);
    }

    private async Task<CommentPage> Page(CommentQuery query, string? ownerId, bool admin, bool includeBody, CancellationToken ct)
    {
        var (items, total) = await repository.ListAsync(query, ownerId, admin, ct);
        var counts = await repository.LikeCountsAsync(items.Select(x => x.Id), ct);
        return new CommentPage(items.Select(x => ToResponse(x, includeBody, counts.GetValueOrDefault(x.Id))).ToArray(), total, query.Page, query.PageSize);
    }

    private async Task<CommentResponse> Map(Comment comment, bool includeBody, CancellationToken ct)
    {
        var counts = await repository.LikeCountsAsync([comment.Id], ct);
        return ToResponse(comment, includeBody, counts.GetValueOrDefault(comment.Id));
    }

    private static CommentResponse ToResponse(Comment c, bool includeBody, int likeCount) =>
        new(c.Id, c.TargetType, c.TargetId, c.ParentId, c.AuthorId,
            includeBody || c.Status == CommentStatus.Visible ? c.Body : null,
            c.Status, c.CreatedAt, c.UpdatedAt, likeCount,
            includeBody ? c.ModerationReason : null, includeBody ? c.ModeratedBy : null,
            includeBody ? c.ModeratedAt : null);

    private async Task RequirePublicTarget(CommentTargetType type, Guid id, CancellationToken ct)
    {
        if (!await repository.IsPublicTargetAsync(type, id, ct)) throw NotFound();
    }
    private static CommentException NotFound() => new(CommentError.NotFound, "Content or comment not found.");
    private static void ValidatePage(CommentQuery q)
    {
        if (q.Page < 1 || q.PageSize is < 1 or > 100 || (q.TargetType is { } type && !Enum.IsDefined(type)) ||
            (q.Status is { } status && !Enum.IsDefined(status)) || q.Search?.Length > 200)
            throw new CommentException(CommentError.Validation, "Invalid list query.");
    }
}
