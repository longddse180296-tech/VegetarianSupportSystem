using Domain.Enums;

namespace Domain.Entities;

public sealed class ArticleVersion
{
    private ArticleVersion() { }

    public ArticleVersion(Guid articleId, ModerationSubmission submission, string title,
        string content, string category, string? coverImageUrl, DateTimeOffset submittedAt)
        : this(articleId, submission, title, content, category, coverImageUrl, [], submittedAt) { }

    public ArticleVersion(Guid articleId, ModerationSubmission submission, string title,
        string content, string category, string? coverImageUrl, IReadOnlyCollection<DietaryType> dietaryTypes,
        DateTimeOffset submittedAt)
        : this(articleId, submission, title, content, [category], coverImageUrl, dietaryTypes, submittedAt) { }

    public ArticleVersion(Guid articleId, ModerationSubmission submission, string title,
        string content, IReadOnlyCollection<string> categories, string? coverImageUrl,
        IReadOnlyCollection<DietaryType> dietaryTypes, DateTimeOffset submittedAt)
    {
        Id = Guid.NewGuid();
        ArticleId = articleId;
        SubmissionId = submission.Id;
        Submission = submission;
        Version = submission.Version;
        Title = title;
        Content = content;
        Category = categories.First();
        CoverImageUrl = coverImageUrl;
        SetCategories(categories);
        SetDietaryTypes(dietaryTypes);
        SubmittedAt = submittedAt;
    }

    public ArticleVersion(Guid articleId, Guid submissionId, int version, string title,
        string content, string category, string? coverImageUrl, DateTimeOffset submittedAt)
        : this(articleId, submissionId, version, title, content, category, coverImageUrl, [], submittedAt) { }

    public ArticleVersion(Guid articleId, Guid submissionId, int version, string title,
        string content, string category, string? coverImageUrl, IReadOnlyCollection<DietaryType> dietaryTypes,
        DateTimeOffset submittedAt)
        : this(articleId, submissionId, version, title, content, [category], coverImageUrl, dietaryTypes, submittedAt) { }

    public ArticleVersion(Guid articleId, Guid submissionId, int version, string title,
        string content, IReadOnlyCollection<string> categories, string? coverImageUrl,
        IReadOnlyCollection<DietaryType> dietaryTypes, DateTimeOffset submittedAt)
    {
        Id = Guid.NewGuid();
        ArticleId = articleId;
        SubmissionId = submissionId;
        Version = version;
        Title = title;
        Content = content;
        Category = categories.First();
        CoverImageUrl = coverImageUrl;
        SetCategories(categories);
        SetDietaryTypes(dietaryTypes);
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
    public ICollection<ArticleVersionCategory> Categories { get; private set; } = new List<ArticleVersionCategory>();
    public ICollection<ArticleVersionDietaryType> DietaryTypes { get; private set; } = new List<ArticleVersionDietaryType>();

    private void SetCategories(IReadOnlyCollection<string> categories)
    {
        foreach (var category in categories.Distinct(StringComparer.OrdinalIgnoreCase)
                     .OrderBy(category => category, StringComparer.OrdinalIgnoreCase))
            Categories.Add(new ArticleVersionCategory { ArticleVersionId = Id, Category = category });
    }

    private void SetDietaryTypes(IReadOnlyCollection<DietaryType> dietaryTypes)
    {
        foreach (var dietaryType in dietaryTypes.Distinct().OrderBy(x => x))
            DietaryTypes.Add(new ArticleVersionDietaryType { ArticleVersionId = Id, DietaryType = dietaryType });
    }
}

public sealed class ArticleVersionCategory
{
    public Guid ArticleVersionId { get; set; }
    public ArticleVersion? ArticleVersion { get; set; }
    public string Category { get; set; } = string.Empty;
}

public sealed class ArticleVersionDietaryType
{
    public Guid ArticleVersionId { get; set; }
    public ArticleVersion? ArticleVersion { get; set; }
    public DietaryType DietaryType { get; set; }
}
