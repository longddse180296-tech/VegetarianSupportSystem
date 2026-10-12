using Application.Features.Videos;
using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public sealed class VideoRepository(AppDbContext db) : IVideoRepository, IVideoPublication
{
    public Task<Video?> GetAsync(Guid id, CancellationToken cancellationToken) =>
        db.Videos.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<bool> CategoryExistsAsync(Guid id, CancellationToken cancellationToken) =>
        db.Categories.AnyAsync(x => x.Id == id && x.IsActive, cancellationToken);

    public async Task<(IReadOnlyList<Video> Items, int Total)> ListAsync(string? owner,
        bool publishedOnly, int page, int pageSize, CancellationToken cancellationToken)
    {
        var query = db.Videos.AsNoTracking().AsQueryable();
        if (owner is not null) query = query.Where(x => x.OwnerUserId == owner);
        if (publishedOnly) query = query.Where(x => x.PublishedSubmissionId != null);
        var count = await query.CountAsync(cancellationToken);
        var items = await query.OrderByDescending(x => x.CreatedAtUtc)
            .Skip((page - 1) * pageSize).Take(pageSize).ToArrayAsync(cancellationToken);
        return (items, count);
    }

    public async Task AddAsync(Video video, CancellationToken cancellationToken) =>
        await db.Videos.AddAsync(video, cancellationToken);
    public Task SaveAsync(CancellationToken cancellationToken) => db.SaveChangesAsync(cancellationToken);
    public Task<int> FavoriteCountAsync(Guid id, CancellationToken cancellationToken) =>
        db.Favorites.CountAsync(x => x.TargetType == FavoriteTargetType.Video && x.TargetId == id, cancellationToken);
    public async Task IncrementViewAsync(Guid id, CancellationToken cancellationToken) =>
        await db.Videos.Where(x => x.Id == id)
            .ExecuteUpdateAsync(update => update.SetProperty(x => x.ViewCount, x => x.ViewCount + 1), cancellationToken);

    public async Task ApplyDecisionAsync(Guid videoId, Guid submissionId, bool published,
        CancellationToken cancellationToken)
    {
        var video = await db.Videos.FirstOrDefaultAsync(x => x.Id == videoId, cancellationToken)
            ?? throw new InvalidOperationException("Video record is missing.");
        if (published) video.Publish(submissionId);
        else if (video.PublishedSubmissionId == submissionId) video.RemovePublication();
        await db.SaveChangesAsync(cancellationToken);
    }
}
