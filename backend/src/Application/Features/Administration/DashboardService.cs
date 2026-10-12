namespace Application.Features.Administration;

public sealed class DashboardService(IDashboardRepository dashboard)
{
    public Task<DashboardOverview> GetOverviewAsync(CancellationToken cancellationToken) =>
        dashboard.GetOverviewAsync(cancellationToken);
}
