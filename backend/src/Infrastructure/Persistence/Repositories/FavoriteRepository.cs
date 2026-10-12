using Application.Common.Exceptions;
using Application.Features.Favorites;
using Domain.Entities;
using Domain.Enums;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public sealed class FavoriteRepository(AppDbContext db) : IFavoriteRepository
{
    public async Task<IReadOnlyList<Favorite>> ListAsync(string userId, FavoriteTargetType? targetType, CancellationToken ct)
    {
        var query = db.Favorites.AsNoTracking().Where(favorite => favorite.UserId == userId);
        if (targetType.HasValue)
            query = query.Where(favorite => favorite.TargetType == targetType.Value);
        return await query.OrderByDescending(favorite => favorite.CreatedAt).ThenBy(favorite => favorite.Id).ToListAsync(ct);
    }

    public Task<Favorite?> GetAsync(Guid id, string userId, CancellationToken ct) =>
        db.Favorites.SingleOrDefaultAsync(favorite => favorite.Id == id && favorite.UserId == userId, ct);

    public Task<bool> ExistsAsync(string userId, FavoriteTargetType targetType, Guid targetId, CancellationToken ct) =>
        db.Favorites.AnyAsync(favorite => favorite.UserId == userId && favorite.TargetType == targetType && favorite.TargetId == targetId, ct);

    public async Task<FavoriteTargetInfo?> GetPublicTargetAsync(FavoriteTargetType targetType, Guid targetId, CancellationToken ct) =>
        targetType switch
        {
            FavoriteTargetType.Recipe => await db.Recipes.AsNoTracking().Where(recipe => recipe.Id == targetId && recipe.IsActive)
                .Select(recipe => new FavoriteTargetInfo(recipe.Id, recipe.Name, recipe.ImageUrl)).SingleOrDefaultAsync(ct),
            FavoriteTargetType.Restaurant => await db.Restaurants.AsNoTracking().Where(restaurant => restaurant.Id == targetId && restaurant.IsActive)
                .Select(restaurant => new FavoriteTargetInfo(restaurant.Id, restaurant.Name, restaurant.ImageUrl)).SingleOrDefaultAsync(ct),
            FavoriteTargetType.Video => await db.ModerationSubmissions.AsNoTracking()
                .Where(submission => submission.ContentId == targetId && submission.ContentType == ModeratedContentType.Video && submission.IsCurrentPublished)
                .Select(submission => new FavoriteTargetInfo(submission.ContentId, submission.Title, null)).SingleOrDefaultAsync(ct),
            _ => null
        };

    public void Add(Favorite favorite) => db.Favorites.Add(favorite);

    public void Remove(Favorite favorite) => db.Favorites.Remove(favorite);

    public async Task SaveAsync(CancellationToken ct)
    {
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException { Number: 2601 or 2627 })
        {
            throw new ConflictException("This item is already saved in favorites.");
        }
    }
}
