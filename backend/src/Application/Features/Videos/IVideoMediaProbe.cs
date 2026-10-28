// Hợp đồng đọc metadata kỹ thuật; Application không phụ thuộc công cụ FFprobe hay đường dẫn lưu tệp.
namespace Application.Features.Videos;

public sealed record VideoMediaInfo(double DurationSeconds, bool HasAudio);

public interface IVideoMediaProbe
{
    // null: tệp không tồn tại/không đọc được; IOException: công cụ tạm thời không khả dụng.
    Task<VideoMediaInfo?> ReadAsync(string mediaKey, CancellationToken ct);
}
