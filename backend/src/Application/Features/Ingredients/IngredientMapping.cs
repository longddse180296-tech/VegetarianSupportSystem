using Domain.Entities;

namespace Application.Features.Ingredients;

internal static class IngredientMapping
{
    public static IngredientResponse ToResponse(Ingredient entity) => new(
        entity.Id,
        entity.Name,
        entity.Aliases,
        entity.Origin,
        entity.ContainsEgg,
        entity.ContainsMilk,
        entity.ContainsHoney,
        entity.ContainsOtherAnimalProducts,
        entity.Allergens,
        entity.DefaultUnit,
        entity.CaloriesPer100Gram,
        entity.ProteinGramPer100Gram,
        entity.CarbohydrateGramPer100Gram,
        entity.FatGramPer100Gram,
        entity.Source,
        entity.IsActive,
        entity.CreatedAt,
        entity.UpdatedAt);
}
