// Chức năng: quản trị tài khoản và thống kê hệ thống. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
namespace Application.Features.Administration;

// DashboardService: điều phối các bước nghiệp vụ và xử lý kết quả cho bên gọi.
public sealed class DashboardService(IDashboardRepository dashboard)
{
    // GetOverviewAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public Task<DashboardOverview> GetOverviewAsync(CancellationToken cancellationToken) =>
        dashboard.GetOverviewAsync(cancellationToken);
}
