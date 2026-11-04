// Kiểm tra rút nội dung ở mọi trạng thái, bảo toàn lịch sử và chặn AI/Admin khôi phục nội dung đã xóa.
using Application.Features.Moderation;
using Domain.Entities;
using Domain.Enums;

namespace Domain.Tests;

public sealed class OwnerContentDeletionTests
{
    [Theory]
    [InlineData(AdminReviewStatus.Submitted)]
    [InlineData(AdminReviewStatus.PendingAdminReview)]
    [InlineData(AdminReviewStatus.Published)]
    [InlineData(AdminReviewStatus.RevisionRequested)]
    [InlineData(AdminReviewStatus.Rejected)]
    [InlineData(AdminReviewStatus.Removed)]
    public void OwnerCanRemoveArticleInEverySubmittedState(AdminReviewStatus state)
    {
        var now = DateTimeOffset.UtcNow;
        var s = ModerationSubmission.Submit(Guid.NewGuid(), 1, ModeratedContentType.Article, "owner", "Title", "Text", null, now);
        if (state != AdminReviewStatus.Submitted)
            s.RecordAiResult(AiFlagStatus.Passed, "Đã kiểm tra", "Nội dung", null, now);
        if (state is AdminReviewStatus.Published or AdminReviewStatus.Removed)
            s.Decide(ModerationDecisionType.Approve, "admin", "Duyệt", now);
        else if (state == AdminReviewStatus.Rejected) s.Decide(ModerationDecisionType.Reject, "admin", "Từ chối", now);
        else if (state == AdminReviewStatus.RevisionRequested) s.Decide(ModerationDecisionType.RequestRevision, "admin", "Sửa", now);
        if (state == AdminReviewStatus.Removed) s.Decide(ModerationDecisionType.Remove, "admin", "Gỡ", now);
        var history = s.Decisions.ToArray();
        var ai = s.AiFlagStatus;
        s.RemoveByOwner("owner", now.AddMinutes(1));
        s.RemoveByOwner("owner", now.AddMinutes(2));
        Assert.Equal(AdminReviewStatus.Removed, s.AdminReviewStatus);
        Assert.False(s.IsCurrentPublished);
        Assert.Equal(ai, s.AiFlagStatus);
        Assert.Equal(history, s.Decisions);
        Assert.Throws<InvalidOperationException>(() => s.RecordAiResult(AiFlagStatus.Passed, "Late", "Text", null, now));
        Assert.Throws<InvalidOperationException>(() => s.Decide(ModerationDecisionType.Approve, "admin", "Late", now));
    }

    [Fact]
    public void AnotherOwnerCannotRemoveVideo()
    {
        var s = ModerationSubmission.Submit(Guid.NewGuid(), 1, ModeratedContentType.Video, "owner", "Title", "Text", "test.mp4", DateTimeOffset.UtcNow);
        Assert.Throws<InvalidOperationException>(() => s.RemoveByOwner("other", DateTimeOffset.UtcNow));
        Assert.Equal(AdminReviewStatus.PendingAdminReview, s.AdminReviewStatus);
        s.RemoveByOwner("owner", DateTimeOffset.UtcNow);
        Assert.Equal(AdminReviewStatus.Removed, s.AdminReviewStatus);
    }
}
