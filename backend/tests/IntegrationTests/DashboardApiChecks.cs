using System.Net;
using System.Net.Http.Json;
using Application.Features.Administration;
using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace CoreDataChecks;

internal static class DashboardApiChecks
{
    public static async Task RunAsync(HttpClient client, IServiceProvider services, Action<bool, string> check)
    {
        const string route = "/api/admin/dashboard";
        client.DefaultRequestHeaders.Remove("Test-Role");
        client.DefaultRequestHeaders.Remove("Test-UserId");
        check((await client.GetAsync(route)).StatusCode == HttpStatusCode.Unauthorized,
            "dashboard Guest receives 401");
        client.DefaultRequestHeaders.Add("Test-Role", "User");
        check((await client.GetAsync(route)).StatusCode == HttpStatusCode.Forbidden,
            "dashboard User receives 403");
        client.DefaultRequestHeaders.Remove("Test-Role");
        client.DefaultRequestHeaders.Add("Test-Role", "Admin");

        var before = await client.GetFromJsonAsync<DashboardOverview>(route);
        check(before is not null, "dashboard Admin receives actual overview");

        await using var scope = services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var now = DateTimeOffset.UtcNow;
        var admin = User.CreateInitialAdmin("Dashboard Admin", "dashboard-admin@example.test", "hash", now);
        var member = User.Register("Dashboard Member", "dashboard-member@example.test", "hash", now);
        db.Users.AddRange(admin, member);
        var category = new Category { Name = "Dashboard category", CreatedAt = now };
        db.Categories.Add(category);
        await db.SaveChangesAsync();

        // The current moderation migration predates newer entity fields. Insert fixture rows
        // through the persisted schema without changing the BE 3 feature or its migrations.
        var publishedId = Guid.NewGuid();
        var pendingId = Guid.NewGuid();
        var decisionId = Guid.NewGuid();
        const string publishedTitle = "Published dashboard article";
        const string pendingTitle = "Pending dashboard video";
        var hasAuditColumns = await db.Database.SqlQueryRaw<int>(
            "SELECT CASE WHEN COL_LENGTH('dbo.ModerationSubmissions', 'CreatedAtUtc') IS NULL THEN 0 ELSE 1 END AS [Value]")
            .SingleAsync() == 1;
        if (hasAuditColumns)
        {
            await db.Database.ExecuteSqlInterpolatedAsync($@"
                INSERT INTO ModerationSubmissions
                    (Id, ContentId, Version, ContentType, OwnerUserId, Title, TextContent,
                     AiFlagStatus, AdminReviewStatus, SubmittedAt, CreatedAtUtc, UpdatedAtUtc,
                     IsCurrentPublished)
                VALUES ({publishedId}, {Guid.NewGuid()}, {1}, {"Article"}, {member.Id},
                        {publishedTitle}, {"Article text"}, {"Passed"}, {"Published"},
                        {now}, {now}, {now}, {true})");
            await db.Database.ExecuteSqlInterpolatedAsync($@"
                INSERT INTO ModerationSubmissions
                    (Id, ContentId, Version, ContentType, OwnerUserId, Title, TextContent,
                     MediaReference, AiFlagStatus, AdminReviewStatus, SubmittedAt,
                     CreatedAtUtc, UpdatedAtUtc, IsCurrentPublished)
                VALUES ({pendingId}, {Guid.NewGuid()}, {1}, {"Video"}, {member.Id},
                        {pendingTitle}, {"Video description"}, {"video.mp4"}, {"Partial"},
                        {"PendingAdminReview"}, {now}, {now}, {now}, {false})");
        }
        else
        {
            await db.Database.ExecuteSqlInterpolatedAsync($@"
                INSERT INTO ModerationSubmissions
                    (Id, ContentId, Version, ContentType, OwnerUserId, Title, TextContent,
                     AiFlagStatus, AdminReviewStatus, SubmittedAt, IsCurrentPublished)
                VALUES ({publishedId}, {Guid.NewGuid()}, {1}, {"Article"}, {member.Id},
                        {publishedTitle}, {"Article text"}, {"Passed"}, {"Published"}, {now}, {true})");
            await db.Database.ExecuteSqlInterpolatedAsync($@"
                INSERT INTO ModerationSubmissions
                    (Id, ContentId, Version, ContentType, OwnerUserId, Title, TextContent,
                     MediaReference, AiFlagStatus, AdminReviewStatus, SubmittedAt, IsCurrentPublished)
                VALUES ({pendingId}, {Guid.NewGuid()}, {1}, {"Video"}, {member.Id},
                        {pendingTitle}, {"Video description"}, {"video.mp4"}, {"Partial"},
                        {"PendingAdminReview"}, {now}, {false})");
        }
        await db.Database.ExecuteSqlInterpolatedAsync($@"
            INSERT INTO ModerationDecisions
                (Id, SubmissionId, Version, Decision, AdminUserId, Reason, DecidedAt)
            VALUES ({decisionId}, {publishedId}, {1}, {"Approve"}, {admin.Id},
                    {"Reviewed"}, {now})");

        var after = await client.GetFromJsonAsync<DashboardOverview>(route);
        check(after is not null && before is not null &&
              after.Members.Registered == before.Members.Registered + 2 &&
              after.CoreData.Categories.Total == before.CoreData.Categories.Total + 1 &&
              after.Content.PublishedArticles == before.Content.PublishedArticles + 1 &&
              after.PendingAdminReview.Videos == before.PendingAdminReview.Videos + 1,
            "dashboard counts change when persisted data changes");
        check(after is not null && after.Content.Comments is null &&
              after.RecentActivity.Any(x => x.Type == "ArticleApprove" && x.Title == publishedTitle) &&
              after.RecentActivity.Any(x => x.Type == "VideoSubmitted" && x.Title == pendingTitle),
            "dashboard activity reflects persisted moderation and unmeasured comments stay null");

        await db.Database.ExecuteSqlInterpolatedAsync(
            $"DELETE FROM ModerationDecisions WHERE Id = {decisionId}");
        await db.Database.ExecuteSqlInterpolatedAsync(
            $"DELETE FROM ModerationSubmissions WHERE Id = {publishedId} OR Id = {pendingId}");
        db.Categories.Remove(category);
        db.Users.RemoveRange(admin, member);
        await db.SaveChangesAsync();

        client.DefaultRequestHeaders.Remove("Test-Role");
        client.DefaultRequestHeaders.Remove("Test-UserId");
    }
}
