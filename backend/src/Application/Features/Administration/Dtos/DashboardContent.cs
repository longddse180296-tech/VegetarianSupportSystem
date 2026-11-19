// Định nghĩa dữ liệu về thống kê nội dung hiển thị ở dashboard Admin để các bước xử lý dùng chung.
namespace Application.Features.Administration;

// DashboardContent: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record DashboardContent(
    int PublishedArticles,
    int PublishedVideos,
    int? Comments);
