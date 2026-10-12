namespace Domain.Entities;

public sealed class MemberStatusChange
{
    private MemberStatusChange() { }

    private MemberStatusChange(string userId, string adminId, bool isLocked, string reason, DateTimeOffset occurredAtUtc)
    {
        Id = Guid.NewGuid();
        UserId = userId;
        AdminId = adminId;
        IsLocked = isLocked;
        Reason = reason;
        OccurredAtUtc = occurredAtUtc;
    }

    public Guid Id { get; private set; }
    public string UserId { get; private set; } = string.Empty;
    public string AdminId { get; private set; } = string.Empty;
    public bool IsLocked { get; private set; }
    public string Reason { get; private set; } = string.Empty;
    public DateTimeOffset OccurredAtUtc { get; private set; }

    public static MemberStatusChange Create(string userId, string adminId, bool isLocked, string reason, DateTimeOffset occurredAtUtc)
    {
        if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(adminId))
            throw new ArgumentException("User and admin are required.");
        if (string.IsNullOrWhiteSpace(reason) || reason.Trim().Length > 1_000)
            throw new ArgumentException("Reason is required and must be at most 1000 characters.", nameof(reason));
        return new MemberStatusChange(userId, adminId, isLocked, reason.Trim(), occurredAtUtc);
    }
}
