// Chức năng: quản trị tài khoản và thống kê hệ thống. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
namespace Application.Features.Administration;

// MemberSummary: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record MemberSummary(
    string Id, string FullName, string Email, string Role, DateTimeOffset JoinedAtUtc, bool IsLocked);
// MemberPage: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record MemberPage(
    IReadOnlyList<MemberSummary> Items, int Page, int PageSize, int TotalCount,
    int ActiveCount, int LockedCount);
// MemberDetail: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record MemberDetail(
    string Id, string FullName, string Email, string Role, DateTimeOffset JoinedAtUtc,
    bool IsLocked, string? CurrentLockReason, DateTimeOffset? LockedAtUtc);
// MemberStatusEntry: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record MemberStatusEntry(
    Guid Id, bool IsLocked, string Reason, string AdminId, string AdminName, DateTimeOffset OccurredAtUtc);
// MemberStatusPage: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record MemberStatusPage(
    IReadOnlyList<MemberStatusEntry> Items, int Page, int PageSize, int TotalCount);

// IMemberRepository: định nghĩa hợp đồng xử lý giữa các tầng.
public interface IMemberRepository
{
    // ListAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<MemberPage> ListAsync(string? search, bool? isLocked, int page, int pageSize, CancellationToken cancellationToken);
    // FindAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<MemberDetail?> FindAsync(string id, CancellationToken cancellationToken);
    // HistoryAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    Task<MemberStatusPage?> HistoryAsync(string id, int page, int pageSize, CancellationToken cancellationToken);
    // ChangeStatusAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    Task<MemberStatusUpdateResult> ChangeStatusAsync(string id, string adminId, bool lockAccount, string reason, DateTimeOffset now, CancellationToken cancellationToken);
}

// MemberStatusUpdateResult: định nghĩa các giá trị trạng thái được phép.
public enum MemberStatusUpdateResult { Updated, NotFound, AlreadyInState, SelfLock, LastAdmin, ActorInactive }
