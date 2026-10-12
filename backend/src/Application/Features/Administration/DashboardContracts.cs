namespace Application.Features.Administration;

public sealed record DashboardCatalogCount(int Total, int Active);

public sealed record DashboardCoreData(
    DashboardCatalogCount Categories,
    DashboardCatalogCount Ingredients,
    DashboardCatalogCount Recipes,
    DashboardCatalogCount Restaurants);

public sealed record DashboardMembers(int Registered, int Active, int Locked);

public sealed record DashboardContent(
    int PublishedArticles,
    int PublishedVideos,
    int? Comments);

public sealed record DashboardModerationQueue(
    int Articles,
    int Videos,
    int Total);

public sealed record DashboardActivity(
    string Type,
    string EntityId,
    string Title,
    string? ActorUserId,
    string? ActorName,
    DateTimeOffset OccurredAtUtc);

public sealed record DashboardOverview(
    DashboardMembers Members,
    DashboardCoreData CoreData,
    DashboardContent Content,
    DashboardModerationQueue PendingAdminReview,
    IReadOnlyList<DashboardActivity> RecentActivity);

public interface IDashboardRepository
{
    Task<DashboardOverview> GetOverviewAsync(CancellationToken cancellationToken);
}
