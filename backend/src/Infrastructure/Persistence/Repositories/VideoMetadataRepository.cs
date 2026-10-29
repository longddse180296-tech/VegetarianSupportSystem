// Metadata lấy từ đúng tệp; chỉ truy vấn khóa nội bộ, không dùng URL người dùng cung cấp.
using Application.Features.Videos;
using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public sealed class VideoMetadataRepository(AppDbContext db) : IVideoMetadataRepository
{
    public Task<VideoMediaMetadata?> GetAsync(string key, CancellationToken ct) =>
        db.VideoMediaMetadata.AsNoTracking().FirstOrDefaultAsync(x => x.MediaKey == key, ct);

    // Upsert tránh xung đột nếu worker và upload cùng đọc một tệp.
    public async Task SaveAsync(VideoMediaMetadata metadata, CancellationToken ct)
    {
        var changed = await db.VideoMediaMetadata.Where(x => x.MediaKey == metadata.MediaKey)
            .ExecuteUpdateAsync(set => set.SetProperty(x => x.DurationSeconds, metadata.DurationSeconds)
                .SetProperty(x => x.HasAudio, metadata.HasAudio).SetProperty(x => x.CheckedAtUtc, metadata.CheckedAtUtc), ct);
        if (changed > 0) return;
        db.VideoMediaMetadata.Add(metadata);
        try { await db.SaveChangesAsync(ct); }
        catch (DbUpdateException ex) when (ex.InnerException is Microsoft.Data.SqlClient.SqlException { Number: 2601 or 2627 })
        { db.Entry(metadata).State = EntityState.Detached; }
    }

    public async Task<IReadOnlyList<string>> PendingKeysAsync(int limit, CancellationToken ct)
    {
        var retryBefore = DateTimeOffset.UtcNow.AddHours(-1);
        var keys = db.Videos.Where(x => x.MediaKey != null).Select(x => x.MediaKey!)
            .Union(db.ModerationSubmissions.Where(x => x.ContentType == ModeratedContentType.Video && x.MediaReference != null)
                .Select(x => x.MediaReference!));
        // Cả bản nháp lẫn phiên bản đang công khai đều được bổ sung; tệp lỗi thử lại sau một giờ.
        return await keys.Where(key => !db.VideoMediaMetadata.Any(x => x.MediaKey == key &&
                (x.DurationSeconds != null || x.CheckedAtUtc > retryBefore)))
            .OrderBy(key => key).Take(limit).ToArrayAsync(ct);
    }
}
