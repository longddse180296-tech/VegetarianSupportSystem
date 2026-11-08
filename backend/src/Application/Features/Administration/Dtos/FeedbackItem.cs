// Chức năng: quản trị tài khoản và thống kê hệ thống. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
namespace Application.Features.Administration;

// FeedbackItem: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record FeedbackItem(Guid Id, string Name, string Email, string Subject,
    string Message, DateTimeOffset CreatedAt, DateTimeOffset? ReadAt);
