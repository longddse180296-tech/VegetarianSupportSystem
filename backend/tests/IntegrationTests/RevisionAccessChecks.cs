using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Application.Features.Articles;
using Application.Features.Moderation;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Persistence;
using Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace CoreDataChecks;

internal static class RevisionAccessChecks
{
    public static async Task RunAsync(HttpClient client, AppDbContext db, IServiceProvider services, Action<bool, string> check)
    {
        var now = DateTimeOffset.UtcNow;
        var user = User.Register("Revision owner", "revision-owner@example.test", "test", now);
        var article = new Article(user.Id, "Revision original", "Original body", "Revision fixture", "https://example.com/cover.jpg", now);
        var original = ModerationSubmission.Submit(Guid.NewGuid(), 1, ModeratedContentType.Article, user.Id,
            article.DraftTitle, article.DraftContent, article.DraftCoverImageUrl, now.AddMinutes(-2));
        article.LinkSubmission(original, now);
        var earlier = ModerationSubmission.Submit(Guid.NewGuid(), 1, ModeratedContentType.Article, user.Id,
            "Earlier queued content", "Other body", null, now.AddMinutes(-1));
        var video = Video.Create(user.Id, "Revision video", "Video body", null); video.SetMedia("test.mp4");
        var videoSubmission = ModerationSubmission.Submit(video.Id, 1, ModeratedContentType.Video, user.Id,
            video.Title, video.Description, video.MediaKey, now);
        db.Users.Add(user); db.Articles.Add(article); db.ModerationSubmissions.AddRange(earlier, videoSubmission); db.Videos.Add(video);
        await db.SaveChangesAsync();
        var savedRole = client.DefaultRequestHeaders.TryGetValues("Test-Role", out var roles) ? roles.ToArray() : [];
        var savedUsers = client.DefaultRequestHeaders.TryGetValues("Test-UserId", out var users) ? users.ToArray() : [];
        void Caller(string role) { client.DefaultRequestHeaders.Remove("Test-Role"); client.DefaultRequestHeaders.Add("Test-Role", role); client.DefaultRequestHeaders.Remove("Test-UserId"); client.DefaultRequestHeaders.Add("Test-UserId", user.Id); }
        var articleUrl = $"/api/me/articles/{article.Id}";
        var videoUrl = $"/api/me/videos/{video.Id}";
        ArticleDraftRequest Draft(string title) => new(title, "Updated body", "Revision fixture", "https://example.com/cover.jpg");
        async Task<ModerationSubmission> Latest(Guid id) => await db.ModerationSubmissions.AsNoTracking().Where(x => x.ContentId == id).OrderByDescending(x => x.Version).FirstAsync();
        async Task PassAi(Guid id)
        {
            using var scope = services.CreateScope();
            await scope.ServiceProvider.GetRequiredService<ModerationService>().RecordAiResultAsync(id,
                new ModerationAiResult(AiFlagStatus.Passed, "Checked", "Text and image", null, null, null, null, null), default);
        }
        async Task<int> PendingCount(string contentType)
        {
            var count = 0;
            foreach (var status in new[] { "Submitted", "PendingAdminReview" })
            {
                var page = await client.GetFromJsonAsync<JsonElement>($"/api/admin/moderation/submissions?contentType={contentType}&adminStatus={status}&page=1&pageSize=1");
                count += page.GetProperty("totalCount").GetInt32();
            }
            return count;
        }
        try
        {
            Caller("User");
            var missingCover = await client.PostAsync(videoUrl + "/submit", null);
            check(missingCover.StatusCode == HttpStatusCode.Conflict && (await Latest(video.Id)).Version == 1,
                "video without a cover cannot enter the moderation queue or create a new revision");
            video.SetThumbnail("test-cover.png");
            await db.SaveChangesAsync();
            check((await client.PutAsJsonAsync(articleUrl, Draft("Revision while AI pending"))).IsSuccessStatusCode,
                "article can be edited while queued for AI");
            check((await Latest(original.ContentId)).AdminReviewStatus == AdminReviewStatus.Draft,
                "saving edits withdraws the old pending article from moderation");
            check((await client.PostAsync(articleUrl + "/submit", null)).IsSuccessStatusCode, "edited pending article can be resubmitted");
            var second = await Latest(original.ContentId);
            var queue = await new ModerationRepository(db).GetCheckingIdsAsync(100, default);
            check(second.Version == 2 && second.AiFlagStatus == AiFlagStatus.Checking && second.AiSummary is null &&
                !queue.Contains(original.Id) && queue.ToList().IndexOf(earlier.Id) < queue.ToList().IndexOf(second.Id),
                "resubmission queues fresh AI work behind older submissions and excludes the superseded version");
            Caller("Admin");
            check((await client.PostAsJsonAsync($"/api/admin/moderation/submissions/{original.Id}/decisions", new { decision = 1 })).StatusCode == HttpStatusCode.Conflict,
                "admin cannot approve a version withdrawn by editing");
            try { await PassAi(original.Id); check(false, "stale AI result must be rejected"); }
            catch (ModerationException error) { check(error.Error == ModerationError.Conflict, "stale AI result cannot revive an old revision"); }
            await PassAi(second.Id);
            Caller("User");
            check((await client.PutAsJsonAsync(articleUrl, Draft("Revision after AI"))).IsSuccessStatusCode &&
                (await client.PostAsync(articleUrl + "/submit", null)).IsSuccessStatusCode,
                "article can be edited and resubmitted after AI finished but before admin decides");
            var third = await Latest(original.ContentId);
            check(third.Version == 3 && third.AiFlagStatus == AiFlagStatus.Checking && third.AiSummary is null,
                "AI must check the newly submitted content again instead of reusing the old result");
            await PassAi(third.Id);
            Caller("Admin");
            var articlesBefore = await PendingCount("Article");
            check((await client.PostAsJsonAsync($"/api/admin/moderation/submissions/{third.Id}/decisions", new { decision = 3 })).IsSuccessStatusCode,
                "admin can reject the latest article revision");
            check(await PendingCount("Article") == articlesBefore - 1, "deciding an article removes it from the pending menu count");
            Caller("User");
            check((await client.PutAsJsonAsync(articleUrl, Draft("Forbidden edit"))).StatusCode == HttpStatusCode.Conflict &&
                (await client.PostAsync(articleUrl + "/submit", null)).StatusCode == HttpStatusCode.Conflict &&
                (await client.DeleteAsync(articleUrl)).StatusCode == HttpStatusCode.Conflict && (await client.GetAsync(articleUrl)).IsSuccessStatusCode,
                "rejected article is read-only: edit, draft save, resubmit and delete are blocked");
            check((await client.PutAsJsonAsync(videoUrl, new { title = "Pending video edited", description = "Updated video", categoryId = (Guid?)null })).IsSuccessStatusCode &&
                (await client.PostAsync(videoUrl + "/submit", null)).IsSuccessStatusCode,
                "pending video can be edited and resubmitted as a fresh admin queue item");
            var latestVideo = await Latest(video.Id);
            check(latestVideo.Version == 2 && latestVideo.AdminReviewStatus == AdminReviewStatus.PendingAdminReview,
                "video resubmission creates a new queued version");
            Caller("Admin");
            var videosBefore = await PendingCount("Video");
            check((await client.PostAsJsonAsync($"/api/admin/moderation/submissions/{latestVideo.Id}/decisions", new { decision = 3 })).IsSuccessStatusCode,
                "admin can reject the new video revision");
            check(await PendingCount("Video") == videosBefore - 1, "deciding a video removes it from the pending menu count");
            Caller("User");
            check((await client.PutAsJsonAsync(videoUrl, new { title = "Forbidden video", description = "No", categoryId = (Guid?)null })).StatusCode == HttpStatusCode.Conflict &&
                (await client.PostAsync(videoUrl + "/submit", null)).StatusCode == HttpStatusCode.Conflict &&
                (await client.DeleteAsync(videoUrl)).StatusCode == HttpStatusCode.Conflict && (await client.GetAsync(videoUrl)).IsSuccessStatusCode,
                "rejected video is read-only and cannot be edited, saved, submitted or deleted");

            Caller("Admin");
            foreach (var route in new[] { "/api/profile/me", "/api/me/articles", "/api/me/videos", "/api/pantry/items", "/api/meal-plans", "/api/favorites" })
                check((await client.GetAsync(route)).StatusCode == HttpStatusCode.Forbidden, "admin cannot access user personal resource: " + route);
            check((await client.GetAsync("/api/admin/recipes")).IsSuccessStatusCode, "admin management permissions remain available");
            Caller("User");
            check((await client.GetAsync("/api/profile/me")).IsSuccessStatusCode, "user can still access their own profile");

            Caller("Admin");
            var before = await client.GetFromJsonAsync<JsonElement>("/api/admin/feedback?isRead=false&pageSize=1");
            var feedback = await client.PostAsJsonAsync("/api/feedback", new { name = "Menu counter", email = "counter@example.test", subject = "New feedback", message = "Test unread counter" });
            var receipt = await feedback.Content.ReadFromJsonAsync<JsonElement>();
            var unread = await client.GetFromJsonAsync<JsonElement>("/api/admin/feedback?isRead=false&pageSize=1");
            check(unread.GetProperty("total").GetInt32() == before.GetProperty("total").GetInt32() + 1, "unread feedback badge source increases for new feedback");
            await client.PostAsync($"/api/admin/feedback/{receipt.GetProperty("id").GetGuid()}/read", null);
            var read = await client.GetFromJsonAsync<JsonElement>("/api/admin/feedback?isRead=false&pageSize=1");
            check(read.GetProperty("total").GetInt32() == before.GetProperty("total").GetInt32(), "reading feedback subtracts it from the badge source");
        }
        finally
        {
            client.DefaultRequestHeaders.Remove("Test-Role"); foreach (var role in savedRole) client.DefaultRequestHeaders.Add("Test-Role", role);
            client.DefaultRequestHeaders.Remove("Test-UserId"); foreach (var id in savedUsers) client.DefaultRequestHeaders.Add("Test-UserId", id);
        }
    }
}
