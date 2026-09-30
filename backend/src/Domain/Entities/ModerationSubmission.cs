using Domain.Enums;

namespace Domain.Entities;

public sealed class ModerationSubmission
{
    private ModerationSubmission() { }

    private ModerationSubmission(
        Guid contentId,
        int version,
        ModeratedContentType contentType,
        string ownerUserId,
        string title,
        string textContent,
        string? mediaReference,
        DateTimeOffset submittedAt)
    {
        Id = Guid.NewGuid();
        ContentId = contentId;
        Version = version;
        ContentType = contentType;
        OwnerUserId = ownerUserId;
        Title = title;
        TextContent = textContent;
        MediaReference = mediaReference;
        SubmittedAt = submittedAt;
        AiFlagStatus = AiFlagStatus.Checking;
        AdminReviewStatus = AdminReviewStatus.Submitted;
    }

    public Guid Id { get; private set; }
    public Guid ContentId { get; private set; }
    public int Version { get; private set; }
    public ModeratedContentType ContentType { get; private set; }
    public string OwnerUserId { get; private set; } = string.Empty;
    public string Title { get; private set; } = string.Empty;
    public string TextContent { get; private set; } = string.Empty;
    public string? MediaReference { get; private set; }
    public AiFlagStatus AiFlagStatus { get; private set; }
    public AdminReviewStatus AdminReviewStatus { get; private set; }
    public string? AiSummary { get; private set; }
    public string? AiCheckedScope { get; private set; }
    public string? AiUncheckedScope { get; private set; }
    public DateTimeOffset? AiCheckedAt { get; private set; }
    public DateTimeOffset SubmittedAt { get; private set; }
    public bool IsCurrentPublished { get; private set; }
    public byte[] RowVersion { get; private set; } = [];
    public ICollection<ModerationDecision> Decisions { get; private set; } = new List<ModerationDecision>();

    public static ModerationSubmission Submit(
        Guid contentId,
        int version,
        ModeratedContentType contentType,
        string ownerUserId,
        string title,
        string textContent,
        string? mediaReference,
        DateTimeOffset submittedAt)
    {
        if (contentId == Guid.Empty || version < 1 || string.IsNullOrWhiteSpace(ownerUserId)
            || string.IsNullOrWhiteSpace(title) || string.IsNullOrWhiteSpace(textContent)
            || !Enum.IsDefined(contentType))
        {
            throw new ArgumentException("Invalid moderation submission.");
        }

        return new ModerationSubmission(
            contentId, version, contentType, ownerUserId.Trim(), title.Trim(),
            textContent.Trim(), mediaReference?.Trim(), submittedAt);
    }

    public void RecordAiResult(
        AiFlagStatus status,
        string summary,
        string? checkedScope,
        string? uncheckedScope,
        DateTimeOffset checkedAt)
    {
        if (AiFlagStatus != AiFlagStatus.Checking)
            throw new InvalidOperationException("AI result can only complete a pending check.");

        if (status is not (AiFlagStatus.Passed or AiFlagStatus.Flagged or AiFlagStatus.Partial or AiFlagStatus.Failed))
            throw new ArgumentException("AI result must be terminal.", nameof(status));

        if (string.IsNullOrWhiteSpace(summary) || summary.Length > 2_000)
            throw new ArgumentException("AI result summary is required.", nameof(summary));

        if (checkedScope?.Length > 2_000 || uncheckedScope?.Length > 2_000)
            throw new ArgumentException("AI scope is too long.");

        if (status != AiFlagStatus.Failed && string.IsNullOrWhiteSpace(checkedScope))
            throw new ArgumentException("Checked scope is required for an AI result.", nameof(checkedScope));

        if (status == AiFlagStatus.Partial && string.IsNullOrWhiteSpace(uncheckedScope))
            throw new ArgumentException("Unchecked scope is required for a partial result.", nameof(uncheckedScope));

        if (status is (AiFlagStatus.Passed or AiFlagStatus.Flagged)
            && !string.IsNullOrWhiteSpace(uncheckedScope))
            throw new ArgumentException("Use Partial when any scope remains unchecked.", nameof(uncheckedScope));

        AiFlagStatus = status;
        AiSummary = summary.Trim();
        AiCheckedScope = checkedScope?.Trim();
        AiUncheckedScope = uncheckedScope?.Trim();
        AiCheckedAt = checkedAt;

        if (status != AiFlagStatus.Failed)
            AdminReviewStatus = AdminReviewStatus.PendingAdminReview;
    }

    public void RetryAiCheck()
    {
        if (AiFlagStatus != AiFlagStatus.Failed || AdminReviewStatus != AdminReviewStatus.Submitted)
            throw new InvalidOperationException("Only a failed AI check can be retried.");

        AiFlagStatus = AiFlagStatus.Checking;
        AiSummary = null;
        AiCheckedScope = null;
        AiUncheckedScope = null;
        AiCheckedAt = null;
    }

    public ModerationDecision Decide(
        ModerationDecisionType decision,
        string adminUserId,
        string reason,
        DateTimeOffset decidedAt)
    {
        if (string.IsNullOrWhiteSpace(adminUserId) || string.IsNullOrWhiteSpace(reason))
            throw new ArgumentException("Admin identity and decision reason are required.");

        if (decision == ModerationDecisionType.Remove)
        {
            if (AdminReviewStatus != AdminReviewStatus.Published || !IsCurrentPublished)
                throw new InvalidOperationException("Only the current published version can be removed.");

            AdminReviewStatus = AdminReviewStatus.Removed;
            IsCurrentPublished = false;
        }
        else
        {
            if (AdminReviewStatus != AdminReviewStatus.PendingAdminReview
                || AiFlagStatus is not (AiFlagStatus.Passed or AiFlagStatus.Flagged or AiFlagStatus.Partial))
            {
                throw new InvalidOperationException("Admin review requires a completed AI check.");
            }

            AdminReviewStatus = decision switch
            {
                ModerationDecisionType.Approve => AdminReviewStatus.Published,
                ModerationDecisionType.RequestRevision => AdminReviewStatus.RevisionRequested,
                ModerationDecisionType.Reject => AdminReviewStatus.Rejected,
                _ => throw new ArgumentOutOfRangeException(nameof(decision))
            };

            IsCurrentPublished = decision == ModerationDecisionType.Approve;
        }

        var record = new ModerationDecision(
            Id, Version, decision, adminUserId.Trim(), reason.Trim(), decidedAt);
        Decisions.Add(record);
        return record;
    }

    public void SupersedePublishedVersion()
    {
        if (AdminReviewStatus != AdminReviewStatus.Published || !IsCurrentPublished)
            throw new InvalidOperationException("Only a published version can be superseded.");

        IsCurrentPublished = false;
    }
}
