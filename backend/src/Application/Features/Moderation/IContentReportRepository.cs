using Domain.Entities;
using Domain.Enums;

namespace Application.Features.Moderation;

public interface IContentReportRepository
{
    Task<ReportableContent?> GetPublicContentAsync(ModeratedContentType type, Guid id, CancellationToken ct);
    Task<bool> HasPendingAsync(string reporter, ModeratedContentType type, Guid id, CancellationToken ct);
    Task AddAsync(ContentReport report, CancellationToken ct);
    Task<ContentReport?> GetAsync(Guid id, CancellationToken ct);
    Task<ContentReportPage> ListAsync(ContentReportStatus? status, ModeratedContentType? type, int page, int pageSize, CancellationToken ct);
    Task<IReadOnlyDictionary<(ModeratedContentType Type, Guid TargetId), int>> GetPendingCountsAsync(
        IReadOnlyCollection<Guid> targetIds, CancellationToken ct);
    Task SaveAsync(CancellationToken ct);
}
