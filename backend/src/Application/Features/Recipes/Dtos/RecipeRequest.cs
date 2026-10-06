using System.ComponentModel.DataAnnotations;
using Application.Common.Validation;

namespace Application.Features.Recipes;

public sealed class RecipeRequest
{

    public Guid CategoryId { get; init; }
    [Required, StringLength(120)]
    public string Name { get; init; } = string.Empty;
    [StringLength(2000)]
    public string? Description { get; init; }
    [Range(1, 10000)]
    public int Servings { get; init; }
    [Required, StringLength(20000)]
    public string Instructions { get; init; } = string.Empty;
    [Range(0, 10080)]
    public int PrepTimeMinutes { get; init; }
    [Range(0, 10080)]
    public int CookTimeMinutes { get; init; }
    [StringLength(2048)]
    public string? ImageUrl { get; init; }
    [Range(typeof(decimal), "0", "999999999", ParseLimitsInInvariantCulture = true)]
    [DecimalPrecision(3)]
    public decimal? CaloriesPerServing { get; init; }
    [Range(typeof(decimal), "0", "999999999", ParseLimitsInInvariantCulture = true)]
    [DecimalPrecision(3)]
    public decimal? ProteinGramPerServing { get; init; }
    [Range(typeof(decimal), "0", "999999999", ParseLimitsInInvariantCulture = true)]
    [DecimalPrecision(3)]
    public decimal? CarbohydrateGramPerServing { get; init; }
    [Range(typeof(decimal), "0", "999999999", ParseLimitsInInvariantCulture = true)]
    [DecimalPrecision(3)]
    public decimal? FatGramPerServing { get; init; }
    [Required, MinLength(1), MaxLength(200)]
    public RecipeIngredientRequest[] Ingredients { get; init; } = [];
}
