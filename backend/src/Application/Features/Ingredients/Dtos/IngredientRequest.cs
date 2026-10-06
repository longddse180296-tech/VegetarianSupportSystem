using System.ComponentModel.DataAnnotations;
using Application.Common.Validation;
using Domain.Enums;

namespace Application.Features.Ingredients;

public sealed class IngredientRequest
{
    [Required, StringLength(120)]
    public string Name { get; init; } = string.Empty;
    [StringLength(1000)]
    public string? Aliases { get; init; }
    [EnumDataType(typeof(IngredientOrigin))]
    public IngredientOrigin Origin { get; init; }

    public bool ContainsEgg { get; init; }

    public bool ContainsMilk { get; init; }

    public bool ContainsHoney { get; init; }
    public bool? ContainsOtherAnimalProducts { get; init; }
    [StringLength(1000)]
    public string? Allergens { get; init; }
    [StringLength(40)]
    public string? DefaultUnit { get; init; }
    [Range(typeof(decimal), "0", "999999999", ParseLimitsInInvariantCulture = true)]
    [DecimalPrecision(3)]
    public decimal? CaloriesPer100Gram { get; init; }
    [Range(typeof(decimal), "0", "999999999", ParseLimitsInInvariantCulture = true)]
    [DecimalPrecision(3)]
    public decimal? ProteinGramPer100Gram { get; init; }
    [Range(typeof(decimal), "0", "999999999", ParseLimitsInInvariantCulture = true)]
    [DecimalPrecision(3)]
    public decimal? CarbohydrateGramPer100Gram { get; init; }
    [Range(typeof(decimal), "0", "999999999", ParseLimitsInInvariantCulture = true)]
    [DecimalPrecision(3)]
    public decimal? FatGramPer100Gram { get; init; }
    [StringLength(1000)]
    public string? Source { get; init; }
}
