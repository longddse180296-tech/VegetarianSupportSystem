using System.ComponentModel.DataAnnotations;
using Application.Common.Validation;
using Domain.Enums;

namespace Application.Features.Restaurants;

public sealed class RestaurantRequest
{
    [Required, StringLength(120)]
    public string Name { get; init; } = string.Empty;

    [StringLength(2000)]
    public string? Description { get; init; }

    [Required, StringLength(300)]
    public string Address { get; init; } = string.Empty;

    [StringLength(120)]
    public string? District { get; init; }

    [Range(typeof(decimal), "-90", "90", ParseLimitsInInvariantCulture = true)]
    [DecimalPrecision(6)]
    public decimal? Latitude { get; init; }

    [Range(typeof(decimal), "-180", "180", ParseLimitsInInvariantCulture = true)]
    [DecimalPrecision(6)]
    public decimal? Longitude { get; init; }

    [StringLength(40)]
    public string? ContactPhone { get; init; }

    [StringLength(2048)]
    public string? WebsiteUrl { get; init; }

    [StringLength(1000)]
    public string? OpeningHours { get; init; }

    [Range(0, 1_000_000_000)]
    public int? PriceFromVnd { get; init; }

    [Range(0, 1_000_000_000)]
    public int? PriceToVnd { get; init; }

    [StringLength(2048)]
    public string? ImageUrl { get; init; }

    [StringLength(500)]
    public string? Source { get; init; }

    [Required]
    public DietaryType? DietaryType { get; init; }

    // Kept temporarily so older clients can complete an edit only when they send
    // exactly one type. New clients must use dietaryType.
    public DietaryType[] DietaryTypes { get; init; } = [];

    [MaxLength(30)]
    public string[] Amenities { get; init; } = [];

    [MinLength(3), MaxLength(3)]
    public RestaurantFeaturedDishRequest[] FeaturedDishes { get; init; } = [];
}
