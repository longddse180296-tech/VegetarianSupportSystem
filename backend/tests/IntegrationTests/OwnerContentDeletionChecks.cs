// Kiểm tra HTTP và SQL trên database kiểm thử riêng; không xóa nội dung của database đang chạy.
using System.Net;
using System.Net.Http.Json;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CoreDataChecks;

internal static class OwnerContentDeletionChecks
{
    public static async Task RunAsync(HttpClient client, AppDbContext db, Action<bool, string> check)
    {
        var now = DateTimeOffset.UtcNow;
        var owner = User.Register("Owner", "deletion-owner@example.test", "test-only-hash", now);
        var other = User.Register("Other", "deletion-other@example.test", "test-only-hash", now);
        db.Users.AddRange(owner, other);
        var article = new Article(owner.Id, "Title", "Text", "Health", null, now);
        var published = ModerationSubmission.Submit(Guid.NewGuid(), 1, ModeratedContentType.Article, owner.Id, "Title", "Text", null, now);
        published.RecordAiResult(AiFlagStatus.Passed, "OK", "Text", null, now);
        published.Decide(ModerationDecisionType.Approve, other.Id, "Duyệt", now);
        article.LinkSubmission(published, now);
        var pending = ModerationSubmission.Submit(published.ContentId, 2, ModeratedContentType.Article, owner.Id, "Revision", "New text", null, now);
        article.LinkSubmission(pending, now);
        var video = Video.Create(owner.Id, "Video", "Description", null);
        video.SetMedia("test.mp4");
        var videoPublished = ModerationSubmission.Submit(video.Id, 1, ModeratedContentType.Video, owner.Id, "Video", "Description", "test.mp4", now);
        videoPublished.Decide(ModerationDecisionType.Approve, other.Id, "Duyệt", now);
        video.Publish(videoPublished.Id);
        var videoPending = ModerationSubmission.Submit(video.Id, 2, ModeratedContentType.Video, owner.Id, "Revision", "Description", "test.mp4", now);
        db.Articles.Add(article);
        db.Videos.Add(video);
        db.ModerationSubmissions.AddRange(published, pending, videoPublished, videoPending);
        db.Favorites.AddRange(new Favorite { UserId = other.Id, TargetType = FavoriteTargetType.Article, TargetId = article.Id },
            new Favorite { UserId = other.Id, TargetType = FavoriteTargetType.Video, TargetId = video.Id });
        var comment = new Comment(CommentTargetType.Article, article.Id, null, other.Id, "Giữ lịch sử", now);
        db.Add(comment);
        await db.SaveChangesAsync();
        var cases = new[] { ("articles", article.Id), ("videos", video.Id) };
        void Caller(string? role, string? id = null)
        {
            client.DefaultRequestHeaders.Remove("Test-Role"); client.DefaultRequestHeaders.Remove("Test-UserId");
            if (role is not null) client.DefaultRequestHeaders.Add("Test-Role", role);
            if (id is not null) client.DefaultRequestHeaders.Add("Test-UserId", id);
        }
        foreach (var (kind, id) in cases)
        {
            var path = $"/api/me/{kind}/{id}";
            Caller(null);
            check((await client.GetAsync($"/api/{kind}/{id}")).IsSuccessStatusCode, kind + " public before deletion");
            check((await client.DeleteAsync(path)).StatusCode == HttpStatusCode.Unauthorized, kind + " guest cannot delete");
            Caller("User", other.Id);
            check((await client.DeleteAsync(path)).StatusCode == HttpStatusCode.NotFound, kind + " another user cannot delete");
            Caller("Admin", other.Id);
            check((await client.DeleteAsync(path)).StatusCode == HttpStatusCode.NotFound, kind + " owner endpoint cannot bypass ownership as admin");
            Caller("User", owner.Id);
            check((await client.DeleteAsync(path)).StatusCode == HttpStatusCode.NoContent, kind + " owner deletes published and pending versions");
            check((await client.DeleteAsync(path)).StatusCode == HttpStatusCode.NoContent, kind + " repeated deletion is safe");
            check((await client.PostAsync(path + "/submit", null)).StatusCode == HttpStatusCode.Conflict, kind + " cannot resubmit removed content");
            Caller(null);
            check((await client.GetAsync($"/api/{kind}/{id}")).StatusCode == HttpStatusCode.NotFound, kind + " public detail inaccessible");
        }
        check((await client.GetAsync($"/api/videos/{video.Id}/media")).StatusCode == HttpStatusCode.NotFound, "guest cannot read deleted video media");
        check((await client.GetAsync($"/api/comments?targetType=Article&targetId={article.Id}")).StatusCode == HttpStatusCode.NotFound, "comments cannot expose deleted content");
        Caller("Admin", other.Id);
        foreach (var submission in new[] { pending, videoPending })
        {
            var response = await client.PostAsJsonAsync($"/api/admin/moderation/submissions/{submission.Id}/decisions", new { decision = "Approve", reason = "Late approval" });
            check(response.StatusCode == HttpStatusCode.Conflict, "admin cannot approve a removed pending version");
        }
        db.ChangeTracker.Clear();
        check(await db.Articles.AnyAsync(x => x.Id == article.Id) && await db.Videos.AnyAsync(x => x.Id == video.Id), "submitted roots retained");
        check(await db.ModerationSubmissions.CountAsync(x => x.AdminReviewStatus == AdminReviewStatus.Removed && !x.IsCurrentPublished) == 4, "all versions removed, including older published version");
        check(await db.Set<ModerationDecision>().CountAsync() == 2, "original admin history retained without fake decisions");
        check(await db.Favorites.CountAsync() == 0, "all saved links removed using actual article/video IDs");
        check(await db.Set<Comment>().AnyAsync(x => x.Id == comment.Id), "comment history retained");
        check((await db.Videos.SingleAsync()).PublishedSubmissionId is null, "video publication pointer cleared");
        foreach (var kind in new[] { "articles", "videos" })
        {
            Caller("User", owner.Id);
            var created = await client.PostAsJsonAsync($"/api/me/{kind}", new { title = "Draft", content = "Text", category = "Health", description = "Text" });
            check(created.IsSuccessStatusCode, kind + " draft creation");
            var json = await created.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
            var id = json.GetProperty("id").GetGuid();
            check((await client.DeleteAsync($"/api/me/{kind}/{id}")).StatusCode == HttpStatusCode.NoContent, kind + " unused draft deletion");
            check((await client.GetAsync($"/api/me/{kind}/{id}")).StatusCode == HttpStatusCode.NotFound, kind + " draft no longer exists");
        }
    }
}
