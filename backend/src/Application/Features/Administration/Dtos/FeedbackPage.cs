// Trả một trang góp ý từ người dùng kèm thông tin phân trang.
namespace Application.Features.Administration;

// FeedbackPage: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record FeedbackPage(IReadOnlyList<FeedbackItem> Items, int Total, int Page, int PageSize);
