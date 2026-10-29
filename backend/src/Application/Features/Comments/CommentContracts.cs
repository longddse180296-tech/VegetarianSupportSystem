// Chức năng: bình luận và tương tác cộng đồng. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using Domain.Enums;

namespace Application.Features.Comments;

// CreateCommentRequest: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record CreateCommentRequest(CommentTargetType TargetType, Guid TargetId, Guid? ParentId, string Body);
// EditCommentRequest: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record EditCommentRequest(string Body);
// ModerateCommentRequest: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record ModerateCommentRequest(string Reason);
// CommentQuery: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record CommentQuery(CommentTargetType? TargetType = null, Guid? TargetId = null,
    string? Search = null, CommentStatus? Status = null, int Page = 1, int PageSize = 20);
// CommentResponse: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record CommentResponse(Guid Id, CommentTargetType TargetType, Guid TargetId, Guid? ParentId,
    string AuthorId, string? AuthorName, string? Body, CommentStatus Status, DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt, int LikeCount, string? ModerationReason = null,
    string? ModeratedBy = null, DateTimeOffset? ModeratedAt = null);
// CommentPage: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record CommentPage(IReadOnlyList<CommentResponse> Items, int TotalCount, int Page, int PageSize);
// ReactionResponse: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record ReactionResponse(int Count, bool ReactedByMe);

// CommentError: định nghĩa các giá trị trạng thái được phép.
public enum CommentError { Validation, NotFound, Forbidden, Conflict }
// CommentException: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class CommentException(CommentError error, string message) : Exception(message)
{
    public CommentError Error { get; } = error;
}
