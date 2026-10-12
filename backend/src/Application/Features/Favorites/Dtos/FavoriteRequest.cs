using System.ComponentModel.DataAnnotations;
using Domain.Enums;

namespace Application.Features.Favorites;

public sealed class FavoriteRequest
{
    [Required]
    public FavoriteTargetType? TargetType { get; init; }

    public Guid TargetId { get; init; }
}
