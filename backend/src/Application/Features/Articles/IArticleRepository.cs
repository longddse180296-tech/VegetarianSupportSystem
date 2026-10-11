using Domain.Entities;
using Domain.Enums;

namespace Application.Features.Articles;

public interface IArticleRepository
{
    Task<Article?> GetAsync(Guid id, CancellationToken ct);
    Task<ArticlePage<Article>> ListMineAsync(string ownerId, MyArticleListQuery query, CancellationToken ct);
    Task<ArticlePage<ArticleVersion>> ListPublicAsync(ArticleListQuery query, CancellationToken ct);
    Task<ArticleVersion?> GetPublicAsync(Guid id, CancellationToken ct);
    Task<IReadOnlyList<ArticleVersion>> GetRelatedAsync(Guid articleId, string category, int count, CancellationToken ct);
    Task AddAsync(Article article, CancellationToken ct);
    void Remove(Article article);
    Task SaveAsync(CancellationToken ct);
    Task<T> InTransactionAsync<T>(Func<CancellationToken, Task<T>> action, CancellationToken ct);
}
