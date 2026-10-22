using Domain.Entities;
using Domain.Enums;
using Infrastructure.Persistence;

namespace CoreDataChecks.Fixtures;

internal static class ContentReportFixture
{
    public static async Task<(Article Article, Video Video, Article PrivateArticle)> CreateAsync(AppDbContext db)
    {
        var now = DateTimeOffset.UtcNow;
        var article = new Article("report-test-author", "Published article", "Published text", "Test", null, now);
        var articleSubmission = ModerationSubmission.Submit(Guid.NewGuid(), 1, ModeratedContentType.Article,
            article.OwnerUserId, article.DraftTitle, article.DraftContent, null, now);
        articleSubmission.RecordAiResult(AiFlagStatus.Passed, "Test review", "Text", null, now);
        articleSubmission.Decide(ModerationDecisionType.Approve, "test-admin", "Test publication", now);
        article.LinkSubmission(articleSubmission, now);
        article.SetDraft("Unpublished draft title", "Draft text", "Test", null, now);
        var video = Video.Create("report-test-author", "Published video", "Video description", null);
        video.SetMedia("test-only.mp4");
        var videoSubmission = ModerationSubmission.Submit(video.Id, 1, ModeratedContentType.Video,
            video.OwnerUserId, video.Title, video.Description, video.MediaKey, now);
        videoSubmission.Decide(ModerationDecisionType.Approve, "test-admin", "Test publication", now);
        video.Publish(videoSubmission.Id);
        var privateArticle = new Article("report-test-author", "Private article", "Private text", "Test", null, now);
        db.Articles.AddRange(article, privateArticle);
        db.Videos.Add(video);
        db.ModerationSubmissions.Add(videoSubmission);
        await db.SaveChangesAsync();
        return (article, video, privateArticle);
    }
}
