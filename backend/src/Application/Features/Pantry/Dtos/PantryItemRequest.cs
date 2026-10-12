using System.ComponentModel.DataAnnotations;
using Application.Common.Validation;

namespace Application.Features.Pantry;

public sealed class PantryItemRequest
{
    public Guid? IngredientId { get; init; }

    [StringLength(120)]
    public string? Name { get; init; }

    [Range(typeof(decimal), "0.001", "999999999", ParseLimitsInInvariantCulture = true)]
    [DecimalPrecision(3)]
    public decimal? Quantity { get; init; }

    [StringLength(40)]
    public string? Unit { get; init; }
}
