// Định nghĩa dữ liệu về số bản ghi tổng cộng và đang hoạt động của một nhóm dữ liệu để các bước xử lý dùng chung.
namespace Application.Features.Administration;

// DashboardCatalogCount: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record DashboardCatalogCount(int Total, int Active);
