using Domain.Entities;
using Domain.Rules;

namespace Application.Features.Recipes;

internal static class RecipeMapping
{
    public static RecipeResponse ToResponse(Recipe entity) => new(
        entity.Id,
        entity.CategoryId,
        entity.Name,
        entity.Description,
        entity.Servings,
        entity.Instructions,
        entity.PrepTimeMinutes,
        entity.CookTimeMinutes,
        entity.ImageUrl,
        entity.CaloriesPerServing,
        entity.ProteinGramPerServing,
        entity.CarbohydrateGramPerServing,
        entity.FatGramPerServing,
        entity.IsActive,
        entity.CreatedAt,
        entity.UpdatedAt,
        entity.Category!.Name,
        entity.RecipeIngredients
            .OrderBy(row => row.Ingredient!.Name)
            .ThenBy(row => row.IngredientId)
            .Select(ToIngredientResponse)
            .ToArray(),
        DietaryRules.Classify(entity.RecipeIngredients.Select(row => row.Ingredient!)));

    public static RecipeSummary ToSummary(Recipe entity) => new(
        entity.Id,
        entity.Name,
        entity.CategoryId,
        entity.Category!.Name,
        entity.Servings,
        entity.PrepTimeMinutes,
        entity.CookTimeMinutes,
        entity.ImageUrl,
        entity.CaloriesPerServing,
        entity.IsActive,
        DietaryRules.Classify(entity.RecipeIngredients.Select(x => x.Ingredient!)));

    private static RecipeIngredientResponse ToIngredientResponse(RecipeIngredient row) => new(
        row.IngredientId,
        row.Ingredient!.Name,
        row.Ingredient.IsActive,
        row.Quantity,
        row.Unit,
        row.Note);
}
