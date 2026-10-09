using Domain.Entities;
using Domain.Enums;

namespace Application.Features.Favorites;

public interface IFavoriteRepository
{
    Task<IReadOnlyList<Favorite>> ListAsync(string userId, FavoriteTargetType? targetType, CancellationToken ct);
    Task<Favorite?> GetAsync(Guid id, string userId, CancellationToken ct);
    Task<bool> ExistsAsync(string userId, FavoriteTargetType targetType, Guid targetId, CancellationToken ct);
    Task<FavoriteTargetInfo?> GetPublicTargetAsync(FavoriteTargetType targetType, Guid targetId, CancellationToken ct);
    void Add(Favorite favorite);
    void Remove(Favorite favorite);
    Task SaveAsync(CancellationToken ct);
}

public sealed record FavoriteTargetInfo(Guid Id, string Name, string? ImageUrl);
