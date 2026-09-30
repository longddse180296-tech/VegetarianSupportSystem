using Domain.Entities;
using Domain.Enums;

namespace Domain.Tests;

public sealed class ModerationSubmissionTests
{
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

    [Fact]
    public void FailedAiCheckMustBeRetriedAndCannotBeApproved()
    {
        var submission = NewSubmission();
        submission.RecordAiResult(
            AiFlagStatus.Failed, "Provider unavailable", null, null,
            DateTimeOffset.UtcNow);

        Assert.Equal(AdminReviewStatus.Submitted, submission.AdminReviewStatus);
        Assert.Throws<InvalidOperationException>(() =>
            submission.Decide(ModerationDecisionType.Approve, "admin", "reviewed", DateTimeOffset.UtcNow));

        submission.RetryAiCheck();

        Assert.Equal(AiFlagStatus.Checking, submission.AiFlagStatus);
        Assert.Null(submission.AiSummary);
        Assert.Equal(AdminReviewStatus.Submitted, submission.AdminReviewStatus);
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

    private static ModerationSubmission NewSubmission() => ModerationSubmission.Submit(
        Guid.NewGuid(), 1, ModeratedContentType.Article, "author", "Title", "Body", null,
        DateTimeOffset.UtcNow);
}
