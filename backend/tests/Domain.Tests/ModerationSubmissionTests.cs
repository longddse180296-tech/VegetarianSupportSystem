using Domain.Entities;
using Domain.Enums;

namespace Domain.Tests;

public sealed class ModerationSubmissionTests
{
    [Fact]
    public void VideoGoesDirectlyToAdminWithoutAiAndCanBeApproved()
    {
        var submission = ModerationSubmission.Submit(
            Guid.NewGuid(), 1, ModeratedContentType.Video, "owner", "Video title",
            "Video description", "private/video.mp4", DateTimeOffset.UtcNow);

        Assert.Equal(AiFlagStatus.NotSubmitted, submission.AiFlagStatus);
        Assert.Equal(AdminReviewStatus.PendingAdminReview, submission.AdminReviewStatus);
        Assert.Null(submission.AiCheckedAt);
        Assert.Throws<InvalidOperationException>(() => submission.RecordAiResult(
            AiFlagStatus.Partial, "Only text checked", "title and description",
            "video frames", DateTimeOffset.UtcNow));
        Assert.Throws<InvalidOperationException>(() => submission.RetryAiCheck(DateTimeOffset.UtcNow));

        submission.Decide(ModerationDecisionType.Approve, "admin", "Watched the video",
            DateTimeOffset.UtcNow);

        Assert.Equal(AdminReviewStatus.Published, submission.AdminReviewStatus);
        Assert.True(submission.IsCurrentPublished);
    }

    [Fact]
    public void AiPassingDoesNotPublishBeforeAdminDecision()
    {
        var submission = NewSubmission();

        Assert.Equal(AiFlagStatus.Checking, submission.AiFlagStatus);
        Assert.Equal(AdminReviewStatus.Submitted, submission.AdminReviewStatus);
        Assert.False(submission.IsCurrentPublished);
        Assert.Throws<InvalidOperationException>(() =>
            submission.Decide(ModerationDecisionType.Approve, "admin", "reviewed", DateTimeOffset.UtcNow));

        submission.RecordAiResult(
            AiFlagStatus.Passed, "No issue found in checked text", "title and text", null,
            DateTimeOffset.UtcNow);

        Assert.Equal(AdminReviewStatus.PendingAdminReview, submission.AdminReviewStatus);
        Assert.False(submission.IsCurrentPublished);

        var decision = submission.Decide(
            ModerationDecisionType.Approve, "admin", "reviewed", DateTimeOffset.UtcNow);

        Assert.Equal(AdminReviewStatus.Published, submission.AdminReviewStatus);
        Assert.True(submission.IsCurrentPublished);
        Assert.Equal(submission.Id, decision.SubmissionId);
        Assert.Equal("admin", decision.AdminUserId);
    }

    [Theory]
    [InlineData(ModerationDecisionType.Approve, AdminReviewStatus.Published, true)]
    [InlineData(ModerationDecisionType.RequestRevision, AdminReviewStatus.RevisionRequested, false)]
    [InlineData(ModerationDecisionType.Reject, AdminReviewStatus.Rejected, false)]
    public void FailedAiCheckRequiresManualAdminDecision(
        ModerationDecisionType decision, AdminReviewStatus expectedStatus, bool isPublished)
    {
        var submission = NewSubmission();
        submission.RecordAiResult(
            AiFlagStatus.Failed, "Provider unavailable", null, null,
            DateTimeOffset.UtcNow);

        Assert.Equal(AiFlagStatus.Failed, submission.AiFlagStatus);
        Assert.Equal("Provider unavailable", submission.AiSummary);
        Assert.Equal(AdminReviewStatus.PendingAdminReview, submission.AdminReviewStatus);
        Assert.False(submission.IsCurrentPublished);
        Assert.Throws<InvalidOperationException>(() =>
            submission.RetryAiCheck(DateTimeOffset.UtcNow));

        var record = submission.Decide(decision, "admin", "Reviewed the article manually",
            DateTimeOffset.UtcNow);

        Assert.Equal(expectedStatus, submission.AdminReviewStatus);
        Assert.Equal(isPublished, submission.IsCurrentPublished);
        Assert.Equal(AiFlagStatus.Failed, submission.AiFlagStatus);
        Assert.Equal(decision, record.Decision);
        Assert.Equal("Reviewed the article manually", record.Reason);
    }

    [Fact]
    public void PartialAiCheckRequiresDisclosureOfUncheckedScope()
    {
        var submission = NewSubmission();

        Assert.Throws<ArgumentException>(() => submission.RecordAiResult(
            AiFlagStatus.Partial, "Only text checked", "title and text", null,
            DateTimeOffset.UtcNow));
        Assert.Equal(AiFlagStatus.Checking, submission.AiFlagStatus);

        submission.RecordAiResult(
            AiFlagStatus.Partial, "Only text checked", "title and text", "images",
            DateTimeOffset.UtcNow);

        Assert.Equal(AdminReviewStatus.PendingAdminReview, submission.AdminReviewStatus);
        Assert.Equal("images", submission.AiUncheckedScope);
        Assert.False(submission.IsCurrentPublished);
    }

    [Fact]
    public void PassedResultCannotHideUncheckedScope()
    {
        var submission = NewSubmission();

        Assert.Throws<ArgumentException>(() => submission.RecordAiResult(
            AiFlagStatus.Passed, "Text checked", "title and text", "images",
            DateTimeOffset.UtcNow));

        Assert.Equal(AiFlagStatus.Checking, submission.AiFlagStatus);
        Assert.Equal(AdminReviewStatus.Submitted, submission.AdminReviewStatus);
    }

    [Fact]
    public void FlaggedResultRequiresReasonAndTracksUpdateTime()
    {
        var createdAt = DateTimeOffset.UtcNow.AddMinutes(-5);
        var checkedAt = createdAt.AddMinutes(1);
        var submission = ModerationSubmission.Submit(
            Guid.NewGuid(), 1, ModeratedContentType.Article, "author", "Title", "Body", null,
            createdAt);

        Assert.Throws<ArgumentException>(() => submission.RecordAiResult(
            AiFlagStatus.Flagged, "Needs review", "title and text", null, checkedAt));
        Assert.Equal(createdAt, submission.UpdatedAtUtc);

        submission.RecordAiResult(
            AiFlagStatus.Flagged, "Needs review", "title and text", null, checkedAt,
            "Health claim needs evidence");

        Assert.Equal("Health claim needs evidence", submission.AiFlagReason);
        Assert.Equal(createdAt, submission.CreatedAtUtc);
        Assert.Equal(checkedAt, submission.UpdatedAtUtc);
        Assert.Equal(AdminReviewStatus.PendingAdminReview, submission.AdminReviewStatus);
    }

    private static ModerationSubmission NewSubmission() => ModerationSubmission.Submit(
        Guid.NewGuid(), 1, ModeratedContentType.Article, "author", "Title", "Body", null,
        DateTimeOffset.UtcNow);
}
