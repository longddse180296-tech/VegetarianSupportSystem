using Domain.Enums;

namespace Application.Features.Favorites;

public sealed record FavoriteResponse(
    Guid Id,
    FavoriteTargetType TargetType,
    Guid TargetId,
    string TargetName,
    string? ImageUrl,
    DateTimeOffset CreatedAt);
