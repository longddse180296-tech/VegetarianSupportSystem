// Chức năng: quản trị tài khoản và thống kê hệ thống. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
namespace Application.Features.Administration;

// FeedbackPage: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record FeedbackPage(IReadOnlyList<FeedbackItem> Items, int Total, int Page, int PageSize);
