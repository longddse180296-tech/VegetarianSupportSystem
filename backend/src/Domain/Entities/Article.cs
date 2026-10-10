namespace Domain.Entities;

public sealed class Article
{
    private Article() { }

    public Article(string ownerUserId, string title, string content, string category, string? coverImageUrl, DateTimeOffset now)
    {
        Id = Guid.NewGuid();
        OwnerUserId = ownerUserId;
        SetDraft(title, content, category, coverImageUrl, now);
        CreatedAt = now;
    }

    public Guid Id { get; private set; }
    public string OwnerUserId { get; private set; } = string.Empty;
    public string DraftTitle { get; private set; } = string.Empty;
    public string DraftContent { get; private set; } = string.Empty;
    public string DraftCategory { get; private set; } = string.Empty;
    public string? DraftCoverImageUrl { get; private set; }
    public Guid? ModerationContentId { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }
    public byte[] RowVersion { get; private set; } = [];
    public ICollection<ArticleVersion> Versions { get; private set; } = new List<ArticleVersion>();

    public void SetDraft(string title, string content, string category, string? coverImageUrl, DateTimeOffset now)
    {
        DraftTitle = title;
        DraftContent = content;
        DraftCategory = category;
        DraftCoverImageUrl = coverImageUrl;
        UpdatedAt = now;
    }

    public void LinkSubmission(ModerationSubmission submission, DateTimeOffset now)
    {
        if (ModerationContentId is not null && ModerationContentId != submission.ContentId)
            throw new InvalidOperationException("Moderation content identity cannot change.");
        ModerationContentId = submission.ContentId;
        Versions.Add(new ArticleVersion(Id, submission, DraftTitle, DraftContent,
            DraftCategory, DraftCoverImageUrl, now));
        UpdatedAt = now;
    }

    public void LinkSubmission(Guid moderationContentId, Guid submissionId, int version, DateTimeOffset now)
    {
        if (ModerationContentId is not null && ModerationContentId != moderationContentId)
            throw new InvalidOperationException("Moderation content identity cannot change.");
        ModerationContentId = moderationContentId;
        Versions.Add(new ArticleVersion(Id, submissionId, version, DraftTitle, DraftContent,
            DraftCategory, DraftCoverImageUrl, now));
        UpdatedAt = now;
    }
}
