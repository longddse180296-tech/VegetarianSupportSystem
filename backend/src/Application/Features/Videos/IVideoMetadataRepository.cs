// Truy xuất metadata theo khóa tệp và tìm video cũ cần bổ sung, không lộ đường dẫn ra API.
using Domain.Entities;

namespace Application.Features.Videos;

public interface IVideoMetadataRepository
{
    Task<VideoMediaMetadata?> GetAsync(string key, CancellationToken ct);
    Task SaveAsync(VideoMediaMetadata metadata, CancellationToken ct);
    Task<IReadOnlyList<string>> PendingKeysAsync(int limit, CancellationToken ct);
}
