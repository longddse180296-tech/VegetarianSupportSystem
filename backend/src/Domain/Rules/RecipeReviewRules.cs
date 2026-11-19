using System.Linq.Expressions;
using Domain.Entities;
using Domain.Enums;

namespace Domain.Rules;

// Dùng cùng một điều kiện cho số cảnh báo, sắp xếp và từng dòng trong bảng Admin.
public static class RecipeReviewRules
{
    public static readonly Expression<Func<Recipe, bool>> RequiresReview = recipe =>
        !recipe.DeclaredDietaryType.HasValue || !recipe.RecipeIngredients.Any() ||
        recipe.CaloriesPerServing == null || recipe.ProteinGramPerServing == null ||
        recipe.CarbohydrateGramPerServing == null || recipe.FatGramPerServing == null ||
        recipe.RecipeIngredients.Any(row => !row.Ingredient!.IsActive) ||
        (recipe.DeclaredDietaryType == DietaryType.Vegan && recipe.RecipeIngredients.Any(row => row.Ingredient!.ContainsEgg || row.Ingredient.ContainsMilk || row.Ingredient.ContainsHoney)) ||
        (recipe.DeclaredDietaryType == DietaryType.OvoVegetarian && (!recipe.RecipeIngredients.Any(row => row.Ingredient!.ContainsEgg) || recipe.RecipeIngredients.Any(row => row.Ingredient!.ContainsMilk))) ||
        (recipe.DeclaredDietaryType == DietaryType.LactoVegetarian && (!recipe.RecipeIngredients.Any(row => row.Ingredient!.ContainsMilk) || recipe.RecipeIngredients.Any(row => row.Ingredient!.ContainsEgg))) ||
        (recipe.DeclaredDietaryType == DietaryType.LactoOvoVegetarian && (!recipe.RecipeIngredients.Any(row => row.Ingredient!.ContainsMilk) || !recipe.RecipeIngredients.Any(row => row.Ingredient!.ContainsEgg)));

    private static readonly Func<Recipe, bool> Evaluate = RequiresReview.Compile();
    public static bool NeedsReview(Recipe recipe) => Evaluate(recipe);
}
