// Chức năng: xóa nội dung của chính chủ, dừng xuất bản và giữ lịch sử kiểm duyệt trong cùng giao dịch.
using System.Data;
using Application.Features.Moderation;
using Domain.Entities;
using Domain.Enums;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public sealed class OwnerContentDeletionRepository(AppDbContext db) : IOwnerContentDeletionRepository
{
    public async Task<bool> DeleteOwnedAsync(ModeratedContentType type, Guid id, string ownerId, CancellationToken ct)
    {
        try { return await DeleteWithinTransactionAsync(type, id, ownerId, ct); }
        catch (SqlException ex) when (ex.Number == 1205)
        { throw new ModerationException(ModerationError.Conflict, "Nội dung đang được xử lý ở phiên khác. Vui lòng tải lại và thử xóa lại."); }
    }

    private async Task<bool> DeleteWithinTransactionAsync(ModeratedContentType type, Guid id, string ownerId, CancellationToken ct)
    {
        // Serializable khóa phạm vi phiên bản, tránh submit/duyệt đồng thời làm sống lại nội dung đã xóa.
        await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        Article? article = null;
        Video? video = null;
        if (type == ModeratedContentType.Article)
            article = await db.Articles.FirstOrDefaultAsync(x => x.Id == id && x.OwnerUserId == ownerId, ct);
        else if (type == ModeratedContentType.Video)
            video = await db.Videos.FirstOrDefaultAsync(x => x.Id == id && x.OwnerUserId == ownerId, ct);
        if (article is null && video is null) return false;

        var contentId = article?.ModerationContentId ?? id;
        var versions = await db.ModerationSubmissions.Where(x => x.ContentId == contentId && x.ContentType == type)
            .ToListAsync(ct);
        var now = DateTimeOffset.UtcNow;
        foreach (var version in versions) version.RemoveByOwner(ownerId, now);
        if (video is not null) video.RemovePublication();

        // Chỉ nháp chưa gửi mới xóa vật lý; bản đã gửi và media riêng tư được giữ để đối chiếu lịch sử.
        if (versions.Count == 0)
        {
            if (article is not null) db.Articles.Remove(article);
            if (video is not null) db.Videos.Remove(video);
        }
        var targetType = type == ModeratedContentType.Article ? FavoriteTargetType.Article : FavoriteTargetType.Video;
        db.Favorites.RemoveRange(await db.Favorites.Where(x => x.TargetType == targetType && x.TargetId == id).ToListAsync(ct));
        try { await db.SaveChangesAsync(ct); }
        catch (DbUpdateConcurrencyException)
        { throw new ModerationException(ModerationError.Conflict, "Nội dung vừa thay đổi. Vui lòng tải lại trước khi xóa."); }
        await transaction.CommitAsync(ct);
        return true;
    }
}
