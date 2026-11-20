// Quy định các thao tác truy xuất thống kê phục vụ dashboard Admin mà nghiệp vụ sử dụng.
namespace Application.Features.Administration;

// IDashboardRepository: định nghĩa hợp đồng xử lý giữa các tầng.
public interface IDashboardRepository
{
    // GetOverviewAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<DashboardOverview> GetOverviewAsync(CancellationToken cancellationToken);
}
