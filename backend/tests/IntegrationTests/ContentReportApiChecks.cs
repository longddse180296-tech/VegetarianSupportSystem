using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using CoreDataChecks.Fixtures;
using Domain.Enums;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CoreDataChecks;

internal static class ContentReportApiChecks
{
    public static async Task RunAsync(HttpClient client, AppDbContext db, Action<bool, string> check)
    {
        var fixture = await ContentReportFixture.CreateAsync(db);
        const string route = "/api/content-reports";
        const string adminRoute = "/api/admin/content-reports";
        object Request(string type, Guid id, string reason = "Spam", string? details = null) =>
            new { targetType = type, targetId = id, reason, details, reporterId = "forged-identity" };
        var articleRequest = Request("Article", fixture.Article.Id);

        var response = await client.PostAsJsonAsync(route, articleRequest);
        check(response.StatusCode == HttpStatusCode.Unauthorized, "Guest cannot submit content reports");
        check((await client.GetAsync(adminRoute)).StatusCode == HttpStatusCode.Unauthorized, "Guest cannot see reports");
        client.DefaultRequestHeaders.Add("Test-Role", "User");
        check((await client.GetAsync(adminRoute)).StatusCode == HttpStatusCode.Forbidden, "User cannot see reports");
        check((await client.PostAsJsonAsync($"{adminRoute}/{Guid.NewGuid()}/resolve", new { status = "Resolved", note = "test" })).StatusCode == HttpStatusCode.Forbidden, "User cannot resolve reports");
        response = await client.PostAsJsonAsync(route, Request("Article", fixture.PrivateArticle.Id));
        check(response.StatusCode == HttpStatusCode.NotFound, "Private article cannot be reported");
        response = await client.PostAsJsonAsync(route, Request("Video", Guid.NewGuid()));
        check(response.StatusCode == HttpStatusCode.NotFound, "Missing content cannot be reported");
        response = await client.PostAsJsonAsync(route, Request("Article", fixture.Article.Id, "Invalid"));
        check(response.StatusCode == HttpStatusCode.BadRequest, "Invalid report reason rejected");
        response = await client.PostAsJsonAsync(route, Request("Article", fixture.Article.Id, "Other", "   "));
        check(response.StatusCode == HttpStatusCode.BadRequest, "Other reason requires details");
        response = await client.PostAsJsonAsync(route, articleRequest);
        check(response.StatusCode == HttpStatusCode.Created, "User can report public article");
        var receipt = await response.Content.ReadFromJsonAsync<JsonElement>();
        var articleReportId = receipt.GetProperty("id").GetGuid();
        var stored = await db.ContentReports.AsNoTracking().SingleAsync(x => x.Id == articleReportId);
        check(stored.ReporterId == "test-user" && stored.ContentTitle == "Published article" && stored.ContentVersion == 1,
            "Report uses authenticated identity and published version, not draft title");
        response = await client.PostAsJsonAsync(route, articleRequest);
        check(response.StatusCode == HttpStatusCode.Conflict, "Duplicate pending report rejected");
        response = await client.PostAsJsonAsync(route, Request("Video", fixture.Video.Id, "Misleading", "Check 00:15"));
        check(response.StatusCode == HttpStatusCode.Created, "User can report public video");
        check(await db.Videos.AsNoTracking().AnyAsync(x => x.Id == fixture.Video.Id && x.PublishedSubmissionId != null),
            "Reporting does not remove video publication");

        client.DefaultRequestHeaders.Add("Test-UserId", "second-reporter");
        var concurrent = await Task.WhenAll(client.PostAsJsonAsync(route, articleRequest), client.PostAsJsonAsync(route, articleRequest));
        check(concurrent.Count(x => x.StatusCode == HttpStatusCode.Created) == 1 && concurrent.Count(x => x.StatusCode == HttpStatusCode.Conflict) == 1,
            "Concurrent duplicate reports create exactly one pending report");
        client.DefaultRequestHeaders.Remove("Test-UserId");
        client.DefaultRequestHeaders.Remove("Test-Role");
        client.DefaultRequestHeaders.Add("Test-Role", "Admin");
        var list = await client.GetFromJsonAsync<JsonElement>($"{adminRoute}?status=Pending&targetType=Article&pageSize=1");
        check(list.GetProperty("total").GetInt32() == 2 && list.GetProperty("items").GetArrayLength() == 1, "Admin reports filter and pagination work");
        check(list.GetProperty("items")[0].GetProperty("pendingReporterCount").GetInt32() == 2,
            "Pending reporter count includes all reporters across pagination");
        var groupedList = await client.GetFromJsonAsync<JsonElement>($"{adminRoute}?status=Pending&targetType=Article&groupByTarget=true");
        check(groupedList.GetProperty("total").GetInt32() == 1 &&
              groupedList.GetProperty("items")[0].GetProperty("totalReportCount").GetInt32() == 2 &&
              groupedList.GetProperty("items")[0].GetProperty("reports").GetArrayLength() == 2,
            "Admin grouped reports combine multiple reports of the same content into one item with expandable reasons");
        var namedReports = await client.GetFromJsonAsync<JsonElement>($"{adminRoute}?pageSize=50");
        check(namedReports.GetProperty("items").EnumerateArray().Single(item => item.GetProperty("id").GetGuid() == articleReportId)
            .GetProperty("reporterName").GetString() == "Người báo cáo kiểm thử", "Admin report returns reporter display name");
        check(namedReports.GetProperty("items").EnumerateArray().Single(item => item.GetProperty("reporterId").GetString() == "second-reporter")
            .GetProperty("reporterName").ValueKind == JsonValueKind.Null, "Report with missing account retains nullable display name");
        var moderationList = await client.GetFromJsonAsync<JsonElement>(
            "/api/admin/moderation/submissions?contentType=Article");
        check(moderationList.GetProperty("items").EnumerateArray().Any(item =>
                item.GetProperty("contentId").GetGuid() == fixture.Article.ModerationContentId &&
                item.GetProperty("pendingReporterCount").GetInt32() == 2),
            "Admin article moderation list shows the pending reporter count");
        check(moderationList.GetProperty("items").EnumerateArray().All(item => item.GetProperty("ownerName").GetString() == "Tác giả kiểm thử"),
            "Admin article moderation list returns author names");
        var videoList = await client.GetFromJsonAsync<JsonElement>("/api/admin/moderation/submissions?contentType=Video");
        check(videoList.GetProperty("items")[0].GetProperty("ownerName").GetString() == "Tác giả kiểm thử",
            "Admin video moderation list returns author names");
        var detail = await client.GetFromJsonAsync<JsonElement>($"/api/admin/moderation/submissions/{fixture.Video.PublishedSubmissionId}");
        check(detail.GetProperty("ownerName").GetString() == "Tác giả kiểm thử", "Admin moderation detail returns author name");
        check((await client.GetAsync($"{adminRoute}?page=0")).StatusCode == HttpStatusCode.BadRequest, "Invalid report pagination rejected");
        response = await client.PostAsJsonAsync($"{adminRoute}/{articleReportId}/resolve", new { status = "Resolved", note = " " });
        check(response.StatusCode == HttpStatusCode.BadRequest, "Resolution requires a note");
        response = await client.PostAsJsonAsync($"{adminRoute}/{articleReportId}/resolve", new { status = "Pending", note = "test" });
        check(response.StatusCode == HttpStatusCode.BadRequest, "Cannot resolve report to Pending");
        response = await client.PostAsJsonAsync($"{adminRoute}/{articleReportId}/resolve", new { status = "Dismissed", note = "  Checked: content is appropriate.  " });
        check(response.StatusCode == HttpStatusCode.NoContent, "Admin can dismiss report");
        list = await client.GetFromJsonAsync<JsonElement>($"{adminRoute}?status=Pending&targetType=Article&pageSize=1");
        check(list.GetProperty("items")[0].GetProperty("pendingReporterCount").GetInt32() == 1,
            "Resolved reports no longer count as pending reporters");
        stored = await db.ContentReports.AsNoTracking().SingleAsync(x => x.Id == articleReportId);
        check(stored.Status == ContentReportStatus.Dismissed && stored.ResolvedBy == "test-admin" && stored.ResolvedAt != null && stored.ResolutionNote == "Checked: content is appropriate.",
            "Resolution audit stores actor, time and trimmed note");
        response = await client.PostAsJsonAsync($"{adminRoute}/{articleReportId}/resolve", new { status = "Resolved", note = "overwrite" });
        check(response.StatusCode == HttpStatusCode.Conflict, "Closed report cannot be overwritten");
        response = await client.PostAsJsonAsync($"{adminRoute}/{Guid.NewGuid()}/resolve", new { status = "Resolved", note = "test" });
        check(response.StatusCode == HttpStatusCode.NotFound, "Unknown report returns 404");
        client.DefaultRequestHeaders.Remove("Test-Role");
        client.DefaultRequestHeaders.Add("Test-Role", "User");
        response = await client.PostAsJsonAsync(route, articleRequest);
        check(response.StatusCode == HttpStatusCode.Conflict, "Reporter cannot spam repeated reports on the same content even after previous report is closed");
        response = await client.PostAsJsonAsync(route, articleRequest);
        check(response.StatusCode == HttpStatusCode.TooManyRequests, "Report endpoint rate limits repeated requests");
    }
}
