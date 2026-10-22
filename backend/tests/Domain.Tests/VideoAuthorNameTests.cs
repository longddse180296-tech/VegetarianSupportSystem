using Application.Features.Moderation;
using Application.Features.Videos;
using Domain.Entities;
using Domain.Enums;

namespace Domain.Tests;

public sealed class VideoAuthorNameTests
{
    [Fact]
    public async Task PublicVideoShowsPublisherNameInDetailAndList()
    {
        var video = Video.Create("owner", "Published video", "Description", null);
        var submission = ModerationSubmission.Submit(video.Id, 1, ModeratedContentType.Video,
            "owner", video.Title, video.Description, null, DateTimeOffset.UtcNow);
        submission.Decide(ModerationDecisionType.Approve, "admin", "Approved", DateTimeOffset.UtcNow);
        video.Publish(submission.Id);
        var service = new VideoService(new SingleVideoRepository(video), new SingleModerationRepository(submission));

        var detail = await service.GetPublicAsync(video.Id, default);
        var page = await service.ListAsync(null, true, 1, 20, default);

        Assert.Equal("Nguyễn Khánh Vĩnh", detail?.AuthorName);
        Assert.Equal("Nguyễn Khánh Vĩnh", Assert.Single(page.Items).AuthorName);
    }

    private sealed class SingleVideoRepository(Video video) : IVideoRepository
    {
        public Task<Video?> GetAsync(Guid id, CancellationToken ct) => Task.FromResult<Video?>(id == video.Id ? video : null);
        public Task<bool> CategoryExistsAsync(Guid id, CancellationToken ct) => throw new NotImplementedException();
        public Task<(IReadOnlyList<Video> Items, int Total)> ListAsync(string? owner, bool publishedOnly,
            int page, int pageSize, CancellationToken ct) =>
            Task.FromResult(((IReadOnlyList<Video>)[video], 1));
        public Task AddAsync(Video value, CancellationToken ct) => throw new NotImplementedException();
        public Task SaveAsync(CancellationToken ct) => throw new NotImplementedException();
        public Task<int> FavoriteCountAsync(Guid id, CancellationToken ct) => Task.FromResult(0);
        public Task<IReadOnlyDictionary<string, string>> AuthorNamesAsync(IEnumerable<string> authorIds, CancellationToken ct) =>
            Task.FromResult<IReadOnlyDictionary<string, string>>(new Dictionary<string, string>
            {
                [video.OwnerUserId] = "Nguyễn Khánh Vĩnh"
            });
        public Task IncrementViewAsync(Guid id, CancellationToken ct) => throw new NotImplementedException();
    }

    private sealed class SingleModerationRepository(ModerationSubmission submission) : IModerationRepository
    {
        public Task<ModerationSubmission?> GetByIdAsync(Guid id, CancellationToken ct) => throw new NotImplementedException();
        public Task<ModerationSubmission?> GetLatestForContentAsync(Guid id, CancellationToken ct) => throw new NotImplementedException();
        public Task<ModerationSubmission?> GetCurrentPublishedAsync(Guid id, CancellationToken ct) =>
            Task.FromResult<ModerationSubmission?>(id == submission.ContentId ? submission : null);
        public Task<IReadOnlyList<Guid>> GetCheckingIdsAsync(int count, CancellationToken ct) => throw new NotImplementedException();
        public Task<ModerationPage> SearchAsync(ModerationSearch search, CancellationToken ct) => throw new NotImplementedException();
        public Task AddAsync(ModerationSubmission value, CancellationToken ct) => throw new NotImplementedException();
        public Task SaveChangesAsync(CancellationToken ct) => throw new NotImplementedException();
        public Task ExecuteInTransactionAsync(Func<CancellationToken, Task> operation, CancellationToken ct) =>
            throw new NotImplementedException();
    }
}
