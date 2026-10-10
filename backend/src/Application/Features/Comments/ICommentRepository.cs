using Domain.Entities;
using Domain.Enums;

namespace Application.Features.Comments;

public interface ICommentRepository
{
    Task<bool> IsPublicTargetAsync(CommentTargetType type, Guid id, CancellationToken ct);
    Task<Comment?> GetAsync(Guid id, CancellationToken ct);
    Task<(IReadOnlyList<Comment> Items, int Total)> ListAsync(CommentQuery query, string? ownerId, bool admin, CancellationToken ct);
    Task<IReadOnlyDictionary<Guid, int>> LikeCountsAsync(IEnumerable<Guid> ids, CancellationToken ct);
    Task<ContentReaction?> GetReactionAsync(string userId, ReactionTargetType type, Guid id, CancellationToken ct);
    Task<ReactionResponse> ReactionStatusAsync(string? userId, ReactionTargetType type, Guid id, CancellationToken ct);
    void Add(Comment comment);
    void Add(ContentReaction reaction);
    void Remove(ContentReaction reaction);
    Task SaveAsync(CancellationToken ct);
}
