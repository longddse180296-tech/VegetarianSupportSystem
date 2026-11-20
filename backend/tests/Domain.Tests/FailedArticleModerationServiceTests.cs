// Kiểm thử cách xử lý bài viết khi bước kiểm tra AI thất bại.
using Application.Features.Moderation;
using Application.Features.Videos;
using Domain.Entities;
using Domain.Enums;

namespace Domain.Tests;

public sealed class FailedArticleModerationServiceTests
{
    [Fact]
    public async Task AdminRetryPersistsCheckingStateAndWaitsForWorkerResult()
    {
        var submission = FailedArticle();
        var repository = new SingleSubmissionRepository(submission);
        var service = new ModerationService(repository, new UnusedVideoPublication());
        var result = await service.RetryAiForAdminAsync(submission.Id, CancellationToken.None);
        Assert.True(repository.Saved);
        Assert.Equal(AiFlagStatus.Checking, result.AiFlagStatus);
        Assert.Equal(AdminReviewStatus.Submitted, result.AdminReviewStatus);
        Assert.Null(result.AiCheckedAt);
        Assert.Null(result.AiSummary);
        await Assert.ThrowsAsync<ModerationException>(() =>
            service.RetryAiForAdminAsync(submission.Id, CancellationToken.None));
    }

    [Fact]
    public async Task AdminCanApproveFailedArticleAfterManualReview()
    {
        var submission = FailedArticle();
        var repository = new SingleSubmissionRepository(submission);
        var service = new ModerationService(repository, new UnusedVideoPublication());

        var result = await service.DecideAsync(submission.Id, ModerationDecisionType.Approve,
            "admin", "Read the full article manually", CancellationToken.None);

        Assert.Equal(AdminReviewStatus.Published, result.AdminReviewStatus);
        Assert.Equal(AiFlagStatus.Failed, result.AiFlagStatus);
        Assert.True(result.IsCurrentPublished);
        Assert.Equal("Read the full article manually", Assert.Single(result.Decisions).Reason);
        Assert.True(repository.Saved);
    }

    [Fact]
    public async Task OwnerCannotRetryAfterFailedArticleEnteredAdminQueue()
    {
        var submission = FailedArticle();
        var service = new ModerationService(new SingleSubmissionRepository(submission),
            new UnusedVideoPublication());

        var error = await Assert.ThrowsAsync<ModerationException>(() =>
            service.RetryAiAsync(submission.Id, "author", CancellationToken.None));

        Assert.Equal(ModerationError.Conflict, error.Error);
        Assert.Equal(AdminReviewStatus.PendingAdminReview, submission.AdminReviewStatus);
        Assert.Equal(AiFlagStatus.Failed, submission.AiFlagStatus);
    }

    private static ModerationSubmission FailedArticle()
    {
        var submission = ModerationSubmission.Submit(Guid.NewGuid(), 1,
            ModeratedContentType.Article, "author", "Title", "Body", null,
            DateTimeOffset.UtcNow);
        submission.RecordAiResult(AiFlagStatus.Failed, "Provider unavailable", null, null,
            DateTimeOffset.UtcNow);
        return submission;
    }

    private sealed class SingleSubmissionRepository(ModerationSubmission submission) : IModerationRepository
    {
        public Task<OwnerSubmissionAvailability> GetOwnerSubmissionAvailabilityAsync(string ownerId, CancellationToken ct) => Task.FromResult(new OwnerSubmissionAvailability(false, false));
        public bool Saved { get; private set; }

        public Task<IReadOnlyDictionary<string, string>> AuthorNamesAsync(IEnumerable<string> ids, CancellationToken ct) =>
            Task.FromResult<IReadOnlyDictionary<string, string>>(new Dictionary<string, string>());
        public Task<ModerationSubmission?> GetByIdAsync(Guid id, CancellationToken ct) =>
            Task.FromResult<ModerationSubmission?>(submission.Id == id ? submission : null);

        public Task<ModerationSubmission?> GetLatestForContentAsync(Guid contentId, CancellationToken ct) =>
            Task.FromResult<ModerationSubmission?>(submission.ContentId == contentId ? submission : null);

        public Task<ModerationSubmission?> GetCurrentPublishedAsync(Guid contentId, CancellationToken ct) =>
            Task.FromResult<ModerationSubmission?>(null);

        public Task<IReadOnlyList<Guid>> GetCheckingIdsAsync(int count, CancellationToken ct) =>
            throw new NotImplementedException();

        public Task<ModerationPage> SearchAsync(ModerationSearch search, CancellationToken ct) =>
            throw new NotImplementedException();

        public Task AddAsync(ModerationSubmission value, CancellationToken ct) =>
            throw new NotImplementedException();

        public Task SaveChangesAsync(CancellationToken ct)
        {
            Saved = true;
            return Task.CompletedTask;
        }

        public Task ExecuteInTransactionAsync(Func<CancellationToken, Task> operation, CancellationToken ct) =>
            operation(ct);
    }

    private sealed class UnusedVideoPublication : IVideoPublication
    {
        public Task ApplyDecisionAsync(Guid videoId, Guid submissionId, bool published, CancellationToken ct) =>
            throw new NotImplementedException();
    }
}
