namespace Application.Features.Administration;

public sealed class MemberService(IMemberRepository members)
{
    public Task<MemberPage> ListAsync(string? search, bool? isLocked, int page, int pageSize, CancellationToken cancellationToken)
    {
        if (search?.Trim().Length > 150) throw new ArgumentException("Từ khóa tối đa 150 ký tự.", nameof(search));
        ValidatePage(page, pageSize);
        return members.ListAsync(search?.Trim(), isLocked, page, pageSize, cancellationToken);
    }

    public Task<MemberDetail?> FindAsync(string id, CancellationToken cancellationToken) =>
        members.FindAsync(id, cancellationToken);

    public Task<MemberStatusPage?> HistoryAsync(string id, int page, int pageSize, CancellationToken cancellationToken)
    {
        ValidatePage(page, pageSize);
        return members.HistoryAsync(id, page, pageSize, cancellationToken);
    }

    public Task<MemberStatusUpdateResult> ChangeStatusAsync(
        string id, string adminId, bool lockAccount, string? reason, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(reason) || reason.Trim().Length > 1_000)
            throw new ArgumentException("Lý do phải dài từ 1 đến 1000 ký tự.", nameof(reason));
        return members.ChangeStatusAsync(id, adminId, lockAccount, reason.Trim(), DateTimeOffset.UtcNow, cancellationToken);
    }

    private static void ValidatePage(int page, int pageSize)
    {
        if (page < 1 || pageSize is < 1 or > 100 || page > int.MaxValue / pageSize)
            throw new ArgumentException("Trang phải từ 1 và kích thước trang từ 1 đến 100.");
    }
}
