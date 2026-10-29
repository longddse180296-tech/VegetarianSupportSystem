// Chức năng: bình luận và tương tác cộng đồng. Tầng Domain mô tả dữ liệu hoặc quy tắc nghiệp vụ, không phụ thuộc HTTP hay cơ sở dữ liệu.
using Domain.Enums;

namespace Domain.Entities;

// Comment: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class Comment
{
    private Comment() { }

    public Comment(CommentTargetType targetType, Guid targetId, Guid? parentId, string authorId, string body, DateTimeOffset now)
    {
        Id = Guid.NewGuid();
        TargetType = targetType;
        TargetId = targetId;
        ParentId = parentId;
        AuthorId = authorId;
        Body = ValidateBody(body);
        CreatedAt = UpdatedAt = now;
        Status = CommentStatus.Visible;
    }

    public Guid Id { get; private set; }
    public CommentTargetType TargetType { get; private set; }
    public Guid TargetId { get; private set; }
    public Guid? ParentId { get; private set; }
    public string AuthorId { get; private set; } = string.Empty;
    public string Body { get; private set; } = string.Empty;
    public CommentStatus Status { get; private set; }
    public string? ModerationReason { get; private set; }
    public string? ModeratedBy { get; private set; }
    public DateTimeOffset? ModeratedAt { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }
    public byte[] RowVersion { get; private set; } = [];

    // Edit: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public void Edit(string body, DateTimeOffset now)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (Status != CommentStatus.Visible) throw new InvalidOperationException("Bình luận không còn hiển thị nên chưa thể thực hiện thao tác này.");
        Body = ValidateBody(body);
        UpdatedAt = now;
    }

    // RemoveByOwner: Xóa dữ liệu trong phạm vi cho phép và xử lý các liên kết liên quan.
    public void RemoveByOwner(DateTimeOffset now)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (Status != CommentStatus.Visible) throw new InvalidOperationException("Bình luận không còn hiển thị nên chưa thể thực hiện thao tác này.");
        Status = CommentStatus.Removed;
        UpdatedAt = now;
    }

    // Moderate: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public void Moderate(CommentStatus status, string adminId, string reason, DateTimeOffset now)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (status is not (CommentStatus.Hidden or CommentStatus.Removed) ||
            Status == CommentStatus.Removed || Status == status)
            throw new InvalidOperationException("Trạng thái bình luận đã thay đổi hoặc không cho phép thao tác này. Vui lòng tải lại.");
        if (string.IsNullOrWhiteSpace(reason) || reason.Trim().Length > 1_000)
            throw new ArgumentException("Vui lòng nhập lý do từ 1 đến 1.000 ký tự.", nameof(reason));
        Status = status;
        ModerationReason = reason.Trim();
        ModeratedBy = adminId;
        ModeratedAt = UpdatedAt = now;
    }

    // ValidateBody: Kiểm tra dữ liệu và điều kiện nghiệp vụ; dừng xử lý khi không hợp lệ.
    private static string ValidateBody(string body)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (string.IsNullOrWhiteSpace(body) || body.Trim().Length > 2_000)
            throw new ArgumentException("Vui lòng nhập bình luận từ 1 đến 2.000 ký tự.", nameof(body));
        return body.Trim();
    }
}
