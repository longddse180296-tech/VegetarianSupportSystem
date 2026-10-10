using Application.Features.Articles;
using Application.Features.Moderation;
using Domain.Entities;
using Domain.Enums;

namespace Domain.Tests;

public sealed class ArticleWorkflowTests
{
    [Fact]
    public void SubmittedVersionKeepsItsSnapshotWhenDraftChanges()
    {
        var now = DateTimeOffset.UtcNow;
        var article = new Article("owner", "First", "Original", "Health", null, now);
        var submission = ModerationSubmission.Submit(Guid.NewGuid(), 1, ModeratedContentType.Article,
            "owner", "First", "Original", null, now);

        article.LinkSubmission(submission, now);
        article.SetDraft("Revised", "New text", "Recipes", "https://example.com/cover.jpg", now);

        var first = Assert.Single(article.Versions);
        Assert.Equal("First", first.Title);
        Assert.Equal("Original", first.Content);
        Assert.Equal("Health", first.Category);
        Assert.Null(first.CoverImageUrl);
        Assert.Equal("Revised", article.DraftTitle);
    }

    [Fact]
    public async Task OtherAuthorCannotReadUpdateOrDelete()
    {
        var article = new Article("owner", "First", "Original", "Health", null, DateTimeOffset.UtcNow);
        var service = new ArticleService(new SingleArticleRepository(article), new ModerationService(new EmptyModerationRepository()));
        var request = new ArticleDraftRequest("Changed", "Content", "Health", null);

        Assert.Equal(ArticleError.NotFound, (await Assert.ThrowsAsync<ArticleException>(
            () => service.GetMineAsync(article.Id, "other", CancellationToken.None))).Error);
        Assert.Equal(ArticleError.NotFound, (await Assert.ThrowsAsync<ArticleException>(
            () => service.UpdateAsync(article.Id, "other", request, CancellationToken.None))).Error);
        Assert.Equal(ArticleError.NotFound, (await Assert.ThrowsAsync<ArticleException>(
            () => service.DeleteAsync(article.Id, "other", CancellationToken.None))).Error);
        Assert.Equal("First", article.DraftTitle);
    }

    [Fact]
    public async Task PendingSubmissionCannotBeEditedOrDeleted()
    {
        var now = DateTimeOffset.UtcNow;
        var article = new Article("owner", "First", "Original", "Health", null, now);
        article.LinkSubmission(ModerationSubmission.Submit(Guid.NewGuid(), 1,
            ModeratedContentType.Article, "owner", "First", "Original", null, now), now);
        var service = new ArticleService(new SingleArticleRepository(article), new ModerationService(new EmptyModerationRepository()));

        Assert.Equal(ArticleError.Conflict, (await Assert.ThrowsAsync<ArticleException>(
            () => service.UpdateAsync(article.Id, "owner", new("Changed", "Text", "Health", null), CancellationToken.None))).Error);
        Assert.Equal(ArticleError.Conflict, (await Assert.ThrowsAsync<ArticleException>(
            () => service.DeleteAsync(article.Id, "owner", CancellationToken.None))).Error);
    }

    [Fact]
    public void PublishedVersionStaysCurrentWhileRevisionIsPending()
    {
        var now = DateTimeOffset.UtcNow;
        var article = new Article("owner", "Published title", "Approved text", "Health", null, now);
        var first = ModerationSubmission.Submit(Guid.NewGuid(), 1, ModeratedContentType.Article,
            "owner", "Published title", "Approved text", null, now);
        first.RecordAiResult(AiFlagStatus.Passed, "Checked", "Text", null, now);
        first.Decide(ModerationDecisionType.Approve, "admin", "Approved", now);
        article.LinkSubmission(first, now);

        article.SetDraft("Revised title", "Unreviewed text", "Health", null, now);
        var second = ModerationSubmission.Submit(first.ContentId, 2, ModeratedContentType.Article,
            "owner", article.DraftTitle, article.DraftContent, null, now);
        article.LinkSubmission(second, now);

        Assert.True(first.IsCurrentPublished);
        Assert.Equal(AdminReviewStatus.Published, first.AdminReviewStatus);
        Assert.Equal(AdminReviewStatus.Submitted, second.AdminReviewStatus);
        Assert.Equal("Approved text", article.Versions.Single(x => x.Version == 1).Content);
        Assert.Equal("Unreviewed text", article.Versions.Single(x => x.Version == 2).Content);
    }

    private sealed class SingleArticleRepository(Article article) : IArticleRepository
    {
        public Task<Article?> GetAsync(Guid id, CancellationToken ct) => Task.FromResult<Article?>(article.Id == id ? article : null);
        public Task<ArticlePage<Article>> ListMineAsync(string ownerId, MyArticleListQuery query, CancellationToken ct) => throw new NotImplementedException();
        public Task<ArticlePage<ArticleVersion>> ListPublicAsync(ArticleListQuery query, CancellationToken ct) => throw new NotImplementedException();
        public Task<ArticleVersion?> GetPublicAsync(Guid id, CancellationToken ct) => throw new NotImplementedException();
        public Task<IReadOnlyList<ArticleVersion>> GetRelatedAsync(Guid articleId, string category, int count, CancellationToken ct) => throw new NotImplementedException();
        public Task AddAsync(Article value, CancellationToken ct) => throw new NotImplementedException();
        public void Remove(Article value) => throw new NotImplementedException();
        public Task SaveAsync(CancellationToken ct) => Task.CompletedTask;
        public Task<T> InTransactionAsync<T>(Func<CancellationToken, Task<T>> action, CancellationToken ct) => throw new NotImplementedException();
    }

    private sealed class EmptyModerationRepository : IModerationRepository
    {
        public Task<ModerationSubmission?> GetByIdAsync(Guid id, CancellationToken ct) => throw new NotImplementedException();
        public Task<ModerationSubmission?> GetLatestForContentAsync(Guid contentId, CancellationToken ct) => throw new NotImplementedException();
        public Task<ModerationSubmission?> GetCurrentPublishedAsync(Guid contentId, CancellationToken ct) => throw new NotImplementedException();
        public Task<ModerationPage> SearchAsync(ModerationSearch search, CancellationToken ct) => throw new NotImplementedException();
        public Task AddAsync(ModerationSubmission submission, CancellationToken ct) => throw new NotImplementedException();
        public Task SaveChangesAsync(CancellationToken ct) => throw new NotImplementedException();
        public Task ExecuteInTransactionAsync(Func<CancellationToken, Task> operation, CancellationToken ct) => throw new NotImplementedException();
    }
}
