using Application.Features.Moderation;
using Domain.Entities;
using Domain.Enums;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public sealed class ContentReportRepository(AppDbContext db) : IContentReportRepository
{
    public Task<ReportableContent?> GetPublicContentAsync(ModeratedContentType type, Guid id, CancellationToken ct)
    {
        if (type == ModeratedContentType.Article)
            return db.ArticleVersions.AsNoTracking().Where(x => x.ArticleId == id &&
                x.Submission.IsCurrentPublished && x.Submission.AdminReviewStatus == AdminReviewStatus.Published)
                .Select(x => new ReportableContent(x.SubmissionId, x.Title, x.Version)).FirstOrDefaultAsync(ct);
        return (from video in db.Videos.AsNoTracking()
                join submission in db.ModerationSubmissions on video.PublishedSubmissionId equals submission.Id
                where video.Id == id && submission.ContentType == ModeratedContentType.Video &&
                    submission.IsCurrentPublished && submission.AdminReviewStatus == AdminReviewStatus.Published
                select new ReportableContent(submission.Id, submission.Title, submission.Version)).FirstOrDefaultAsync(ct);
    }

    public Task<bool> HasPendingAsync(string reporter, ModeratedContentType type, Guid id, CancellationToken ct) =>
        db.ContentReports.AnyAsync(x => x.ReporterId == reporter && x.TargetType == type &&
            x.TargetId == id && x.Status == ContentReportStatus.Pending, ct);

    public async Task AddAsync(ContentReport report, CancellationToken ct)
    {
        db.ContentReports.Add(report);
        await SaveAsync(ct);
    }

    public Task<ContentReport?> GetAsync(Guid id, CancellationToken ct) => db.ContentReports.SingleOrDefaultAsync(x => x.Id == id, ct);

    public async Task<ContentReportPage> ListAsync(ContentReportStatus? status, ModeratedContentType? type,
        int page, int pageSize, CancellationToken ct)
    {
        var query = db.ContentReports.AsNoTracking();
        if (status.HasValue) query = query.Where(x => x.Status == status.Value);
        if (type.HasValue) query = query.Where(x => x.TargetType == type.Value);
        var total = await query.CountAsync(ct);
        var items = await query.OrderByDescending(x => x.CreatedAt).ThenBy(x => x.Id)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(x => new ContentReportItem(x.Id, x.TargetType, x.TargetId, x.SubmissionId,
                x.ContentTitle, x.ContentVersion, x.ReporterId, x.Reason, x.Details, x.Status, x.CreatedAt,
                x.ResolvedAt, x.ResolvedBy, x.ResolutionNote,
                db.ContentReports.Count(other => other.TargetType == x.TargetType && other.TargetId == x.TargetId &&
                    other.Status == ContentReportStatus.Pending))).ToListAsync(ct);
        return new ContentReportPage(items, total, page, pageSize);
    }

    public async Task SaveAsync(CancellationToken ct)
    {
        try { await db.SaveChangesAsync(ct); }
        catch (DbUpdateConcurrencyException)
        { throw new ModerationException(ModerationError.Conflict, "Báo cáo đã được người khác xử lý. Vui lòng tải lại."); }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException { Number: 2601 or 2627 })
        { throw new ModerationException(ModerationError.Conflict, "Bạn đã có báo cáo đang chờ cho nội dung này."); }
    }

    public async Task<IReadOnlyDictionary<(ModeratedContentType Type, Guid TargetId), int>> GetPendingCountsAsync(
        IReadOnlyCollection<Guid> targetIds, CancellationToken ct)
    {
        if (targetIds.Count == 0) return new Dictionary<(ModeratedContentType, Guid), int>();
        var articleTargets = await db.Articles.AsNoTracking()
            .Where(article => article.ModerationContentId.HasValue &&
                targetIds.Contains(article.ModerationContentId.Value))
            .Select(article => new { article.Id, ModerationContentId = article.ModerationContentId!.Value })
            .ToListAsync(ct);
        var articleContentIds = articleTargets.Select(article => article.Id).ToArray();
        var moderationIdsByArticleId = articleTargets.ToDictionary(article => article.Id, article => article.ModerationContentId);
        var counts = await db.ContentReports.AsNoTracking()
            .Where(x => x.Status == ContentReportStatus.Pending &&
                ((x.TargetType == ModeratedContentType.Video && targetIds.Contains(x.TargetId)) ||
                 (x.TargetType == ModeratedContentType.Article && articleContentIds.Contains(x.TargetId))))
            .GroupBy(x => new { x.TargetType, x.TargetId })
            .Select(group => new { group.Key.TargetType, group.Key.TargetId, Count = group.Count() })
            .ToListAsync(ct);
        return counts.ToDictionary(
            x => (x.TargetType, x.TargetType == ModeratedContentType.Article
                ? moderationIdsByArticleId[x.TargetId] : x.TargetId), x => x.Count);
    }
}
