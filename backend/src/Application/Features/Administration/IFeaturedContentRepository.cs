using Domain.Enums;

namespace Application.Features.Administration;

public interface IFeaturedContentRepository
{
    Task<FeaturedContentPage> ListAsync(FeaturedContentType contentType, string? search,
        bool pinnedOnly, int page, int pageSize, CancellationToken ct);
    Task SetPinnedAsync(FeaturedContentType contentType, Guid id, bool isPinned,
        string adminId, DateTimeOffset now, CancellationToken ct);
}
