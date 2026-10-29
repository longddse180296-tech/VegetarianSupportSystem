using Domain.Entities;
using Domain.Enums;
using Infrastructure.Persistence;

namespace CoreDataChecks.Fixtures;

internal static class ContentReportFixture
{
    public static async Task<(Article Article, Video Video, Article PrivateArticle)> CreateAsync(AppDbContext db)
    {
        var now = DateTimeOffset.UtcNow;
        foreach (var (id, name) in new[] { ("report-test-author", "Tác giả kiểm thử"), ("test-user", "Người báo cáo kiểm thử") })
        {
            var user = User.Register(name, id + "@example.test", "test-only-password-hash", now);
            db.Entry(user).Property(x => x.Id).CurrentValue = id;
            db.Entry(user.Profile!).Property(x => x.UserId).CurrentValue = id;
            db.Users.Add(user);
        }
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
