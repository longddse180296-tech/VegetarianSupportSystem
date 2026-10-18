using System.ComponentModel.DataAnnotations;
using Api.Controllers;
using Application.Features.Administration;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Persistence;
using Infrastructure.Persistence.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace Domain.Tests;

public sealed class FeaturedContentTests
{
    private static readonly DateTimeOffset Now = new(2026, 10, 17, 8, 0, 0, TimeSpan.Zero);



    [Theory]
    [InlineData("")]
    [InlineData("Recipe")]
    [InlineData("article")]
    [InlineData("1")]
    [InlineData("999")]
    public async Task InvalidContentTypeCannotReadOrWrite(string type)
    {
        var repository = new RecordingRepository();
        var service = new FeaturedContentService(repository, new FixedClock());
        await Assert.ThrowsAsync<ValidationException>(() =>
            service.ListAsync(new() { ContentType = type }, false, default));
        await Assert.ThrowsAsync<ValidationException>(() =>
            service.SetPinnedAsync(type, Guid.NewGuid(), new(true), "admin", default));
        Assert.Equal(0, repository.Calls);
    }

    [Fact]
    public async Task MissingBooleanAndOverflowPaginationCannotReachRepository()
    {
        var repository = new RecordingRepository();
        var service = new FeaturedContentService(repository, new FixedClock());
        await Assert.ThrowsAsync<ValidationException>(() =>
            service.SetPinnedAsync("Article", Guid.NewGuid(), new(null), "admin", default));
        await Assert.ThrowsAsync<ValidationException>(() => service.ListAsync(
            new() { ContentType = "Article", Page = int.MaxValue, PageSize = 100 }, false, default));
        Assert.Equal(0, repository.Calls);
    }

    [Fact]
    public async Task PublicReadsOnlyPinsAndWriteUsesServerActorAndTime()
    {
        var repository = new RecordingRepository();
        var service = new FeaturedContentService(repository, new FixedClock());
        await service.ListAsync(new() { ContentType = "Article", Search = "draft", PageSize = 100 }, true, default);
        Assert.True(repository.PinnedOnly);
        Assert.Null(repository.Search);
        await service.ListAsync(new() { ContentType = "Restaurant", Search = "  quán  " }, false, default);
        Assert.False(repository.PinnedOnly);
        Assert.Equal("quán", repository.Search);
        var id = Guid.NewGuid();
        await service.SetPinnedAsync("Article", id, new(true), "authenticated-admin", default);
        Assert.Equal((FeaturedContentType.Article, id, true, "authenticated-admin", Now), repository.Pin);
    }

    [Fact]
    public void InactiveRestaurantsAndRemovedArticlesAreExcluded()
    {
        var active = new Restaurant { Name = "Active" };
        var inactive = new Restaurant { Name = "Inactive", IsActive = false };
        Assert.Same(active, Assert.Single(FeaturedContentRepository.PublicRestaurants(new[] { inactive, active }.AsQueryable())));

        var submission = Publish(ModeratedContentType.Article);
        var article = new Article("owner", "Published title", "Approved content", "Health",
            "https://example.com/published.jpg", [DietaryType.Vegan], Now);
        article.LinkSubmission(submission, Now);
        article.SetDraft("Unreviewed title", "Private text", "Other", "https://example.com/draft.jpg",
            [DietaryType.OvoVegetarian], Now);
        var pending = ModerationSubmission.Submit(submission.ContentId, 2, ModeratedContentType.Article,
            "owner", article.DraftTitle, article.DraftContent, null, Now);
        article.LinkSubmission(pending, Now);

        var visible = Assert.Single(FeaturedContentRepository.PublicArticles(article.Versions.AsQueryable()));
        Assert.Equal("Published title", visible.Title);
        Assert.Equal("https://example.com/published.jpg", visible.CoverImageUrl);
        Assert.Equal(DietaryType.Vegan, Assert.Single(visible.DietaryTypes).DietaryType);
        submission.Decide(ModerationDecisionType.Remove, "admin", "Removed", Now);
        Assert.Empty(FeaturedContentRepository.PublicArticles(article.Versions.AsQueryable()));
    }

    [Fact]
    public void VideoUsesPublishedSnapshotAndRejectsMismatchedOrRemovedPublication()
    {
        var video = Video.Create("owner", "Published video", "Approved description", null);
        video.SetMedia("published.mp4");
        video.SetThumbnail("published.jpg");
        var published = Publish(ModeratedContentType.Video, video.Id);
        video.Publish(published.Id);
        video.Edit("Private draft title", "Private draft description", null);
        video.SetThumbnail("private-draft.jpg");
        var result = Assert.Single(FeaturedContentRepository.PublicVideos(new[] { video }.AsQueryable(), new[] { published }.AsQueryable()));
        Assert.Equal("Published title", result.Submission.Title);
        Assert.Equal("Approved content", result.Submission.TextContent);
        Assert.Equal("published.jpg", result.Video.PublishedThumbnailKey);
        Assert.NotEqual(result.Submission.Title, video.Title);

        var unrelated = Publish(ModeratedContentType.Video);
        video.Publish(unrelated.Id);
        Assert.Empty(FeaturedContentRepository.PublicVideos(new[] { video }.AsQueryable(), new[] { unrelated }.AsQueryable()));
        video.Publish(published.Id);
        published.Decide(ModerationDecisionType.Remove, "admin", "Removed", Now);
        Assert.Empty(FeaturedContentRepository.PublicVideos(new[] { video }.AsQueryable(), new[] { published }.AsQueryable()));
    }

    [Fact]
    public void PinCandidatesKeepOnlyPinnedEligibleIdsAndOriginalPinTimestamp()
    {
        var activeId = Guid.NewGuid();
        var unpinnedId = Guid.NewGuid();
        var staleId = Guid.NewGuid();
        var pin = new FeaturedContent(FeaturedContentType.Restaurant, activeId, "admin", Now);
        var stale = new FeaturedContent(FeaturedContentType.Restaurant, staleId, "admin", Now);
        var candidates = new[] { activeId, unpinnedId }.AsQueryable();
        var pins = new[] { pin, stale }.AsQueryable();
        var item = Assert.Single(FeaturedContentRepository.PinCandidates(candidates, pins, true));
        Assert.Equal(activeId, item.Id);
        Assert.Equal(Now, item.PinnedAt);
        Assert.Equal(2, FeaturedContentRepository.PinCandidates(candidates, pins, false).Count());
    }

    [Fact]
    public void EligibilityAndPinOrderingTranslateToSqlServerWithoutOpeningDatabase()
    {
        using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlServer("Server=localhost;Database=QueryCompilationOnly;Integrated Security=True;TrustServerCertificate=True")
            .Options);
        var articleIds = FeaturedContentRepository.PublicArticles(db.ArticleVersions).Select(x => x.ArticleId).Distinct();
        var videoIds = FeaturedContentRepository.PublicVideos(db.Videos, db.ModerationSubmissions).Select(x => x.Video.Id);
        var restaurantIds = FeaturedContentRepository.PublicRestaurants(db.Restaurants).Select(x => x.Id);
        foreach (var ids in new[] { articleIds, videoIds, restaurantIds })
        {
            var sql = FeaturedContentRepository.PinCandidates(ids,
                db.FeaturedContent.Where(x => x.ContentType == FeaturedContentType.Article), true)
                .OrderByDescending(x => x.PinnedAt != null).ThenByDescending(x => x.PinnedAt)
                .ThenBy(x => x.Id).Skip(0).Take(6).ToQueryString();
            Assert.Contains("LEFT JOIN", sql);
            Assert.Contains("FeaturedContent", sql);
            Assert.Contains("ORDER BY", sql);
        }
    }

    [Fact]
    public void OnlyAdminEndpointsRequireAdminPolicyAndPublicReadAllowsGuests()
    {
        var authorize = Assert.Single(typeof(AdminFeaturedContentController).GetCustomAttributes(typeof(AuthorizeAttribute), true).Cast<AuthorizeAttribute>());
        Assert.Equal(Api.Authorization.AccountAuthorization.AdminPolicy, authorize.Policy);
        Assert.Single(typeof(FeaturedContentController).GetCustomAttributes(typeof(AllowAnonymousAttribute), true));
    }

    private static ModerationSubmission Publish(ModeratedContentType type, Guid? contentId = null)
    {
        var submission = ModerationSubmission.Submit(contentId ?? Guid.NewGuid(), 1, type,
            "owner", "Published title", "Approved content", "published.mp4", Now);
        if (type == ModeratedContentType.Article)
            submission.RecordAiResult(AiFlagStatus.Passed, "Checked", "Full content", null, Now);
        submission.Decide(ModerationDecisionType.Approve, "admin", "Approved", Now);
        return submission;
    }

    private sealed class FixedClock : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => Now;
    }

    private sealed class RecordingRepository : IFeaturedContentRepository
    {
        public int Calls { get; private set; }
        public string? Search { get; private set; }
        public bool PinnedOnly { get; private set; }
        public (FeaturedContentType, Guid, bool, string, DateTimeOffset) Pin { get; private set; }
        public Task<FeaturedContentPage> ListAsync(FeaturedContentType type, string? search, bool pinnedOnly,
            int page, int pageSize, CancellationToken ct)
        {
            Calls++;
            Search = search;
            PinnedOnly = pinnedOnly;
            return Task.FromResult(new FeaturedContentPage([], 0, page, pageSize));
        }
        public Task SetPinnedAsync(FeaturedContentType type, Guid id, bool pin, string adminId,
            DateTimeOffset now, CancellationToken ct)
        {
            Calls++;
            Pin = (type, id, pin, adminId, now);
            return Task.CompletedTask;
        }
    }
}
