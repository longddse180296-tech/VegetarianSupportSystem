// Chức năng: danh sách nội dung yêu thích. Tầng Infrastructure thực hiện truy vấn, lưu trữ hoặc giao tiếp dịch vụ ngoài.
using Application.Common.Exceptions;
using Application.Features.Favorites;
using Domain.Entities;
using Domain.Enums;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

// FavoriteRepository: thực hiện truy vấn và lưu dữ liệu của tính năng qua EF Core.
public sealed class FavoriteRepository(AppDbContext db) : IFavoriteRepository
{
    // ListAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<IReadOnlyList<Favorite>> ListAsync(string userId, FavoriteTargetType? targetType, CancellationToken ct)
    {
        var query = db.Favorites.AsNoTracking().Where(favorite => favorite.UserId == userId);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (targetType.HasValue)
            query = query.Where(favorite => favorite.TargetType == targetType.Value);
        return await query.OrderByDescending(favorite => favorite.CreatedAt).ThenBy(favorite => favorite.Id).ToListAsync(ct);
    }

    // GetAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public Task<Favorite?> GetAsync(Guid id, string userId, CancellationToken ct) =>
        db.Favorites.SingleOrDefaultAsync(favorite => favorite.Id == id && favorite.UserId == userId, ct);

    // ExistsAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public Task<bool> ExistsAsync(string userId, FavoriteTargetType targetType, Guid targetId, CancellationToken ct) =>
        db.Favorites.AnyAsync(favorite => favorite.UserId == userId && favorite.TargetType == targetType && favorite.TargetId == targetId, ct);

    // GetPublicTargetAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<FavoriteTargetInfo?> GetPublicTargetAsync(FavoriteTargetType targetType, Guid targetId, CancellationToken ct) =>
        targetType switch
        {
            FavoriteTargetType.Recipe => await db.Recipes.AsNoTracking().Where(recipe => recipe.Id == targetId && recipe.IsActive)
                .Select(recipe => new FavoriteTargetInfo(recipe.Id, recipe.Name, recipe.ImageUrl)).SingleOrDefaultAsync(ct),
            FavoriteTargetType.Restaurant => await db.Restaurants.AsNoTracking().Where(restaurant => restaurant.Id == targetId && restaurant.IsActive)
                .Select(restaurant => new FavoriteTargetInfo(restaurant.Id, restaurant.Name, restaurant.ImageUrl)).SingleOrDefaultAsync(ct),
            FavoriteTargetType.Video => await db.ModerationSubmissions.AsNoTracking()
                .Where(submission => submission.ContentId == targetId && submission.ContentType == ModeratedContentType.Video
                    && submission.AdminReviewStatus == AdminReviewStatus.Published && submission.IsCurrentPublished)
                // Dùng thumbnail snapshot và metadata theo tệp công khai; không lấy nhầm tệp nháp đang sửa.
                .Join(db.Videos.AsNoTracking(), submission => submission.Id, video => video.PublishedSubmissionId,
                    (submission, video) => new FavoriteTargetInfo(submission.ContentId, submission.Title,
                        video.PublishedThumbnailKey == null ? null : "/api/videos/" + video.Id + "/thumbnail",
                        db.VideoMediaMetadata.Where(metadata => metadata.MediaKey == submission.MediaReference)
                            .Select(metadata => metadata.DurationSeconds).FirstOrDefault()))
                .SingleOrDefaultAsync(ct),
            FavoriteTargetType.Article => await db.Set<ArticleVersion>().AsNoTracking()
                .Where(version => version.ArticleId == targetId &&
                    version.Submission.AdminReviewStatus == AdminReviewStatus.Published &&
                    version.Submission.IsCurrentPublished)
                .Select(version => new FavoriteTargetInfo(version.ArticleId, version.Title, version.CoverImageUrl)).SingleOrDefaultAsync(ct),
            _ => null
        };

    // Add: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public void Add(Favorite favorite) => db.Favorites.Add(favorite);

    // Remove: Xóa dữ liệu trong phạm vi cho phép và xử lý các liên kết liên quan.
    public void Remove(Favorite favorite) => db.Favorites.Remove(favorite);

    // RemoveAllByTarget: Xóa dữ liệu trong phạm vi cho phép và xử lý các liên kết liên quan.
    public void RemoveAllByTarget(FavoriteTargetType targetType, Guid targetId) =>
        db.Favorites.RemoveRange(db.Favorites.Where(favorite =>
            favorite.TargetType == targetType && favorite.TargetId == targetId));

    // SaveAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public async Task SaveAsync(CancellationToken ct)
    {
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException { Number: 2601 or 2627 })
        {
            throw new ConflictException("Nội dung này đã có trong danh sách yêu thích của bạn.");
        }
    }
}
