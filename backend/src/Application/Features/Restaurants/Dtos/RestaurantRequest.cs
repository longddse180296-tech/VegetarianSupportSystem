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

    [Required, MinLength(1), MaxLength(4)]
    public DietaryType[] DietaryTypes { get; init; } = [];

    [MaxLength(30)]
    public string[] Amenities { get; init; } = [];

    [MaxLength(100)]
    public Guid[] RelatedRecipeIds { get; init; } = [];
}
