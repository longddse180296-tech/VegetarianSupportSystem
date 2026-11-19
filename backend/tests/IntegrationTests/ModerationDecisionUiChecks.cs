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
        {
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
            var response = await client.PostAsJsonAsync($"/api/admin/moderation/submissions/{submission.Id}/decisions", new { decision = decision == "Approve" ? 1 : 3 });
            check(response.IsSuccessStatusCode, $"{type} {decision} accepts a decision without entering a reason ({response.StatusCode}: {(response.IsSuccessStatusCode ? "OK" : await response.Content.ReadAsStringAsync())})");
            var expected = decision == "Approve" ? AdminReviewStatus.Published : AdminReviewStatus.Rejected;
            check(await db.ModerationSubmissions.AsNoTracking().AnyAsync(x => x.Id == submission.Id && x.AdminReviewStatus == expected),
                $"{type} {decision} persists its real review status");
            var status = decision == "Approve" ? "Published" : "Rejected";
            var page = await client.GetFromJsonAsync<JsonElement>($"/api/admin/moderation/submissions?contentType={type}&adminStatus={status}&pageSize=100");
            check(page.GetProperty("items").EnumerateArray().Any(x => x.GetProperty("id").GetGuid() == submission.Id),
                $"{type} {status} status filter returns the reviewed content");
        }
    }
}
