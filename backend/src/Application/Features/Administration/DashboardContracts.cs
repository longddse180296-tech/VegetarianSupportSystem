// Chức năng: quản trị tài khoản và thống kê hệ thống. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
namespace Application.Features.Administration;

// DashboardCatalogCount: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record DashboardCatalogCount(int Total, int Active);

// DashboardCoreData: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record DashboardCoreData(
    DashboardCatalogCount Categories,
    DashboardCatalogCount Ingredients,
    DashboardCatalogCount Recipes,
    DashboardCatalogCount Restaurants);

// DashboardMembers: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record DashboardMembers(int Registered, int Active, int Locked);

// DashboardContent: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record DashboardContent(
    int PublishedArticles,
    int PublishedVideos,
    int? Comments);

// DashboardModerationQueue: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record DashboardModerationQueue(
    int Articles,
    int Videos,
    int Total);

// DashboardActivity: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record DashboardActivity(
    string Type,
    string EntityId,
    string Title,
    string? ActorUserId,
    string? ActorName,
    DateTimeOffset OccurredAtUtc);

// DashboardOverview: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record DashboardOverview(
    DashboardMembers Members,
    DashboardCoreData CoreData,
    DashboardContent Content,
    DashboardModerationQueue PendingAdminReview,
    IReadOnlyList<DashboardActivity> RecentActivity);

// IDashboardRepository: định nghĩa hợp đồng xử lý giữa các tầng.
public interface IDashboardRepository
{
    // GetOverviewAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<DashboardOverview> GetOverviewAsync(CancellationToken cancellationToken);
}
