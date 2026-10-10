namespace Domain.Entities;

public sealed class ArticleVersion
{
    private ArticleVersion() { }

    public ArticleVersion(Guid articleId, ModerationSubmission submission, string title,
        string content, string category, string? coverImageUrl, DateTimeOffset submittedAt)
    {
        Id = Guid.NewGuid();
        ArticleId = articleId;
        SubmissionId = submission.Id;
        Submission = submission;
        Version = submission.Version;
        Title = title;
        Content = content;
        Category = category;
        CoverImageUrl = coverImageUrl;
        SubmittedAt = submittedAt;
    }

    public ArticleVersion(Guid articleId, Guid submissionId, int version, string title,
        string content, string category, string? coverImageUrl, DateTimeOffset submittedAt)
    {
        Id = Guid.NewGuid();
        ArticleId = articleId;
        SubmissionId = submissionId;
        Version = version;
        Title = title;
        Content = content;
        Category = category;
        CoverImageUrl = coverImageUrl;
        SubmittedAt = submittedAt;
    }

    public Guid Id { get; private set; }
    public Guid ArticleId { get; private set; }
    public Guid SubmissionId { get; private set; }
    public int Version { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string Content { get; private set; } = string.Empty;
    public string Category { get; private set; } = string.Empty;
    public string? CoverImageUrl { get; private set; }
    public DateTimeOffset SubmittedAt { get; private set; }
    public ModerationSubmission Submission { get; private set; } = null!;
}
