// Định nghĩa dữ liệu về hoạt động gần đây hiển thị ở dashboard Admin để các bước xử lý dùng chung.
namespace Application.Features.Administration;

// DashboardActivity: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record DashboardActivity(
    string Type,
    string EntityId,
    string Title,
    string? ActorUserId,
    string? ActorName,
    DateTimeOffset OccurredAtUtc);
