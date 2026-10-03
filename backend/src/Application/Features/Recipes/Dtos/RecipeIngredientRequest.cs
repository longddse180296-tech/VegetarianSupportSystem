using System.ComponentModel.DataAnnotations;
using Application.Common.Validation;

namespace Application.Features.Recipes;

public sealed class RecipeIngredientRequest
{
    public Guid IngredientId { get; init; }
    [Range(typeof(decimal), "0.001", "999999999", ParseLimitsInInvariantCulture = true)]
    [DecimalPrecision(3)]
    public decimal Quantity { get; init; }
    [Required, StringLength(40)]
    public string Unit { get; init; } = string.Empty;
    [StringLength(500)]
    public string? Note { get; init; }
}
