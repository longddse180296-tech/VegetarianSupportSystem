// Trả một trang báo cáo vi phạm nội dung và trạng thái xử lý kèm thông tin phân trang.
namespace Application.Features.Moderation;

// ContentReportPage: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record ContentReportPage(IReadOnlyList<ContentReportItem> Items, int Total, int Page, int PageSize);
