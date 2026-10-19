using Domain.Enums;

namespace Domain.Entities;

public sealed class Article
{
    private Article() { }

    public Article(string ownerUserId, string title, string content, string category, string? coverImageUrl, DateTimeOffset now)
        : this(ownerUserId, title, content, category, coverImageUrl, [], now) { }

    public Article(string ownerUserId, string title, string content, string category, string? coverImageUrl,
        IReadOnlyCollection<DietaryType> dietaryTypes, DateTimeOffset now)
        : this(ownerUserId, title, content, [category], coverImageUrl, dietaryTypes, now) { }

    public Article(string ownerUserId, string title, string content, IReadOnlyCollection<string> categories,
        string? coverImageUrl, IReadOnlyCollection<DietaryType> dietaryTypes, DateTimeOffset now)
    {
        Id = Guid.NewGuid();
        OwnerUserId = ownerUserId;
        SetDraft(title, content, categories, coverImageUrl, dietaryTypes, now);
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
    public ICollection<ArticleCategory> Categories { get; private set; } = new List<ArticleCategory>();
    public ICollection<ArticleDietaryType> DietaryTypes { get; private set; } = new List<ArticleDietaryType>();
    public ICollection<ArticleVersion> Versions { get; private set; } = new List<ArticleVersion>();

    public void SetDraft(string title, string content, string category, string? coverImageUrl, DateTimeOffset now)
        => SetDraft(title, content, category, coverImageUrl, [], now);

    public void SetDraft(string title, string content, string category, string? coverImageUrl,
        IReadOnlyCollection<DietaryType> dietaryTypes, DateTimeOffset now)
        => SetDraft(title, content, [category], coverImageUrl, dietaryTypes, now);

    public void SetDraft(string title, string content, IReadOnlyCollection<string> categories,
        string? coverImageUrl, IReadOnlyCollection<DietaryType> dietaryTypes, DateTimeOffset now)
    {
        var normalizedCategories = categories
            .Select(category => category.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(category => category, StringComparer.OrdinalIgnoreCase)
            .ToArray();
        DraftTitle = title;
        DraftContent = content;
        DraftCategory = normalizedCategories[0];
        DraftCoverImageUrl = coverImageUrl;
        Categories.Clear();
        foreach (var category in normalizedCategories)
            Categories.Add(new ArticleCategory { ArticleId = Id, Category = category });
        DietaryTypes.Clear();
        foreach (var dietaryType in dietaryTypes.Distinct().OrderBy(x => x))
            DietaryTypes.Add(new ArticleDietaryType { ArticleId = Id, DietaryType = dietaryType });
        UpdatedAt = now;
    }

    public void LinkSubmission(ModerationSubmission submission, DateTimeOffset now)
    {
        if (ModerationContentId is not null && ModerationContentId != submission.ContentId)
            throw new InvalidOperationException("Moderation content identity cannot change.");
        ModerationContentId = submission.ContentId;
        Versions.Add(new ArticleVersion(Id, submission, DraftTitle, DraftContent,
            Categories.Select(x => x.Category).ToArray(), DraftCoverImageUrl,
            DietaryTypes.Select(x => x.DietaryType).ToArray(), now));
        UpdatedAt = now;
    }

    public void LinkSubmission(Guid moderationContentId, Guid submissionId, int version, DateTimeOffset now)
    {
        if (ModerationContentId is not null && ModerationContentId != moderationContentId)
            throw new InvalidOperationException("Moderation content identity cannot change.");
        ModerationContentId = moderationContentId;
        Versions.Add(new ArticleVersion(Id, submissionId, version, DraftTitle, DraftContent,
            Categories.Select(x => x.Category).ToArray(), DraftCoverImageUrl,
            DietaryTypes.Select(x => x.DietaryType).ToArray(), now));
        UpdatedAt = now;
    }
}

public sealed class ArticleCategory
{
    public Guid ArticleId { get; set; }
    public Article? Article { get; set; }
    public string Category { get; set; } = string.Empty;
}

public sealed class ArticleDietaryType
{
    public Guid ArticleId { get; set; }
    public Article? Article { get; set; }
    public DietaryType DietaryType { get; set; }
}
