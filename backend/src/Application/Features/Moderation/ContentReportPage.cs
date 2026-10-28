// Chức năng: kiểm duyệt nội dung và kết quả kiểm tra AI. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
namespace Application.Features.Moderation;

// ContentReportPage: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record ContentReportPage(IReadOnlyList<ContentReportItem> Items, int Total, int Page, int PageSize);
