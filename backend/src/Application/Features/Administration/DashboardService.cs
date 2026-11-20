// Trả thống kê thành viên, dữ liệu, nội dung và hàng đợi kiểm duyệt cho Admin.
namespace Application.Features.Administration;

// DashboardService: điều phối các bước nghiệp vụ và xử lý kết quả cho bên gọi.
public sealed class DashboardService(IDashboardRepository dashboard)
{
    // GetOverviewAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public Task<DashboardOverview> GetOverviewAsync(CancellationToken cancellationToken) =>
        dashboard.GetOverviewAsync(cancellationToken);
}
