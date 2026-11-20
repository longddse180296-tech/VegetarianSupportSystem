// Định nghĩa một mục trong danh sách góp ý từ người dùng.
namespace Application.Features.Administration;

// FeedbackItem: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record FeedbackItem(Guid Id, string Name, string Email, string Subject,
    string Message, DateTimeOffset CreatedAt, DateTimeOffset? ReadAt);
