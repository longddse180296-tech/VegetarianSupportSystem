using Domain.Enums;

namespace Application.Features.Articles;

public sealed record ArticleDraftRequest(string Title, string Content, string Category, string? CoverImageUrl);
public sealed record ArticleListQuery(string? Search = null, string? Category = null, int Page = 1, int PageSize = 20);
public sealed record MyArticleListQuery(AdminReviewStatus? Status = null, AiFlagStatus? AiStatus = null,
    int Page = 1, int PageSize = 20);
public sealed record ArticlePage<T>(IReadOnlyList<T> Items, int TotalCount, int Page, int PageSize);

public sealed record ArticleSummary(Guid Id, string Title, string Category, string? CoverImageUrl,
    string AuthorId, int Version, DateTimeOffset PublishedAt);
public sealed record ArticleDetail(Guid Id, string Title, string Content, string Category,
    string? CoverImageUrl, string AuthorId, int Version, DateTimeOffset PublishedAt,
    IReadOnlyList<ArticleSummary> RelatedArticles);
public sealed record ArticleVersionInfo(int Version, Guid SubmissionId, AiFlagStatus AiStatus,
    AdminReviewStatus AdminStatus, string? AiSummary, string? AdminFeedback, DateTimeOffset SubmittedAt);
public sealed record MyArticleDetail(Guid Id, string Title, string Content, string Category,
    string? CoverImageUrl, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt,
    AdminReviewStatus Status, ArticleSummary? PublishedVersion,
    IReadOnlyList<ArticleVersionInfo> Versions);

public enum ArticleError { Validation, NotFound, Conflict }
public sealed class ArticleException(ArticleError error, string message) : Exception(message)
{
    public ArticleError Error { get; } = error;
}
