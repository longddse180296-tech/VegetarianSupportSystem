namespace Application.Features.Administration;

public sealed record MemberSummary(
    string Id, string FullName, string Email, string Role, DateTimeOffset JoinedAtUtc, bool IsLocked);
public sealed record MemberPage(
    IReadOnlyList<MemberSummary> Items, int Page, int PageSize, int TotalCount,
    int ActiveCount, int LockedCount);
public sealed record MemberDetail(
    string Id, string FullName, string Email, string Role, DateTimeOffset JoinedAtUtc,
    bool IsLocked, string? CurrentLockReason, DateTimeOffset? LockedAtUtc);
public sealed record MemberStatusEntry(
    Guid Id, bool IsLocked, string Reason, string AdminId, string AdminName, DateTimeOffset OccurredAtUtc);
public sealed record MemberStatusPage(
    IReadOnlyList<MemberStatusEntry> Items, int Page, int PageSize, int TotalCount);

public interface IMemberRepository
{
    Task<MemberPage> ListAsync(string? search, bool? isLocked, int page, int pageSize, CancellationToken cancellationToken);
    Task<MemberDetail?> FindAsync(string id, CancellationToken cancellationToken);
    Task<MemberStatusPage?> HistoryAsync(string id, int page, int pageSize, CancellationToken cancellationToken);
    Task<MemberStatusUpdateResult> ChangeStatusAsync(string id, string adminId, bool lockAccount, string reason, DateTimeOffset now, CancellationToken cancellationToken);
}

public enum MemberStatusUpdateResult { Updated, NotFound, AlreadyInState, SelfLock, LastAdmin }
