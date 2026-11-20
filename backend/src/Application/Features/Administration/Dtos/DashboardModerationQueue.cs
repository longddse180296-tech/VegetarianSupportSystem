// Định nghĩa dữ liệu về số liệu hàng đợi kiểm duyệt trên dashboard Admin để các bước xử lý dùng chung.
namespace Application.Features.Administration;

// DashboardModerationQueue: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record DashboardModerationQueue(
    int Articles,
    int Videos,
    int Total);
