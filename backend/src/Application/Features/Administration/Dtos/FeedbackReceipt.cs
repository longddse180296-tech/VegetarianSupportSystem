// Trả mã và thời điểm hệ thống tiếp nhận góp ý.
namespace Application.Features.Administration;

// FeedbackReceipt: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record FeedbackReceipt(Guid Id, DateTimeOffset CreatedAt);
