using Domain.Enums;

namespace Domain.Entities;

public sealed class ModerationDecision
{
    private ModerationDecision() { }

    internal ModerationDecision(
        Guid submissionId,
        int version,
        ModerationDecisionType decision,
        string adminUserId,
        string reason,
        DateTimeOffset decidedAt)
    {
        Id = Guid.NewGuid();
        SubmissionId = submissionId;
        Version = version;
        Decision = decision;
        AdminUserId = adminUserId;
        Reason = reason;
        DecidedAt = decidedAt;
    }

    public Guid Id { get; private set; }
    public Guid SubmissionId { get; private set; }
    public int Version { get; private set; }
    public ModerationDecisionType Decision { get; private set; }
    public string AdminUserId { get; private set; } = string.Empty;
    public string Reason { get; private set; } = string.Empty;
    public DateTimeOffset DecidedAt { get; private set; }
}
