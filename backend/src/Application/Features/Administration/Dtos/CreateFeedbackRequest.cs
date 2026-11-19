// Nhận thông tin người gửi, chủ đề và nội dung góp ý từ form liên hệ.
namespace Application.Features.Administration;

// CreateFeedbackRequest: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record CreateFeedbackRequest(string? Name, string? Email, string? Subject, string? Message);
