// Chức năng: video, bản nháp và nội dung công khai. Tầng Infrastructure thực hiện truy vấn, lưu trữ hoặc giao tiếp dịch vụ ngoài.
using Application.Features.Videos;
using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

// VideoRepository: thực hiện truy vấn và lưu dữ liệu của tính năng qua EF Core.
public sealed class VideoRepository(AppDbContext db) : IVideoRepository, IVideoPublication
{
    // GetAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public Task<Video?> GetAsync(Guid id, CancellationToken cancellationToken) =>
        db.Videos.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    // CategoryExistsAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public Task<bool> CategoryExistsAsync(Guid id, CancellationToken cancellationToken) =>
        db.Categories.AnyAsync(x => x.Id == id && x.IsActive, cancellationToken);

    // ListAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<(IReadOnlyList<Video> Items, int Total)> ListAsync(string? owner,
        bool publishedOnly, int page, int pageSize, CancellationToken cancellationToken)
    {
        var query = db.Videos.AsNoTracking().AsQueryable();
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (owner is not null) query = query.Where(x => x.OwnerUserId == owner);
        if (publishedOnly) query = query.Where(x => x.PublishedSubmissionId != null);
        var count = await query.CountAsync(cancellationToken);
        var items = await query.OrderByDescending(x => x.CreatedAtUtc)
            .Skip((page - 1) * pageSize).Take(pageSize).ToArrayAsync(cancellationToken);
        return (items, count);
    }

    // AddAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public async Task AddAsync(Video video, CancellationToken cancellationToken) =>
        await db.Videos.AddAsync(video, cancellationToken);
    // SaveAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public Task SaveAsync(CancellationToken cancellationToken) => db.SaveChangesAsync(cancellationToken);
    // FavoriteCountAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public Task<int> FavoriteCountAsync(Guid id, CancellationToken cancellationToken) =>
        db.Favorites.CountAsync(x => x.TargetType == FavoriteTargetType.Video && x.TargetId == id, cancellationToken);
    // AuthorNamesAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public async Task<IReadOnlyDictionary<string, string>> AuthorNamesAsync(IEnumerable<string> authorIds, CancellationToken cancellationToken)
    {
        var ids = authorIds.Distinct().ToArray();
        return await db.Users.AsNoTracking().Where(x => ids.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, x => x.FullName, cancellationToken);
    }
    // IncrementViewAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public async Task IncrementViewAsync(Guid id, CancellationToken cancellationToken) =>
        await db.Videos.Where(x => x.Id == id)
            .ExecuteUpdateAsync(update => update.SetProperty(x => x.ViewCount, x => x.ViewCount + 1), cancellationToken);

    // ApplyDecisionAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public async Task ApplyDecisionAsync(Guid videoId, Guid submissionId, bool published,
        CancellationToken cancellationToken)
    {
        var video = await db.Videos.FirstOrDefaultAsync(x => x.Id == videoId, cancellationToken)
            ?? throw new InvalidOperationException("Không tìm thấy video hoặc video không còn khả dụng.");
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (published) video.Publish(submissionId);
        else if (video.PublishedSubmissionId == submissionId) video.RemovePublication();
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await db.SaveChangesAsync(cancellationToken);
    }
}
