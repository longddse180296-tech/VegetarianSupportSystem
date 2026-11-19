// Định nghĩa dữ liệu về tổng quan dữ liệu trên dashboard Admin để các bước xử lý dùng chung.
namespace Application.Features.Administration;

// DashboardOverview: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record DashboardOverview(
    DashboardMembers Members,
    DashboardCoreData CoreData,
    DashboardContent Content,
    DashboardModerationQueue PendingAdminReview,
    IReadOnlyList<DashboardActivity> RecentActivity);
