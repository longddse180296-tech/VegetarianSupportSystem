using Domain.Enums;

namespace Application.Features.Comments;

public sealed record CreateCommentRequest(CommentTargetType TargetType, Guid TargetId, Guid? ParentId, string Body);
public sealed record EditCommentRequest(string Body);
public sealed record ModerateCommentRequest(string Reason);
public sealed record CommentQuery(CommentTargetType? TargetType = null, Guid? TargetId = null,
    string? Search = null, CommentStatus? Status = null, int Page = 1, int PageSize = 20);
public sealed record CommentResponse(Guid Id, CommentTargetType TargetType, Guid TargetId, Guid? ParentId,
    string AuthorId, string? Body, CommentStatus Status, DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt, int LikeCount, string? ModerationReason = null,
    string? ModeratedBy = null, DateTimeOffset? ModeratedAt = null);
public sealed record CommentPage(IReadOnlyList<CommentResponse> Items, int TotalCount, int Page, int PageSize);
public sealed record ReactionResponse(int Count, bool ReactedByMe);

public enum CommentError { Validation, NotFound, Forbidden, Conflict }
public sealed class CommentException(CommentError error, string message) : Exception(message)
{
    public CommentError Error { get; } = error;
}
