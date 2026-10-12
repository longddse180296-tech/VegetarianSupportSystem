using Application.Features.Administration;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public sealed class DashboardRepository(AppDbContext db) : IDashboardRepository
{
    private const int RecentActivityLimit = 10;

    public async Task<DashboardOverview> GetOverviewAsync(CancellationToken cancellationToken)
    {
        var registered = await db.Users.AsNoTracking().CountAsync(cancellationToken);
        var locked = await db.Users.AsNoTracking().CountAsync(x => x.IsLocked, cancellationToken);
        var members = new DashboardMembers(registered, registered - locked, locked);

        var coreData = new DashboardCoreData(
            new DashboardCatalogCount(
                await db.Categories.AsNoTracking().CountAsync(cancellationToken),
                await db.Categories.AsNoTracking().CountAsync(x => x.IsActive, cancellationToken)),
            new DashboardCatalogCount(
                await db.Ingredients.AsNoTracking().CountAsync(cancellationToken),
                await db.Ingredients.AsNoTracking().CountAsync(x => x.IsActive, cancellationToken)),
            new DashboardCatalogCount(
                await db.Recipes.AsNoTracking().CountAsync(cancellationToken),
                await db.Recipes.AsNoTracking().CountAsync(x => x.IsActive, cancellationToken)),
            new DashboardCatalogCount(
                await db.Restaurants.AsNoTracking().CountAsync(cancellationToken),
                await db.Restaurants.AsNoTracking().CountAsync(x => x.IsActive, cancellationToken)));

        // Count only currently published versions from the persisted moderation source.
        // BE 1/3 content tables can supply stricter projections when their integration lands.
        var publishedArticles = await db.ModerationSubmissions.AsNoTracking().CountAsync(
            x => x.ContentType == ModeratedContentType.Article && x.IsCurrentPublished,
            cancellationToken);
        var publishedVideos = await db.ModerationSubmissions.AsNoTracking().CountAsync(
            x => x.ContentType == ModeratedContentType.Video && x.IsCurrentPublished,
            cancellationToken);
        var visibleComments = await db.Comments.AsNoTracking().CountAsync(
            x => x.Status == CommentStatus.Visible, cancellationToken);
        var content = new DashboardContent(publishedArticles, publishedVideos, visibleComments);

        var pendingArticles = await db.ModerationSubmissions.AsNoTracking().CountAsync(
            x => x.ContentType == ModeratedContentType.Article &&
                 x.AdminReviewStatus == AdminReviewStatus.PendingAdminReview,
            cancellationToken);
        var pendingVideos = await db.ModerationSubmissions.AsNoTracking().CountAsync(
            x => x.ContentType == ModeratedContentType.Video &&
                 x.AdminReviewStatus == AdminReviewStatus.PendingAdminReview,
            cancellationToken);
        var queue = new DashboardModerationQueue(
            pendingArticles, pendingVideos, pendingArticles + pendingVideos);

        return new DashboardOverview(members, coreData, content, queue,
            await GetRecentActivityAsync(cancellationToken));
    }

    private async Task<IReadOnlyList<DashboardActivity>> GetRecentActivityAsync(CancellationToken cancellationToken)
    {
        var registrations = await db.Users.AsNoTracking()
            .OrderByDescending(x => x.CreatedAtUtc).ThenByDescending(x => x.Id)
            .Take(RecentActivityLimit)
            .Select(x => new { x.Id, x.FullName, x.CreatedAtUtc })
            .ToListAsync(cancellationToken);

        var statusChanges = await (
            from change in db.MemberStatusChanges.AsNoTracking()
            join member in db.Users.AsNoTracking() on change.UserId equals member.Id
            join admin in db.Users.AsNoTracking() on change.AdminId equals admin.Id
            orderby change.OccurredAtUtc descending, change.Id descending
            select new { change.Id, change.IsLocked, MemberName = member.FullName,
                change.AdminId, AdminName = admin.FullName, change.OccurredAtUtc })
            .Take(RecentActivityLimit).ToListAsync(cancellationToken);

        var submissions = await (
            from submission in db.ModerationSubmissions.AsNoTracking()
            join owner in db.Users.AsNoTracking() on submission.OwnerUserId equals owner.Id
            orderby submission.SubmittedAt descending, submission.Id descending
            select new { submission.Id, submission.ContentType, submission.Title,
                submission.OwnerUserId, OwnerName = owner.FullName, submission.SubmittedAt })
            .Take(RecentActivityLimit).ToListAsync(cancellationToken);

        var decisions = await (
            from decision in db.ModerationDecisions.AsNoTracking()
            join submission in db.ModerationSubmissions.AsNoTracking()
                on decision.SubmissionId equals submission.Id
            join admin in db.Users.AsNoTracking() on decision.AdminUserId equals admin.Id
            orderby decision.DecidedAt descending, decision.Id descending
            select new { decision.Id, decision.Decision, submission.ContentType,
                submission.Title, decision.AdminUserId, AdminName = admin.FullName,
                decision.DecidedAt })
            .Take(RecentActivityLimit).ToListAsync(cancellationToken);

        return registrations.Select(x => new DashboardActivity(
                "MemberRegistered", x.Id, x.FullName, x.Id, x.FullName, x.CreatedAtUtc))
            .Concat(statusChanges.Select(x => new DashboardActivity(
                x.IsLocked ? "MemberLocked" : "MemberUnlocked", x.Id.ToString(),
                x.MemberName, x.AdminId, x.AdminName, x.OccurredAtUtc)))
            .Concat(submissions.Select(x => new DashboardActivity(
                x.ContentType == ModeratedContentType.Article ? "ArticleSubmitted" : "VideoSubmitted",
                x.Id.ToString(), x.Title, x.OwnerUserId, x.OwnerName, x.SubmittedAt)))
            .Concat(decisions.Select(x => new DashboardActivity(
                $"{x.ContentType}{x.Decision}", x.Id.ToString(), x.Title,
                x.AdminUserId, x.AdminName, x.DecidedAt)))
            .OrderByDescending(x => x.OccurredAtUtc)
            .ThenByDescending(x => x.EntityId, StringComparer.Ordinal)
            .Take(RecentActivityLimit)
            .ToArray();
    }
}
