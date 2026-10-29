using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Infrastructure.Persistence;

namespace CoreDataChecks;

internal static class FeedbackApiChecks
{
    public static async Task RunAsync(HttpClient client, AppDbContext db, Action<bool, string> check)
    {
        client.DefaultRequestHeaders.Remove("Test-Role");
        var denied = await client.GetAsync("/api/admin/feedback");
        check(denied.StatusCode == HttpStatusCode.Unauthorized, "guest cannot read feedback inbox");
        client.DefaultRequestHeaders.Add("Test-Role", "User");
        denied = await client.GetAsync("/api/admin/feedback");
        check(denied.StatusCode == HttpStatusCode.Forbidden, "user cannot read feedback inbox");
        denied = await client.PostAsync($"/api/admin/feedback/{Guid.NewGuid()}/read", null);
        check(denied.StatusCode == HttpStatusCode.Forbidden, "user cannot mark feedback read");
        client.DefaultRequestHeaders.Remove("Test-Role");

        var invalid = await client.PostAsJsonAsync("/api/feedback", new { name = " ", email = "bad", subject = "test", message = "test" });
        check(invalid.StatusCode == HttpStatusCode.BadRequest, "reject blank feedback name");
        invalid = await client.PostAsJsonAsync("/api/feedback", new { name = "Test", email = "bad", subject = "test", message = "test" });
        check(invalid.StatusCode == HttpStatusCode.BadRequest, "reject invalid feedback email");
        invalid = await client.PostAsJsonAsync("/api/feedback", new { name = "Test", email = "feedback@example.test", subject = "test", message = new string('x', 4001) });
        check(invalid.StatusCode == HttpStatusCode.BadRequest, "reject oversized feedback message");

        var sent = await client.PostAsJsonAsync("/api/feedback", new
        {
            name = " Feedback Test ", email = " feedback@example.test ",
            subject = " Test góp ý ", message = " Nội dung thử nghiệm <script>alert(1)</script> "
        });
        check(sent.StatusCode == HttpStatusCode.Created, "guest can submit feedback to admin");
        var receipt = await sent.Content.ReadFromJsonAsync<JsonElement>();
        var id = receipt.GetProperty("id").GetGuid();
        var stored = await db.ContactFeedback.AsNoTracking().SingleAsync(x => x.Id == id);
        check(stored.Name == "Feedback Test" && stored.Email == "feedback@example.test" && stored.ReadAt == null,
            "feedback persisted and trimmed, initially unread");

        client.DefaultRequestHeaders.Add("Test-Role", "Admin");
        var inbox = await client.GetFromJsonAsync<JsonElement>("/api/admin/feedback?isRead=false&pageSize=1");
        check(inbox.GetProperty("items").GetArrayLength() == 1 && inbox.GetProperty("total").GetInt32() >= 1,
            "admin can read paginated unread inbox");
        var read = await client.PostAsync($"/api/admin/feedback/{id}/read", null);
        check(read.StatusCode == HttpStatusCode.NoContent, "admin can mark feedback read");
        var firstReadAt = (await db.ContactFeedback.AsNoTracking().SingleAsync(x => x.Id == id)).ReadAt;
        await client.PostAsync($"/api/admin/feedback/{id}/read", null);
        check(firstReadAt != null && (await db.ContactFeedback.AsNoTracking().SingleAsync(x => x.Id == id)).ReadAt == firstReadAt,
            "mark read preserves first read time");
        var readInbox = await client.GetFromJsonAsync<JsonElement>("/api/admin/feedback?isRead=true");
        check(readInbox.GetProperty("items").EnumerateArray().Any(x => x.GetProperty("id").GetGuid() == id),
            "admin read filter returns processed feedback");
        var missing = await client.PostAsync($"/api/admin/feedback/{Guid.NewGuid()}/read", null);
        check(missing.StatusCode == HttpStatusCode.NotFound, "unknown feedback returns 404");
        var badPage = await client.GetAsync("/api/admin/feedback?page=0");
        check(badPage.StatusCode == HttpStatusCode.BadRequest, "reject invalid feedback pagination");
        client.DefaultRequestHeaders.Remove("Test-Role");
        await client.PostAsJsonAsync("/api/feedback", new { });
        var limited = await client.PostAsJsonAsync("/api/feedback", new { });
        check(limited.StatusCode == HttpStatusCode.TooManyRequests, "feedback submission rate limited");
    }
}
