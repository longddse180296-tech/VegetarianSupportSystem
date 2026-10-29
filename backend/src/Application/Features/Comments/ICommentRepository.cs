// Chức năng: bình luận và tương tác cộng đồng. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using Domain.Entities;
using Domain.Enums;

namespace Application.Features.Comments;

// ICommentRepository: định nghĩa hợp đồng xử lý giữa các tầng.
public interface ICommentRepository
{
    // IsPublicTargetAsync: Đánh giá điều kiện nghiệp vụ để quyết định nhánh xử lý.
    Task<bool> IsPublicTargetAsync(CommentTargetType type, Guid id, CancellationToken ct);
    // GetAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<Comment?> GetAsync(Guid id, CancellationToken ct);
    // ListAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<(IReadOnlyList<Comment> Items, int Total)> ListAsync(CommentQuery query, string? ownerId, bool admin, CancellationToken ct);
    // AuthorNamesAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    Task<IReadOnlyDictionary<string, string>> AuthorNamesAsync(IEnumerable<string> authorIds, CancellationToken ct);
    // LikeCountsAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    Task<IReadOnlyDictionary<Guid, int>> LikeCountsAsync(IEnumerable<Guid> ids, CancellationToken ct);
    // GetReactionAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<ContentReaction?> GetReactionAsync(string userId, ReactionTargetType type, Guid id, CancellationToken ct);
    // ReactionStatusAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    Task<ReactionResponse> ReactionStatusAsync(string? userId, ReactionTargetType type, Guid id, CancellationToken ct);
    // Add: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    void Add(Comment comment);
    // Add: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    void Add(ContentReaction reaction);
    // Remove: Xóa dữ liệu trong phạm vi cho phép và xử lý các liên kết liên quan.
    void Remove(ContentReaction reaction);
    // SaveAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    Task SaveAsync(CancellationToken ct);
}
