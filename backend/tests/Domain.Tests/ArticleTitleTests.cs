// Kiểm tra tiền kiểm tiêu đề và việc tách từ chối tự động khỏi kết quả AI/quyết định Admin.
using Domain.Entities;
using Domain.Enums;
using Domain.Rules;

namespace Domain.Tests;

public sealed class ArticleTitleTests
{
    [Theory]
    [InlineData("  ĂN CHAY  mỗi ngày ", "ăn chay mỗi ngày")]
    [InlineData("Món\trau\nluộc", "Món rau luộc")]
    [InlineData("a\u0306n chay", "ăn chay")]
    public void EquivalentTitlesHaveSameKey(string first, string second) =>
        Assert.Equal(ArticleTitleRules.Normalize(first), ArticleTitleRules.Normalize(second));

    [Fact]
    public void AccentsAndPunctuationAreNotRemoved() =>
        Assert.NotEqual(ArticleTitleRules.Normalize("ăn chay"), ArticleTitleRules.Normalize("an chay"));

    [Fact]
    public void RejectedDuplicateNeverPretendsAiOrAdminHasReviewedIt()
    {
        var now = DateTimeOffset.UtcNow;
        var item = ModerationSubmission.Submit(Guid.NewGuid(), 1, ModeratedContentType.Article, "owner", "Rau luộc", "Nội dung", null, now);
        item.RejectDuplicateTitle("Tiêu đề trùng, vui lòng đổi tên.", now);
        Assert.Equal(AdminReviewStatus.Rejected, item.AdminReviewStatus);
        Assert.Equal(AiFlagStatus.NotSubmitted, item.AiFlagStatus);
        Assert.NotNull(item.SystemRejectionReason);
        Assert.Null(item.AiCheckedAt);
        Assert.Null(item.AiSummary);
        Assert.Empty(item.Decisions);
        Assert.Throws<InvalidOperationException>(() => item.RecordAiResult(AiFlagStatus.Passed, "Đạt", "Text", null, now));
        Assert.Throws<InvalidOperationException>(() => item.Decide(ModerationDecisionType.Approve, "admin", "Duyệt", now));
    }
}
