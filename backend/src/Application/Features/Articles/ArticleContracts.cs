// Chức năng: bài viết và phiên bản gửi duyệt. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using Domain.Enums;

namespace Application.Features.Articles;

// ArticleDraftRequest: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record ArticleDraftRequest(string Title, string Content, string? Category, string? CoverImageUrl,
    IReadOnlyList<DietaryType>? DietaryTypes = null, IReadOnlyList<string>? Categories = null,
    DietaryType? DietaryType = null);
// ArticleListQuery: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record ArticleListQuery(string? Search = null, string? Category = null, DietaryType? DietaryType = null,
    int Page = 1, int PageSize = 20);
// MyArticleListQuery: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record MyArticleListQuery(AdminReviewStatus? Status = null, AiFlagStatus? AiStatus = null,
    int Page = 1, int PageSize = 20);
// ArticlePage: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record ArticlePage<T>(IReadOnlyList<T> Items, int TotalCount, int Page, int PageSize);

// ArticleSummary: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record ArticleSummary(Guid Id, string Title, string Category, IReadOnlyList<string> Categories,
    IReadOnlyList<DietaryType> DietaryTypes, DietaryType? DietaryType, string? CoverImageUrl,
    string AuthorId, string? AuthorName, int Version, DateTimeOffset PublishedAt);
// ArticleDetail: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record ArticleDetail(Guid Id, string Title, string Content, string Category, IReadOnlyList<string> Categories,
    IReadOnlyList<DietaryType> DietaryTypes, DietaryType? DietaryType, string? CoverImageUrl,
    string AuthorId, string? AuthorName, int Version, DateTimeOffset PublishedAt,
    IReadOnlyList<ArticleSummary> RelatedArticles);
// ArticleVersionInfo: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record ArticleVersionInfo(int Version, Guid SubmissionId, AiFlagStatus AiStatus,
    AdminReviewStatus AdminStatus, string? AiSummary, string? AdminFeedback, DateTimeOffset SubmittedAt,
    string? SystemRejectionReason = null);
// MyArticleDetail: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record MyArticleDetail(Guid Id, string Title, string Content, string Category, IReadOnlyList<string> Categories,
    IReadOnlyList<DietaryType> DietaryTypes, DietaryType? DietaryType, string? CoverImageUrl,
    DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt,
    AdminReviewStatus Status, ArticleSummary? PublishedVersion,
    IReadOnlyList<ArticleVersionInfo> Versions);

// ArticleError: định nghĩa các giá trị trạng thái được phép.
public enum ArticleError { Validation, NotFound, Conflict }
// ArticleException: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class ArticleException(ArticleError error, string message) : Exception(message)
{
    public ArticleError Error { get; } = error;
}
