using Domain.Enums;

namespace Application.Features.Ingredients;

public sealed record IngredientResponse(
    Guid Id,
    string Name,
    string? Aliases,
    IngredientOrigin Origin,
    bool ContainsEgg,
    bool ContainsMilk,
    bool ContainsHoney,
    bool? ContainsOtherAnimalProducts,
    string? Allergens,
    string? DefaultUnit,
    decimal? CaloriesPer100Gram,
    decimal? ProteinGramPer100Gram,
    decimal? CarbohydrateGramPer100Gram,
    decimal? FatGramPer100Gram,
    string? Source,
    bool IsActive, DateTimeOffset CreatedAt, DateTimeOffset? UpdatedAt);
