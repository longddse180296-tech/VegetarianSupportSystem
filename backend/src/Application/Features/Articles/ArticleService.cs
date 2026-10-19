using Application.Features.Moderation;
using Domain.Entities;
using Domain.Enums;

namespace Application.Features.Articles;

public sealed class ArticleService(IArticleRepository repository, ModerationService moderation)
{
    public async Task<MyArticleDetail> CreateAsync(string ownerId, ArticleDraftRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(ownerId) || ownerId.Length > 450)
            throw new ArticleException(ArticleError.Validation, "A valid owner is required.");
        Validate(request);
        var article = new Article(ownerId, request.Title.Trim(), request.Content.Trim(), Categories(request),
            request.CoverImageUrl?.Trim(), DietaryTypes(request), DateTimeOffset.UtcNow);
        await repository.AddAsync(article, ct);
        await repository.SaveAsync(ct);
        return ToMine(article);
    }

    public async Task<MyArticleDetail> UpdateAsync(Guid id, string ownerId, ArticleDraftRequest request, CancellationToken ct)
    {
        Validate(request);
        var article = await GetOwnedAsync(id, ownerId, ct);
        EnsureEditable(article);
        article.SetDraft(request.Title.Trim(), request.Content.Trim(), Categories(request),
            request.CoverImageUrl?.Trim(), DietaryTypes(request), DateTimeOffset.UtcNow);
        await repository.SaveAsync(ct);
        return ToMine(article);
    }

    public async Task DeleteAsync(Guid id, string ownerId, CancellationToken ct)
    {
        var article = await GetOwnedAsync(id, ownerId, ct);
        if (article.Versions.Count != 0)
            throw new ArticleException(ArticleError.Conflict, "Only an unsent draft can be deleted.");
        repository.Remove(article);
        await repository.SaveAsync(ct);
    }

    public async Task<MyArticleDetail> SubmitAsync(Guid id, string ownerId, CancellationToken ct)
    {
        return await repository.InTransactionAsync(async token =>
        {
            var article = await GetOwnedAsync(id, ownerId, token);
            EnsureEditable(article);
            var submission = await moderation.SubmitAsync(ownerId,
                new SubmitModerationCommand(article.ModerationContentId, ModeratedContentType.Article,
                    article.DraftTitle, article.DraftContent, article.DraftCoverImageUrl), token);
            article.LinkSubmission(submission, DateTimeOffset.UtcNow);
            await repository.SaveAsync(token);
            return ToMine(article);
        }, ct);
    }

    public async Task<MyArticleDetail> GetMineAsync(Guid id, string ownerId, CancellationToken ct) =>
        ToMine(await GetOwnedAsync(id, ownerId, ct));

    public async Task<ArticlePage<MyArticleDetail>> ListMineAsync(string ownerId, MyArticleListQuery query, CancellationToken ct)
    {
        ValidatePage(query.Page, query.PageSize);
        if (query.Status is { } status && !Enum.IsDefined(status))
            throw new ArticleException(ArticleError.Validation, "Invalid status.");
        if (query.AiStatus is { } aiStatus && !Enum.IsDefined(aiStatus))
            throw new ArticleException(ArticleError.Validation, "Invalid AI status.");
        var page = await repository.ListMineAsync(ownerId, query, ct);
        return new(page.Items.Select(ToMine).ToArray(), page.TotalCount, page.Page, page.PageSize);
    }

    public async Task<ArticlePage<ArticleSummary>> ListPublicAsync(ArticleListQuery query, CancellationToken ct)
    {
        ValidatePage(query.Page, query.PageSize);
        if (query.Search?.Length > 120 || query.Category?.Length > 120 ||
            (query.DietaryType is { } dietaryType && !Enum.IsDefined(dietaryType)))
            throw new ArticleException(ArticleError.Validation, "Search and category must be at most 120 characters.");
        var page = await repository.ListPublicAsync(query, ct);
        return new(page.Items.Select(ToSummary).ToArray(), page.TotalCount, page.Page, page.PageSize);
    }

    public async Task<ArticleDetail> GetPublicAsync(Guid id, CancellationToken ct)
    {
        var version = await repository.GetPublicAsync(id, ct)
            ?? throw new ArticleException(ArticleError.NotFound, "Article was not found.");
        var related = await repository.GetRelatedAsync(id, Categories(version.Categories), 4, ct);
        var dietaryTypes = ToDietaryTypes(version.DietaryTypes);
        return new(version.ArticleId, version.Title, version.Content, version.Category, Categories(version.Categories), dietaryTypes,
            dietaryTypes.Count == 1 ? dietaryTypes[0] : null, version.CoverImageUrl, version.Submission.OwnerUserId, version.Version,
            PublishedAt(version), related.Select(ToSummary).ToArray());
    }

    private async Task<Article> GetOwnedAsync(Guid id, string ownerId, CancellationToken ct)
    {
        var article = await repository.GetAsync(id, ct);
        if (article is null || article.OwnerUserId != ownerId)
            throw new ArticleException(ArticleError.NotFound, "Article was not found.");
        return article;
    }

    private static void EnsureEditable(Article article)
    {
        var latest = article.Versions.OrderByDescending(x => x.Version).FirstOrDefault();
        if (latest?.Submission.AdminReviewStatus is AdminReviewStatus.Submitted or AdminReviewStatus.PendingAdminReview)
            throw new ArticleException(ArticleError.Conflict, "This article is still under review.");
        if (latest?.Submission.AdminReviewStatus == AdminReviewStatus.Removed)
            throw new ArticleException(ArticleError.Conflict, "A removed article cannot be edited or submitted.");
    }

    private static MyArticleDetail ToMine(Article article)
    {
        var versions = article.Versions.OrderByDescending(x => x.Version).ToArray();
        var published = versions.FirstOrDefault(x => x.Submission.AdminReviewStatus == AdminReviewStatus.Published
            && x.Submission.IsCurrentPublished);
        var dietaryTypes = ToDietaryTypes(article.DietaryTypes);
        return new(article.Id, article.DraftTitle, article.DraftContent, article.DraftCategory, Categories(article.Categories),
            dietaryTypes, dietaryTypes.Count == 1 ? dietaryTypes[0] : null, article.DraftCoverImageUrl, article.CreatedAt, article.UpdatedAt,
            versions.FirstOrDefault()?.Submission.AdminReviewStatus ?? AdminReviewStatus.Draft,
            published is null ? null : ToSummary(published),
            versions.Select(x => new ArticleVersionInfo(x.Version, x.SubmissionId,
                x.Submission.AiFlagStatus, x.Submission.AdminReviewStatus, x.Submission.AiSummary,
                x.Submission.Decisions.OrderByDescending(d => d.DecidedAt).FirstOrDefault()?.Reason,
                x.SubmittedAt)).ToArray());
    }

    private static ArticleSummary ToSummary(ArticleVersion version)
    {
        var dietaryTypes = ToDietaryTypes(version.DietaryTypes);
        return new(version.ArticleId, version.Title, version.Category, Categories(version.Categories), dietaryTypes,
            dietaryTypes.Count == 1 ? dietaryTypes[0] : null, version.CoverImageUrl, version.Submission.OwnerUserId, version.Version,
            PublishedAt(version));
    }

    private static DateTimeOffset PublishedAt(ArticleVersion version) =>
        version.Submission.Decisions.Where(x => x.Decision == ModerationDecisionType.Approve)
            .OrderByDescending(x => x.DecidedAt).Select(x => x.DecidedAt).FirstOrDefault();

    private static void Validate(ArticleDraftRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title) || request.Title.Trim().Length > 200
            || string.IsNullOrWhiteSpace(request.Content) || request.Content.Trim().Length > 50_000
            || request.CoverImageUrl?.Length > 2_000
            || (request.CoverImageUrl is { Length: > 0 } image &&
                (!Uri.TryCreate(image, UriKind.Absolute, out var uri) || uri.Scheme is not ("http" or "https"))))
            throw new ArticleException(ArticleError.Validation, "Title, content and cover image URL are invalid.");

        _ = Categories(request);
        _ = DietaryTypes(request);
    }

    private static IReadOnlyList<DietaryType> DietaryTypes(ArticleDraftRequest request)
    {
        var dietaryTypes = request.DietaryType is { } dietaryType
            ? [dietaryType]
            : request.DietaryTypes ?? [];
        if (dietaryTypes.Count > 1 || dietaryTypes.Distinct().Count() != dietaryTypes.Count ||
            dietaryTypes.Any(type => !Enum.IsDefined(type)))
            throw new ArticleException(ArticleError.Validation, "Choose at most one dietary type.");
        return dietaryTypes;
    }

    private static IReadOnlyList<string> Categories(ArticleDraftRequest request)
    {
        var categories = request.Categories is { Count: > 0 }
            ? request.Categories
            : string.IsNullOrWhiteSpace(request.Category) ? [] : [request.Category];
        return NormalizeCategories(categories);
    }

    private static IReadOnlyList<string> Categories(IEnumerable<ArticleCategory> source) =>
        NormalizeCategories(source.Select(item => item.Category));

    private static IReadOnlyList<string> Categories(IEnumerable<ArticleVersionCategory> source) =>
        NormalizeCategories(source.Select(item => item.Category));

    private static IReadOnlyList<string> NormalizeCategories(IEnumerable<string> source)
    {
        var categories = source.Select(category => category?.Trim() ?? string.Empty)
            .Where(category => category.Length > 0)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(category => category, StringComparer.OrdinalIgnoreCase)
            .ToArray();
        if (categories.Length is 0 or > 8 || categories.Any(category => category.Length > 120))
            throw new ArticleException(ArticleError.Validation, "Choose one to eight categories, each up to 120 characters.");
        return categories;
    }

    private static IReadOnlyList<DietaryType> ToDietaryTypes(IEnumerable<ArticleDietaryType> source) =>
        source.Select(x => x.DietaryType).OrderBy(x => x).ToArray();

    private static IReadOnlyList<DietaryType> ToDietaryTypes(IEnumerable<ArticleVersionDietaryType> source) =>
        source.Select(x => x.DietaryType).OrderBy(x => x).ToArray();

    private static void ValidatePage(int page, int pageSize)
    {
        if (page < 1 || pageSize is < 1 or > 100 || (long)(page - 1) * pageSize > int.MaxValue)
            throw new ArticleException(ArticleError.Validation, "Page must be positive and page size must be 1-100.");
    }
}
