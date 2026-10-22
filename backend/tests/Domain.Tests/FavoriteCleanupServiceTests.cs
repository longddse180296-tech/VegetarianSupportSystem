using Application.Features.Favorites;
using Application.Features.Moderation;
using Application.Features.Restaurants;
using Application.Features.Videos;
using Domain.Entities;
using Domain.Enums;

namespace Domain.Tests;

public sealed class FavoriteCleanupServiceTests
{
    [Theory]
    [InlineData(ModeratedContentType.Article, FavoriteTargetType.Article)]
    [InlineData(ModeratedContentType.Video, FavoriteTargetType.Video)]
    public async Task RemovingPublishedContentRemovesAllLinkedFavorites(
        ModeratedContentType contentType,
        FavoriteTargetType favoriteTargetType)
    {
        var submission = PublishedSubmission(contentType);
        var moderation = new SingleSubmissionRepository(submission);
        var favorites = new CapturingFavoriteRepository();
        var publication = new CapturingVideoPublication();
        var service = new ModerationService(moderation, publication, favorites);

        await service.DecideAsync(submission.Id, ModerationDecisionType.Remove,
            "admin", "Removed from publication", CancellationToken.None);

        Assert.Equal((favoriteTargetType, submission.ContentId), favorites.RemovedTarget);
        Assert.True(moderation.Saved);
        if (contentType == ModeratedContentType.Video)
            Assert.Equal((submission.ContentId, submission.Id, false), publication.LastDecision);
        else
            Assert.Null(publication.LastDecision);
    }

    [Fact]
    public async Task DeactivatingRestaurantRemovesAllLinkedFavorites()
    {
        var restaurant = new Restaurant { Name = "Chay Mộc", Address = "1 Quận 3" };
        var repository = new SingleRestaurantRepository(restaurant);
        var favorites = new CapturingFavoriteRepository();
        var service = new RestaurantService(repository, favorites);

        await service.DeactivateAsync(restaurant.Id, CancellationToken.None);

        Assert.False(restaurant.IsActive);
        Assert.Equal((FavoriteTargetType.Restaurant, restaurant.Id), favorites.RemovedTarget);
        Assert.True(repository.Saved);
    }

    private static ModerationSubmission PublishedSubmission(ModeratedContentType contentType)
    {
        var now = DateTimeOffset.UtcNow;
        var submission = ModerationSubmission.Submit(Guid.NewGuid(), 1, contentType, "author",
            "Title", "Body", contentType == ModeratedContentType.Video ? "video.mp4" : null, now);
        if (contentType == ModeratedContentType.Article)
            submission.RecordAiResult(AiFlagStatus.Passed, "Reviewed", "Article body", null, now);
        submission.Decide(ModerationDecisionType.Approve, "admin", "Approved", now);
        return submission;
    }

    private sealed class CapturingFavoriteRepository : IFavoriteRepository
    {
        public (FavoriteTargetType Type, Guid TargetId)? RemovedTarget { get; private set; }

        public void RemoveAllByTarget(FavoriteTargetType targetType, Guid targetId) =>
            RemovedTarget = (targetType, targetId);

        public Task<IReadOnlyList<Favorite>> ListAsync(string userId, FavoriteTargetType? targetType, CancellationToken ct) =>
            throw new NotImplementedException();

        public Task<Favorite?> GetAsync(Guid id, string userId, CancellationToken ct) =>
            throw new NotImplementedException();

        public Task<bool> ExistsAsync(string userId, FavoriteTargetType targetType, Guid targetId, CancellationToken ct) =>
            throw new NotImplementedException();

        public Task<FavoriteTargetInfo?> GetPublicTargetAsync(FavoriteTargetType targetType, Guid targetId, CancellationToken ct) =>
            throw new NotImplementedException();

        public void Add(Favorite favorite) => throw new NotImplementedException();
        public void Remove(Favorite favorite) => throw new NotImplementedException();
        public Task SaveAsync(CancellationToken ct) => throw new NotImplementedException();
    }

    private sealed class SingleSubmissionRepository(ModerationSubmission submission) : IModerationRepository
    {
        public bool Saved { get; private set; }

        public Task<ModerationSubmission?> GetByIdAsync(Guid id, CancellationToken ct) =>
            Task.FromResult<ModerationSubmission?>(submission.Id == id ? submission : null);

        public Task<ModerationSubmission?> GetLatestForContentAsync(Guid contentId, CancellationToken ct) =>
            Task.FromResult<ModerationSubmission?>(submission.ContentId == contentId ? submission : null);

        public Task<ModerationSubmission?> GetCurrentPublishedAsync(Guid contentId, CancellationToken ct) =>
            Task.FromResult<ModerationSubmission?>(submission.ContentId == contentId && submission.IsCurrentPublished ? submission : null);

        public Task<IReadOnlyList<Guid>> GetCheckingIdsAsync(int count, CancellationToken ct) =>
            throw new NotImplementedException();

        public Task<ModerationPage> SearchAsync(ModerationSearch search, CancellationToken ct) =>
            throw new NotImplementedException();

        public Task AddAsync(ModerationSubmission value, CancellationToken ct) => throw new NotImplementedException();

        public Task SaveChangesAsync(CancellationToken ct)
        {
            Saved = true;
            return Task.CompletedTask;
        }

        public Task ExecuteInTransactionAsync(Func<CancellationToken, Task> operation, CancellationToken ct) => operation(ct);
    }

    private sealed class CapturingVideoPublication : IVideoPublication
    {
        public (Guid VideoId, Guid SubmissionId, bool Published)? LastDecision { get; private set; }

        public Task ApplyDecisionAsync(Guid videoId, Guid submissionId, bool published, CancellationToken ct)
        {
            LastDecision = (videoId, submissionId, published);
            return Task.CompletedTask;
        }
    }

    private sealed class SingleRestaurantRepository(Restaurant restaurant) : IRestaurantRepository
    {
        public bool Saved { get; private set; }

        public Task<IReadOnlyList<Restaurant>> ListAsync(RestaurantListQuery query, bool includeInactive, CancellationToken ct) =>
            throw new NotImplementedException();

        public Task<Restaurant?> GetAsync(Guid id, CancellationToken ct) =>
            Task.FromResult<Restaurant?>(restaurant.Id == id ? restaurant : null);

        public Task<bool> NameExistsAsync(string name, Guid? exceptId, CancellationToken ct) =>
            throw new NotImplementedException();

        public void Add(Restaurant entity) => throw new NotImplementedException();

        public Task SaveAsync(CancellationToken ct)
        {
            Saved = true;
            return Task.CompletedTask;
        }
    }
}
