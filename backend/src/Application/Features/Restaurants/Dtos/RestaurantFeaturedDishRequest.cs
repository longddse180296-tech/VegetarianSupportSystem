using System.ComponentModel.DataAnnotations;

namespace Application.Features.Restaurants;

public sealed class RestaurantFeaturedDishRequest
{
    [Required, StringLength(120)]
    public string Name { get; init; } = string.Empty;

    [Required, StringLength(2048)]
    public string ImageUrl { get; init; } = string.Empty;
}
