using System.Net.Http.Json;
using System.Text.Json;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CoreDataChecks;

internal static class ModerationDecisionUiChecks
{
    public static async Task RunAsync(HttpClient client, AppDbContext db, Action<bool, string> check)
    {
        var now = DateTimeOffset.UtcNow;
        client.DefaultRequestHeaders.Remove("Test-Role");
        client.DefaultRequestHeaders.Add("Test-Role", "Admin");
        foreach (var type in new[] { ModeratedContentType.Article, ModeratedContentType.Video })
        foreach (var decision in new[] { "Approve", "Reject" })
        foreach (var withReason in new[] { false, true })
        {
            client.DefaultRequestHeaders.Remove("Test-Role");
            client.DefaultRequestHeaders.Add("Test-Role", "Admin");
            var video = Video.Create("decision-ui-owner", "Decision UI " + decision, "Test", null);
            var article = new Article("decision-ui-owner", "Decision UI " + decision, "Test", "Health", null, now);
            var contentId = type == ModeratedContentType.Article ? article.Id : video.Id;
            var submission = ModerationSubmission.Submit(contentId, 1, type, "decision-ui-owner", "Decision UI " + decision, "Test", type == ModeratedContentType.Video ? "test.mp4" : null, now);
            if (type == ModeratedContentType.Article)
            {
                submission.RecordAiResult(AiFlagStatus.Passed, "Test", "Test", null, now);
                article.LinkSubmission(submission, now); db.Articles.Add(article);
            }
            else { video.SetMedia("test.mp4"); db.Videos.Add(video); db.ModerationSubmissions.Add(submission); }
            await db.SaveChangesAsync();
            var reason = withReason ? "  Phản hồi cho người đăng:\nVui lòng đối chiếu nội dung và nguồn thông tin.  " : null;
            var response = await client.PostAsJsonAsync($"/api/admin/moderation/submissions/{submission.Id}/decisions", new { decision = decision == "Approve" ? 1 : 3, reason });
            check(response.IsSuccessStatusCode, $"{type} {decision} accepts a decision with custom reason: {withReason} ({response.StatusCode}: {(response.IsSuccessStatusCode ? "OK" : await response.Content.ReadAsStringAsync())})");
            var expected = decision == "Approve" ? AdminReviewStatus.Published : AdminReviewStatus.Rejected;
            check(await db.ModerationSubmissions.AsNoTracking().AnyAsync(x => x.Id == submission.Id && x.AdminReviewStatus == expected),
                $"{type} {decision} persists its real review status");
            var status = decision == "Approve" ? "Published" : "Rejected";
            var page = await client.GetFromJsonAsync<JsonElement>($"/api/admin/moderation/submissions?contentType={type}&adminStatus={status}&pageSize=100");
            check(page.GetProperty("items").EnumerateArray().Any(x => x.GetProperty("id").GetGuid() == submission.Id),
                $"{type} {status} status filter returns the reviewed content");
            var expectedReason = reason?.Trim() ?? (decision == "Approve" ? "Đã được chấp nhận" : "Đã bị từ chối");
            client.DefaultRequestHeaders.Remove("Test-Role"); client.DefaultRequestHeaders.Add("Test-Role", "User");
            client.DefaultRequestHeaders.Remove("Test-UserId"); client.DefaultRequestHeaders.Add("Test-UserId", "decision-ui-owner");
            var ownerUrl = type == ModeratedContentType.Article ? $"/api/me/articles/{article.Id}" : $"/api/me/videos/{video.Id}";
            var ownerResponse = await client.GetFromJsonAsync<JsonElement>(ownerUrl);
            var ownerReason = type == ModeratedContentType.Article
                ? ownerResponse.GetProperty("versions")[0].GetProperty("adminFeedback").GetString()
                : ownerResponse.GetProperty("adminReason").GetString();
            check(ownerReason == expectedReason, $"{type} {decision} delivers the saved reason to the owner");
            if (type == ModeratedContentType.Article)
            {
                var mine = await client.GetFromJsonAsync<JsonElement>("/api/me/articles?pageSize=100");
                var ownItem = mine.GetProperty("items").EnumerateArray().Single(x => x.GetProperty("id").GetGuid() == article.Id);
                check(ownItem.GetProperty("versions")[0].GetProperty("adminFeedback").GetString() == expectedReason,
                    "owner article list includes the moderation notification");
            }
            client.DefaultRequestHeaders.Remove("Test-UserId"); client.DefaultRequestHeaders.Add("Test-UserId", "different-owner");
            check((await client.GetAsync(ownerUrl)).StatusCode == System.Net.HttpStatusCode.NotFound,
                "another account cannot read the private owner review endpoint");
        }
    }
}
