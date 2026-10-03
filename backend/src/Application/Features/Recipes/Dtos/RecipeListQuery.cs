using System.ComponentModel.DataAnnotations;
using Application.Common.Validation;
using Domain.Enums;

namespace Application.Features.Recipes;

public sealed class RecipeListQuery
{
    [Range(1, int.MaxValue)]
    public int PageNumber { get; init; } = 1;
    [Range(1, 100)]
    public int PageSize { get; init; } = 20;
    [StringLength(120)]
    public string? Search { get; init; }
    public Guid? CategoryId { get; init; }

    [EnumDataType(typeof(DietaryType))]
    public DietaryType? DietaryType { get; init; }

    [Range(0, 10080)]
    public int? MaxCookTimeMinutes { get; init; }

    [Range(typeof(decimal), "0", "999999999", ParseLimitsInInvariantCulture = true)]
    [DecimalPrecision(3)]
    public decimal? MaxCaloriesPerServing { get; init; }
}
