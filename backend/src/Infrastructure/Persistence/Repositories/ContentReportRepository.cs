// Chức năng: báo cáo nội dung cần xem xét. Tầng Infrastructure thực hiện truy vấn, lưu trữ hoặc giao tiếp dịch vụ ngoài.
using Application.Features.Moderation;
using Domain.Entities;
using Domain.Enums;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

// ContentReportRepository: thực hiện truy vấn và lưu dữ liệu của tính năng qua EF Core.
public sealed class ContentReportRepository(AppDbContext db) : IContentReportRepository
{
    // GetPublicContentAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public Task<ReportableContent?> GetPublicContentAsync(ModeratedContentType type, Guid id, CancellationToken ct)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
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

    // HasPendingAsync: Đánh giá điều kiện nghiệp vụ để quyết định nhánh xử lý.
    public Task<bool> HasPendingAsync(string reporter, ModeratedContentType type, Guid id, CancellationToken ct) =>
        db.ContentReports.AnyAsync(x => x.ReporterId == reporter && x.TargetType == type &&
            x.TargetId == id && x.Status == ContentReportStatus.Pending, ct);

    // HasReportedAsync: Kiểm tra người dùng đã từng gửi báo cáo cho nội dung này chưa để chống spam lặp lại.
    public Task<bool> HasReportedAsync(string reporter, ModeratedContentType type, Guid id, CancellationToken ct) =>
        db.ContentReports.AnyAsync(x => x.ReporterId == reporter && x.TargetType == type &&
            x.TargetId == id, ct);

    // AddAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public async Task AddAsync(ContentReport report, CancellationToken ct)
    {
        db.ContentReports.Add(report);
        await SaveAsync(ct);
    }

    // GetAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public Task<ContentReport?> GetAsync(Guid id, CancellationToken ct) => db.ContentReports.SingleOrDefaultAsync(x => x.Id == id, ct);

    // ListAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<ContentReportPage> ListAsync(ContentReportStatus? status, ModeratedContentType? type,
        int page, int pageSize, CancellationToken ct, bool groupByTarget = false)
    {
        var query = db.ContentReports.AsNoTracking();
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (status.HasValue) query = query.Where(x => x.Status == status.Value);
        if (type.HasValue) query = query.Where(x => x.TargetType == type.Value);

        if (groupByTarget)
        {
            var allMatching = await query
                .OrderByDescending(x => x.CreatedAt).ThenBy(x => x.Id)
                .Select(x => new
                {
                    Report = x,
                    ReporterName = db.Users.Where(user => user.Id == x.ReporterId)
                        .Select(user => user.FullName).FirstOrDefault()
                })
                .ToListAsync(ct);

            var grouped = allMatching
                .GroupBy(x => (x.Report.TargetType, x.Report.TargetId))
                .OrderByDescending(g => g.Max(x => x.Report.CreatedAt))
                .ToList();

            var groupedTotal = grouped.Count;
            var pageGroups = grouped.Skip((page - 1) * pageSize).Take(pageSize).ToList();
            var targetIdsOnPage = pageGroups.Select(g => g.Key.TargetId).Distinct().ToArray();

            var pendingCounts = targetIdsOnPage.Length == 0
                ? new Dictionary<(ModeratedContentType, Guid), int>()
                : await db.ContentReports.AsNoTracking()
                    .Where(x => targetIdsOnPage.Contains(x.TargetId) && x.Status == ContentReportStatus.Pending)
                    .GroupBy(x => new { x.TargetType, x.TargetId })
                    .ToDictionaryAsync(g => (g.Key.TargetType, g.Key.TargetId), g => g.Count(), ct);

            var groupedItems = pageGroups.Select(g =>
            {
                var latest = g.First();
                var r = latest.Report;
                var pendingCount = pendingCounts.GetValueOrDefault((r.TargetType, r.TargetId), 0);
                var entries = g.Select(entry => new ContentReportEntry(
                    entry.Report.Id,
                    entry.Report.SubmissionId,
                    entry.Report.ContentVersion,
                    entry.Report.ReporterId,
                    entry.ReporterName,
                    entry.Report.Reason,
                    entry.Report.Details,
                    entry.Report.Status,
                    entry.Report.CreatedAt,
                    entry.Report.ResolvedAt,
                    entry.Report.ResolvedBy,
                    entry.Report.ResolutionNote)).ToList();
                var groupStatus = entries.Any(e => e.Status == ContentReportStatus.Pending)
                    ? ContentReportStatus.Pending
                    : r.Status;
                return new ContentReportItem(r.Id, r.TargetType, r.TargetId, r.SubmissionId,
                    r.ContentTitle, r.ContentVersion, r.ReporterId, r.Reason, r.Details, groupStatus, r.CreatedAt,
                    r.ResolvedAt, r.ResolvedBy, r.ResolutionNote, pendingCount)
                {
                    ReporterName = latest.ReporterName,
                    TotalReportCount = entries.Count,
                    Reports = entries
                };
            }).ToList();

            return new ContentReportPage(groupedItems, groupedTotal, page, pageSize);
        }

        var total = await query.CountAsync(ct);
        var items = await query.OrderByDescending(x => x.CreatedAt).ThenBy(x => x.Id)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(x => new ContentReportItem(x.Id, x.TargetType, x.TargetId, x.SubmissionId,
                x.ContentTitle, x.ContentVersion, x.ReporterId, x.Reason, x.Details, x.Status, x.CreatedAt,
                x.ResolvedAt, x.ResolvedBy, x.ResolutionNote,
                db.ContentReports.Count(other => other.TargetType == x.TargetType && other.TargetId == x.TargetId &&
                    other.Status == ContentReportStatus.Pending))
            {
                ReporterName = db.Users.Where(user => user.Id == x.ReporterId)
                    .Select(user => user.FullName).FirstOrDefault()
            }).ToListAsync(ct);
        return new ContentReportPage(items, total, page, pageSize);
    }

    // SaveAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public async Task SaveAsync(CancellationToken ct)
    {
        try { await db.SaveChangesAsync(ct); }
        catch (DbUpdateConcurrencyException)
        { throw new ModerationException(ModerationError.Conflict, "Báo cáo đã được người khác xử lý. Vui lòng tải lại."); }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException { Number: 2601 or 2627 })
        { throw new ModerationException(ModerationError.Conflict, "Bạn đã có báo cáo đang chờ cho nội dung này."); }
    }

    // GetPendingCountsAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<IReadOnlyDictionary<(ModeratedContentType Type, Guid TargetId), int>> GetPendingCountsAsync(
        IReadOnlyCollection<Guid> targetIds, CancellationToken ct)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
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
