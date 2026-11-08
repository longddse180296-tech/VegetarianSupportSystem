// Chức năng: quản trị tài khoản và thống kê hệ thống. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
namespace Application.Features.Administration;

// IDashboardRepository: định nghĩa hợp đồng xử lý giữa các tầng.
public interface IDashboardRepository
{
    // GetOverviewAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<DashboardOverview> GetOverviewAsync(CancellationToken cancellationToken);
}
