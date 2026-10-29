// Chỉ chạy khi được yêu cầu: gửi bài tổng hợp qua HTTP và Gemini thật trên database kiểm thử riêng.
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CoreDataChecks;

internal static class LiveModerationAiChecks
{
    public static async Task RunAsync(HttpClient client, AppDbContext db, Action<bool, string> check)
    {
        var owner = User.Register("AI integration test", "moderation-ai@example.test", "test-only-hash", DateTimeOffset.UtcNow);
        db.Users.Add(owner);
        await db.SaveChangesAsync();
        void Caller(string role)
        {
            client.DefaultRequestHeaders.Remove("Test-Role");
            client.DefaultRequestHeaders.Remove("Test-UserId");
            client.DefaultRequestHeaders.Add("Test-Role", role);
            client.DefaultRequestHeaders.Add("Test-UserId", owner.Id);
        }
        var cases = new[] {
            (Title: "Kiểm thử cách luộc rau xanh", Content: "<p>Rửa sạch rau, đun nước sôi, cho rau vào luộc chín rồi vớt ra. Đây là chia sẻ nấu ăn tại nhà.</p>", Cover: (string?)null, Status: AiFlagStatus.Passed),
            (Title: "Kiểm thử tuyên bố sức khỏe sai", Content: "<p>Chỉ cần ăn chay 3 ngày là chữa khỏi mọi bệnh. Hãy bỏ tất cả thuốc bác sĩ kê.</p>", Cover: (string?)null, Status: AiFlagStatus.Flagged),
            (Title: "Kiểm thử bài luộc rau có ảnh", Content: "<p>Rửa sạch rau và luộc chín.</p>", Cover: "https://example.test/synthetic-cover.jpg", Status: AiFlagStatus.Partial),
            (Title: "Cách luộc rau tại nhà", Content: "<p>Rửa sạch rau và luộc chín rồi vớt ra.</p>", Cover: "fixture:cooking-cover.png", Status: AiFlagStatus.Passed),
            (Title: "Chia sẻ món rau", Content: "<p>Rửa sạch rau và luộc chín rồi vớt ra.</p>", Cover: "fixture:health-claim-cover.png", Status: AiFlagStatus.Flagged)
        };
        for (var index = 0; index < cases.Length; index++)
        {
            var item = cases[index];
            Caller("User");
            var coverUrl = item.Cover;
            // Ảnh tổng hợp trong Fixtures được upload qua API thật; không dùng ảnh riêng tư hay dữ liệu database ứng dụng.
            if (coverUrl?.StartsWith("fixture:", StringComparison.Ordinal) == true)
            {
                var bytes = await File.ReadAllBytesAsync(Path.Combine(AppContext.BaseDirectory, "Fixtures", "Moderation", coverUrl[8..]));
                using var upload = new MultipartFormDataContent();
                using var imageContent = new ByteArrayContent(bytes);
                imageContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("image/png");
                upload.Add(imageContent, "image", "synthetic-cover.png");
                var uploaded = await client.PostAsync("/api/me/images", upload);
                check(uploaded.IsSuccessStatusCode, $"live AI case {index + 1}: upload synthetic image through real API");
                coverUrl = (await uploaded.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("url").GetString();
            }
            var response = await client.PostAsJsonAsync("/api/me/articles", new {
                title = item.Title, content = item.Content, category = "Kinh nghiệm nấu ăn", coverImageUrl = coverUrl, dietaryType = "Vegan"
            });
            check(response.StatusCode == HttpStatusCode.Created, $"live AI case {index + 1}: create own article draft");
            var articleId = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();
            check((await client.PostAsync($"/api/me/articles/{articleId}/submit", null)).IsSuccessStatusCode, $"live AI case {index + 1}: submit article through real HTTP flow");
            // Chờ worker thật, không gọi RecordAiResult hoặc ghi kết quả AI giả vào DB.
            using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(65));
            ModerationSubmission? submission;
            do
            {
                await Task.Delay(500, timeout.Token);
                submission = await db.ModerationSubmissions.AsNoTracking()
                    .FirstOrDefaultAsync(x => x.OwnerUserId == owner.Id && x.Title == item.Title, timeout.Token);
            } while (submission is null || submission.AiFlagStatus == AiFlagStatus.Checking);
            check(submission.AiFlagStatus == item.Status, $"live AI case {index + 1}: real worker persists {item.Status} (actual {submission.AiFlagStatus})");
            check(submission.AdminReviewStatus == AdminReviewStatus.PendingAdminReview && !submission.IsCurrentPublished && submission.AiCheckedAt.HasValue,
                $"live AI case {index + 1}: waits for Admin, AI does not publish");
            check((await client.GetAsync($"/api/articles/{articleId}")).StatusCode == HttpStatusCode.NotFound, $"live AI case {index + 1}: unapproved article remains private");
            var mine = await client.GetFromJsonAsync<JsonElement>($"/api/me/articles/{articleId}");
            check(mine.GetProperty("versions").EnumerateArray().Any(version => version.GetProperty("aiStatus").GetString() == item.Status.ToString()),
                $"live AI case {index + 1}: author receives completed AI status");
            if (index == 1)
                check(submission.AiFlagType == "HealthClaim" && !string.IsNullOrWhiteSpace(submission.AiEvidence) && item.Content.Contains(submission.AiEvidence, StringComparison.OrdinalIgnoreCase),
                    "live AI health claim has verbatim evidence stored in SQL");
            if (index == 4)
                check(submission.AiEvidence?.StartsWith("Ảnh đại diện:", StringComparison.Ordinal) == true
                    && !string.IsNullOrWhiteSpace(submission.AiFlagReason), "live AI detects claim present only in actual cover image, with image evidence stored in SQL");
            if (item.Status == AiFlagStatus.Partial)
                check(!string.IsNullOrWhiteSpace(submission.AiUncheckedScope), "live AI image scope stays unchecked and is disclosed");
            Caller("Admin");
            var admin = await client.GetFromJsonAsync<JsonElement>($"/api/admin/moderation/submissions/{submission.Id}");
            check(admin.GetProperty("aiFlagStatus").GetString() == item.Status.ToString() && admin.GetProperty("aiSummary").GetString() == submission.AiSummary,
                $"live AI case {index + 1}: Admin receives actual persisted AI result");
            if (item.Status == AiFlagStatus.Passed)
            {
                check((await client.PostAsJsonAsync($"/api/admin/moderation/submissions/{submission.Id}/decisions", new { decision = "Approve", reason = "Đã xem trực tiếp bài tổng hợp trong database kiểm thử." })).IsSuccessStatusCode,
                    "only explicit Admin approval publishes article after real AI check");
                check((await client.GetAsync($"/api/articles/{articleId}")).IsSuccessStatusCode, "approved test article becomes public through article API");
            }
        }
    }
}
