// Điều phối đọc, lưu metadata và bổ sung video cũ; không thay đổi nội dung hoặc âm thanh của tệp.
using Domain.Entities;

namespace Application.Features.Videos;

public sealed class VideoMetadataService(IVideoMetadataRepository repository, IVideoMediaProbe probe)
{
    public Task<VideoMediaMetadata?> GetAsync(string key, CancellationToken ct) => repository.GetAsync(key, ct);

    // Upload mới phải là video có thời lượng thật; không tin thời lượng do trình duyệt gửi lên.
    public async Task InspectUploadAsync(string key, CancellationToken ct)
    {
        var info = await probe.ReadAsync(key, ct);
        if (info is null) throw new ArgumentException("Không đọc được video. Vui lòng chọn tệp MP4 hoặc WEBM có thể phát được.");
        await repository.SaveAsync(VideoMediaMetadata.Create(key, info.DurationSeconds, info.HasAudio), ct);
    }

    // Mỗi lượt xử lý tối đa 10 tệp; tệp cũ bị thiếu/hỏng được ghi nhận để tránh thử liên tục.
    public async Task BackfillAsync(CancellationToken ct)
    {
        foreach (var key in await repository.PendingKeysAsync(10, ct))
        {
            var info = await probe.ReadAsync(key, ct);
            await repository.SaveAsync(VideoMediaMetadata.Create(key, info?.DurationSeconds, info?.HasAudio), ct);
        }
    }
}
