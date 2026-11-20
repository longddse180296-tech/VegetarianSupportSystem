using System.Collections.Concurrent;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Application.Abstractions.AI;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CoreDataChecks;

internal static class ModerationQueueChecks
{
    public static async Task RunAsync(HttpClient client, AppDbContext db, QueueModerationAiProbe ai, Action<bool, string> check)
    {
        var owner = User.Register("Queue owner", "queue-owner@example.test", "test", DateTimeOffset.UtcNow);
        var video = Video.Create(owner.Id, "Queue video", "Video body", null);
        video.SetMedia("queue.mp4"); video.SetThumbnail("queue.png");
        var video2 = Video.Create(owner.Id, "Queue video two", "Video body", null);
        video2.SetMedia("queue2.mp4"); video2.SetThumbnail("queue2.png");
        var withdrawn = ModerationSubmission.Submit(Guid.NewGuid(), 1, ModeratedContentType.Video, owner.Id,
            "Withdrawn version", "Draft body", "old.mp4", DateTimeOffset.UtcNow);
        withdrawn.WithdrawPendingForEdit(DateTimeOffset.UtcNow);
        db.Users.Add(owner); db.Videos.AddRange(video, video2); db.ModerationSubmissions.Add(withdrawn);
        await db.SaveChangesAsync();
        HttpClient Caller(string role) {
            var result = new HttpClient { BaseAddress = client.BaseAddress };
            result.DefaultRequestHeaders.Add("Test-Role", role);
            result.DefaultRequestHeaders.Add("Test-UserId", owner.Id);
            return result;
        }
        using var user = Caller("User"); using var admin = Caller("Admin");
        async Task<Guid> Draft(string title) {
            var response = await user.PostAsJsonAsync("/api/me/articles", new { title, content = "<p>Rau và dinh dưỡng chay.</p>", category = "Ẩm thực", coverImageUrl = (string?)null });
            check(response.IsSuccessStatusCode, "owner creates a draft without sending it to moderation");
            return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();
        }
        async Task<ModerationSubmission> LatestArticle(Guid id) => await db.Articles.AsNoTracking().Where(x => x.Id == id)
            .SelectMany(x => x.Versions).OrderByDescending(x => x.Version).Select(x => x.Submission).FirstAsync();
        async Task<JsonElement> AdminPage(string extra = "") => await admin.GetFromJsonAsync<JsonElement>("/api/admin/moderation/submissions?pageSize=100" + extra);
        var secondOwner = User.Register("Second queue owner", "queue-other@example.test", "test", DateTimeOffset.UtcNow);
        db.Users.Add(secondOwner); await db.SaveChangesAsync();
        using var other = new HttpClient { BaseAddress = client.BaseAddress };
        other.DefaultRequestHeaders.Add("Test-Role", "User"); other.DefaultRequestHeaders.Add("Test-UserId", secondOwner.Id);
        var first = await Draft("Concurrent article A");
        var second = await Draft("Concurrent article B");
        var third = await Draft("Concurrent article C");
        var otherDraftResponse = await other.PostAsJsonAsync("/api/me/articles", new { title = "Other account article", content = "<p>Rau chay.</p>", category = "Ẩm thực" });
        var otherId = (await otherDraftResponse.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();
        check((await AdminPage()).GetProperty("totalCount").GetInt32() == 0, "admin excludes unsent and withdrawn drafts");
        check((await admin.GetAsync($"/api/admin/moderation/submissions/{withdrawn.Id}")).StatusCode == HttpStatusCode.NotFound, "withdrawn draft cannot be opened by admin");
        check((await user.GetAsync($"/api/moderation/submissions/{withdrawn.Id}")).IsSuccessStatusCode, "owner retains withdrawn history");
        async Task WaitPending(int count) {
            var deadline = DateTimeOffset.UtcNow.AddSeconds(25);
            while (DateTimeOffset.UtcNow < deadline && await db.ModerationSubmissions.AsNoTracking().CountAsync(x => x.ContentType == ModeratedContentType.Article && x.AdminReviewStatus == AdminReviewStatus.PendingAdminReview) < count)
                await Task.Delay(100);
        }
        try
        {
            var results = await Task.WhenAll(user.PostAsync($"/api/me/articles/{first}/submit", null),
                user.PostAsync($"/api/me/articles/{second}/submit", null), other.PostAsync($"/api/me/articles/{otherId}/submit", null));
            check(results.Take(2).Count(x => x.IsSuccessStatusCode) == 1 && results.Take(2).Count(x => x.StatusCode == HttpStatusCode.Conflict) == 1,
                "simultaneous submissions by one account accept exactly one article and block the other");
            check(results[2].IsSuccessStatusCode, "another account can submit at the same time");
            var accepted = results[0].IsSuccessStatusCode ? first : second;
            var blocked = accepted == first ? second : first;
            check(!await db.Set<ArticleVersion>().AnyAsync(x => x.ArticleId == blocked), "blocked request stays a private draft and creates no moderation submission");
            await ai.Started.Task.WaitAsync(TimeSpan.FromSeconds(20));
            check((await user.PostAsync($"/api/me/articles/{third}/submit", null)).StatusCode == HttpStatusCode.Conflict,
                "same account cannot send another article while AI is checking");
            var videoResults = await Task.WhenAll(user.PostAsync($"/api/me/videos/{video.Id}/submit", null), user.PostAsync($"/api/me/videos/{video2.Id}/submit", null));
            check(videoResults.Count(x => x.IsSuccessStatusCode) == 1 && videoResults.Count(x => x.StatusCode == HttpStatusCode.Conflict) == 1,
                "one article and one video may wait together, but two simultaneous videos on the same account accept only one");
            var acceptedVideoId = videoResults[0].IsSuccessStatusCode ? video.Id : video2.Id;
            var blockedVideoId = acceptedVideoId == video.Id ? video2.Id : video.Id;
            var availability = await user.GetFromJsonAsync<JsonElement>("/api/moderation/submissions/availability");
            check(availability.GetProperty("articlePending").GetBoolean() && availability.GetProperty("videoPending").GetBoolean(),
                "create-button availability reports independent article and video pending slots");
            var otherVideo = Video.Create(secondOwner.Id, "Other account video", "Other video body", null);
            otherVideo.SetMedia("other.mp4"); otherVideo.SetThumbnail("other.png");
            db.Videos.Add(otherVideo); await db.SaveChangesAsync();
            check((await other.PostAsync($"/api/me/videos/{otherVideo.Id}/submit", null)).IsSuccessStatusCode,
                "another account may submit its own video even while the first account has a video pending");
            ai.Release.TrySetResult(); await WaitPending(2);
            var queued = await db.ModerationSubmissions.AsNoTracking().Where(x => x.ContentType == ModeratedContentType.Article).OrderBy(x => x.SubmittedAt).ThenBy(x => x.Id).ToArrayAsync();
            check(queued.Length == 2 && queued.All(x => x.AiFlagStatus == AiFlagStatus.Passed && x.AdminReviewStatus == AdminReviewStatus.PendingAdminReview),
                "different accounts reach admin queue without waiting for another account decision");
            check(ai.Titles.ToArray().SequenceEqual(queued.Select(x => x.Title)), "AI checks the earlier submission first across accounts");
            check(queued.All(x => x.AiSummary == "Checked: " + x.Title), "AI results stay associated with the correct account and content");
            check((await user.PostAsync($"/api/me/articles/{blocked}/submit", null)).StatusCode == HttpStatusCode.Conflict,
                "AI completion alone does not unlock another article before admin decision");
            check((await user.PutAsJsonAsync($"/api/me/articles/{accepted}", new { title = "Edited current article", content = "<p>Rau chay đã sửa.</p>", category = "Ẩm thực" })).IsSuccessStatusCode,
                "owner can edit the same pending article");
            check((await user.PostAsync($"/api/me/articles/{blocked}/submit", null)).StatusCode == HttpStatusCode.Conflict,
                "withdrawing to edit cannot bypass the one-account article restriction");
            check((await user.PostAsync($"/api/me/articles/{accepted}/submit", null)).IsSuccessStatusCode,
                "owner can resubmit the same edited article");
            await WaitPending(2);
            var latest = await LatestArticle(accepted);
            check((await admin.PostAsJsonAsync($"/api/admin/moderation/submissions/{latest.Id}/decisions", new { decision = 1, reason = "Approved" })).IsSuccessStatusCode, "admin approves the account's current article");
            check((await user.PostAsync($"/api/me/articles/{blocked}/submit", null)).IsSuccessStatusCode,
                "admin approval unlocks the next article for that account");
            await WaitPending(2);
            latest = await LatestArticle(blocked);
            check((await admin.PostAsJsonAsync($"/api/admin/moderation/submissions/{latest.Id}/decisions", new { decision = 3, reason = "Rejected" })).IsSuccessStatusCode,
                "admin can reject the next article");
            check((await user.PostAsync($"/api/me/articles/{third}/submit", null)).IsSuccessStatusCode,
                "admin rejection also lets the owner submit a different new article");
            var otherLatest = await LatestArticle(otherId);
            check(otherLatest.AdminReviewStatus == AdminReviewStatus.PendingAdminReview, "decisions on one account do not change another account's pending article");
            var videoPending = await db.ModerationSubmissions.AsNoTracking().SingleAsync(x => x.ContentId == acceptedVideoId);
            check((await admin.PostAsJsonAsync($"/api/admin/moderation/submissions/{videoPending.Id}/decisions", new { decision = 3, reason = "Rejected video" })).IsSuccessStatusCode,
                "admin can decide on video while the same owner's article is pending");
            availability = await user.GetFromJsonAsync<JsonElement>("/api/moderation/submissions/availability");
            check(availability.GetProperty("articlePending").GetBoolean() && !availability.GetProperty("videoPending").GetBoolean(),
                "reviewing video restores only the video create button while article remains blocked");
            check((await user.PostAsync($"/api/me/videos/{blockedVideoId}/submit", null)).IsSuccessStatusCode,
                "a new video may be submitted after the prior video's admin decision");
        }
        finally { ai.Release.TrySetResult(); }
    }
}

// Giả lập AI để kiểm tra hàng đợi thật mà không gọi Gemini hoặc tiêu hao quota.
internal sealed class QueueModerationAiProbe : IGeminiService
{
    public TaskCompletionSource Started { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);
    public TaskCompletionSource Release { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);
    public ConcurrentQueue<string> Titles { get; } = new();
    public async Task<GeminiModerationResponse> CheckContentAsync(GeminiModerationRequest request, CancellationToken ct = default)
    {
        Titles.Enqueue(request.Title); Started.TrySetResult();
        await Release.Task.WaitAsync(ct);
        return new(true, AiFlagStatus.Passed, "Checked: " + request.Title, "Text", null);
    }
    public Task<GeminiChatResponse> GenerateChatReplyAsync(GeminiChatRequest request, CancellationToken ct = default) => throw new NotSupportedException();
    public Task<GeminiDishImageResponse> AnalyzeDishImageAsync(GeminiDishImageRequest request, CancellationToken ct = default) => throw new NotSupportedException();
    public Task<GeminiLabelResponse> ReadIngredientLabelAsync(GeminiDishImageRequest request, CancellationToken ct = default) => throw new NotSupportedException();
}
