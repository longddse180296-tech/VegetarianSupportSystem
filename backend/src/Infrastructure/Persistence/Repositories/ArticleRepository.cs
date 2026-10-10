using Application.Features.Articles;
using Domain.Entities;
using Domain.Enums;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public sealed class ArticleRepository(AppDbContext db) : IArticleRepository
{
    private IQueryable<Article> WithVersions(bool tracking = false)
    {
        var query = db.Articles.Include(x => x.Versions).ThenInclude(x => x.Submission)
            .ThenInclude(x => x.Decisions).AsSplitQuery();
        return tracking ? query : query.AsNoTracking();
    }

    public Task<Article?> GetAsync(Guid id, CancellationToken ct) =>
        WithVersions(true).FirstOrDefaultAsync(x => x.Id == id, ct);

    public async Task<ArticlePage<Article>> ListMineAsync(string ownerId, MyArticleListQuery search, CancellationToken ct)
    {
        var query = db.Articles.AsNoTracking().Where(x => x.OwnerUserId == ownerId);
        if (search.Status is { } status)
        {
            query = status == AdminReviewStatus.Draft
                ? query.Where(x => !x.Versions.Any())
                : query.Where(x => x.Versions.OrderByDescending(v => v.Version)
                    .Select(v => v.Submission.AdminReviewStatus).FirstOrDefault() == status);
        }
        if (search.AiStatus is { } aiStatus)
            query = query.Where(x => x.Versions.OrderByDescending(v => v.Version)
                .Select(v => v.Submission.AiFlagStatus).FirstOrDefault() == aiStatus);
        var count = await query.CountAsync(ct);
        var ids = await query.OrderByDescending(x => x.UpdatedAt).ThenBy(x => x.Id)
            .Skip((search.Page - 1) * search.PageSize).Take(search.PageSize)
            .Select(x => x.Id).ToArrayAsync(ct);
        var articles = await WithVersions().Where(x => ids.Contains(x.Id)).ToListAsync(ct);
        var ordered = ids.Select(id => articles.Single(x => x.Id == id)).ToArray();
        return new(ordered, count, search.Page, search.PageSize);
    }

    private IQueryable<ArticleVersion> PublicVersions() =>
        db.Set<ArticleVersion>().AsNoTracking()
            .Where(x => x.Submission.AdminReviewStatus == AdminReviewStatus.Published
                && x.Submission.IsCurrentPublished);

    private IQueryable<ArticleVersion> PublicWithDetails() => PublicVersions()
        .Include(x => x.Submission).ThenInclude(x => x.Decisions).AsSplitQuery();

    public async Task<ArticlePage<ArticleVersion>> ListPublicAsync(ArticleListQuery search, CancellationToken ct)
    {
        var query = PublicVersions();
        if (!string.IsNullOrWhiteSpace(search.Search))
        {
            var term = search.Search.Trim();
            query = query.Where(x => x.Title.Contains(term) || x.Content.Contains(term));
        }
        if (!string.IsNullOrWhiteSpace(search.Category))
        {
            var category = search.Category.Trim();
            query = query.Where(x => x.Category == category);
        }
        var count = await query.CountAsync(ct);
        var ids = await query.OrderByDescending(x => x.SubmittedAt).ThenBy(x => x.Id)
            .Skip((search.Page - 1) * search.PageSize).Take(search.PageSize)
            .Select(x => x.Id).ToArrayAsync(ct);
        var versions = await PublicWithDetails().Where(x => ids.Contains(x.Id)).ToListAsync(ct);
        return new(ids.Select(id => versions.Single(x => x.Id == id)).ToArray(), count, search.Page, search.PageSize);
    }

    public Task<ArticleVersion?> GetPublicAsync(Guid id, CancellationToken ct) =>
        PublicWithDetails().FirstOrDefaultAsync(x => x.ArticleId == id, ct);

    public async Task<IReadOnlyList<ArticleVersion>> GetRelatedAsync(Guid articleId, string category, int count, CancellationToken ct) =>
        await PublicWithDetails().Where(x => x.ArticleId != articleId && x.Category == category)
            .OrderByDescending(x => x.SubmittedAt).ThenBy(x => x.Id).Take(count).ToListAsync(ct);

    public Task AddAsync(Article article, CancellationToken ct) => db.Articles.AddAsync(article, ct).AsTask();
    public void Remove(Article article) => db.Articles.Remove(article);

    public async Task SaveAsync(CancellationToken ct)
    {
        try { await db.SaveChangesAsync(ct); }
        catch (DbUpdateConcurrencyException)
        { throw new ArticleException(ArticleError.Conflict, "Article changed during the request."); }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException { Number: 2601 or 2627 })
        { throw new ArticleException(ArticleError.Conflict, "Article version was submitted concurrently."); }
    }

    public async Task<T> InTransactionAsync<T>(Func<CancellationToken, Task<T>> action, CancellationToken ct)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        var result = await action(ct);
        await transaction.CommitAsync(ct);
        return result;
    }
}
