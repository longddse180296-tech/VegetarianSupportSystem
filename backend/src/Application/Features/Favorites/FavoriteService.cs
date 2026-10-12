using Application.Common.Exceptions;
using Domain.Entities;

namespace Application.Features.Favorites;

public sealed class FavoriteService(IFavoriteRepository repository)
{
    public async Task<FavoritePage> ListAsync(string userId, FavoriteListQuery query, CancellationToken ct)
    {
        FavoriteValidation.Validate(query);
        var favorites = await repository.ListAsync(userId, query.TargetType, ct);
        var visible = new List<FavoriteResponse>();
        foreach (var favorite in favorites)
        {
            var target = await repository.GetPublicTargetAsync(favorite.TargetType, favorite.TargetId, ct);
            if (target is not null)
                visible.Add(ToResponse(favorite, target));
        }

        var start = (long)(query.PageNumber - 1) * query.PageSize;
        var items = start >= visible.Count
            ? []
            : visible.Skip((int)start).Take(query.PageSize).ToArray();
        return new FavoritePage(items, visible.Count, query.PageNumber, query.PageSize);
    }

    public async Task<FavoriteResponse> CreateAsync(string userId, FavoriteRequest request, CancellationToken ct)
    {
        FavoriteValidation.Validate(request);
        var targetType = request.TargetType!.Value;
        var target = await repository.GetPublicTargetAsync(targetType, request.TargetId, ct)
            ?? throw new KeyNotFoundException("Favorite target was not found or is not publicly available.");
        if (await repository.ExistsAsync(userId, targetType, request.TargetId, ct))
            throw new ConflictException("This item is already saved in favorites.");

        var favorite = new Favorite
        {
            UserId = userId.Trim(),
            TargetType = targetType,
            TargetId = request.TargetId
        };
        repository.Add(favorite);
        await repository.SaveAsync(ct);
        return ToResponse(favorite, target);
    }

    public async Task DeleteAsync(string userId, Guid id, CancellationToken ct)
    {
        var favorite = await repository.GetAsync(id, userId, ct)
            ?? throw new KeyNotFoundException("Favorite was not found.");
        repository.Remove(favorite);
        await repository.SaveAsync(ct);
    }

    private static FavoriteResponse ToResponse(Favorite favorite, FavoriteTargetInfo target) => new(
        favorite.Id, favorite.TargetType, favorite.TargetId, target.Name, target.ImageUrl, favorite.CreatedAt);
}
