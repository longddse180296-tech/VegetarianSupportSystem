using System.ComponentModel.DataAnnotations;
using Domain.Enums;

namespace Application.Features.Favorites;

public sealed class FavoriteListQuery
{
    public FavoriteTargetType? TargetType { get; init; }

    [Range(1, int.MaxValue)]
    public int PageNumber { get; init; } = 1;

    [Range(1, 100)]
    public int PageSize { get; init; } = 20;
}
