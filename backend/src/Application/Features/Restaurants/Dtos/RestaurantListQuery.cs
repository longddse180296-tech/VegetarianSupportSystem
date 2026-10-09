using System.ComponentModel.DataAnnotations;
using Application.Common.Validation;
using Domain.Enums;

namespace Application.Features.Restaurants;

public sealed class RestaurantListQuery
{
    [Range(1, int.MaxValue)]
    public int PageNumber { get; init; } = 1;

    [Range(1, 100)]
    public int PageSize { get; init; } = 20;

    [StringLength(120)]
    public string? Search { get; init; }

    [StringLength(120)]
    public string? District { get; init; }

    [EnumDataType(typeof(DietaryType))]
    public DietaryType? DietaryType { get; init; }

    [Range(typeof(decimal), "-90", "90", ParseLimitsInInvariantCulture = true)]
    [DecimalPrecision(6)]
    public decimal? Latitude { get; init; }

    [Range(typeof(decimal), "-180", "180", ParseLimitsInInvariantCulture = true)]
    [DecimalPrecision(6)]
    public decimal? Longitude { get; init; }

    [Range(typeof(decimal), "0", "1000", ParseLimitsInInvariantCulture = true)]
    [DecimalPrecision(3)]
    public decimal? MaxDistanceKm { get; init; }
}
