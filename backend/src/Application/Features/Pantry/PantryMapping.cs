using Domain.Entities;
using Domain.Enums;
using Domain.Rules;

namespace Application.Features.Pantry;

internal static class PantryMapping
{
    public static PantryItemResponse ToItemResponse(PantryItem item, UserProfile? profile)
    {
        var ingredient = item.Ingredient;
        var dietaryCompatibility = ingredient is null || profile?.Diet is null
            ? (DietaryCompatibility?)null
            : DietaryRules.Classify([ingredient]).Single(x => x.DietaryType == ToDietaryType(profile.Diet.Value)).Status;
        var allergenWarnings = ingredient is null || profile is null
            ? []
            : MatchingAllergies(ingredient, profile);
        var avoidedFoodWarnings = ingredient is null || profile is null
            ? []
            : MatchingAvoidedFoods(ingredient, profile);

        return new PantryItemResponse(
            item.Id,
            item.IngredientId,
            ingredient?.Name ?? item.CustomName!,
            ingredient is not null,
            item.Quantity,
            item.Unit ?? ingredient?.DefaultUnit,
            profile?.Diet,
            dietaryCompatibility,
            DietaryNotice(ingredient, profile?.Diet, dietaryCompatibility),
            allergenWarnings,
            avoidedFoodWarnings,
            item.CreatedAt,
            item.UpdatedAt);
    }

    public static PantryRecipeSuggestionResponse ToRecipeSuggestion(Recipe recipe, ISet<Guid> pantryIngredientIds)
    {
        var rows = recipe.RecipeIngredients
            .OrderBy(row => row.Ingredient!.Name).ThenBy(row => row.IngredientId)
            .Select(row => new PantryRecipeIngredientStatus(
                row.IngredientId,
                row.Ingredient!.Name,
                row.Quantity,
                row.Unit,
                pantryIngredientIds.Contains(row.IngredientId)))
            .ToArray();
        var available = rows.Where(row => row.IsAvailable).ToArray();
        var missing = rows.Where(row => !row.IsAvailable).ToArray();
        var matchPercent = rows.Length == 0 ? 0 : decimal.Round(available.Length * 100m / rows.Length, 2);

        return new PantryRecipeSuggestionResponse(
            recipe.Id,
            recipe.Name,
            recipe.ImageUrl,
            recipe.Servings,
            recipe.PrepTimeMinutes + recipe.CookTimeMinutes,
            recipe.CaloriesPerServing,
            matchPercent,
            available,
            missing);
    }

    public static PantrySubstitutionCandidateResponse ToSubstitutionCandidate(Ingredient ingredient, UserProfile? profile) => new(
        ingredient.Id,
        ingredient.Name,
        ingredient.DefaultUnit,
        profile?.Diet is null
            ? null
            : DietaryRules.Classify([ingredient]).Single(x => x.DietaryType == ToDietaryType(profile.Diet.Value)).Status,
        profile is null ? [] : MatchingAllergies(ingredient, profile),
        profile is null ? [] : MatchingAvoidedFoods(ingredient, profile));

    public static bool IsUsableForProfile(Ingredient ingredient, UserProfile? profile)
    {
        if (profile?.Diet is { } diet && DietaryRules.Classify([ingredient])
            .Single(x => x.DietaryType == ToDietaryType(diet)).Status != DietaryCompatibility.Compatible)
            return false;

        return profile is null || MatchingAllergies(ingredient, profile).Count == 0 &&
            MatchingAvoidedFoods(ingredient, profile).Count == 0;
    }

    public static bool IsRecipeUsableForProfile(Recipe recipe, UserProfile? profile) =>
        recipe.RecipeIngredients.All(row => row.Ingredient is not null && IsUsableForProfile(row.Ingredient, profile));

    private static DietaryType ToDietaryType(VegetarianDiet diet) => diet switch
    {
        VegetarianDiet.Vegan => DietaryType.Vegan,
        VegetarianDiet.Lacto => DietaryType.LactoVegetarian,
        VegetarianDiet.Ovo => DietaryType.OvoVegetarian,
        VegetarianDiet.LactoOvo => DietaryType.LactoOvoVegetarian,
        _ => throw new ArgumentOutOfRangeException(nameof(diet))
    };

    private static string? DietaryNotice(Ingredient? ingredient, VegetarianDiet? diet, DietaryCompatibility? compatibility)
    {
        if (ingredient is null)
            return "Ingredient has not been matched to the managed catalog, so dietary suitability is unknown.";
        if (diet is null)
            return "Add a dietary profile to assess this ingredient.";
        return compatibility switch
        {
            DietaryCompatibility.Compatible => "Compatible with the dietary profile based on managed ingredient data.",
            DietaryCompatibility.Incompatible => "Not compatible with the dietary profile based on managed ingredient data.",
            _ => "Ingredient data is insufficient to assess compatibility with the dietary profile."
        };
    }

    private static IReadOnlyList<string> MatchingAllergies(Ingredient ingredient, UserProfile profile) =>
        profile.Allergies.Where(item => ContainsTerm(ingredient.Allergens, item.NormalizedName))
            .Select(item => item.Name).OrderBy(name => name).ToArray();

    private static IReadOnlyList<string> MatchingAvoidedFoods(Ingredient ingredient, UserProfile profile) =>
        profile.AvoidedFoods.Where(item => ContainsTerm(ingredient.Name, item.NormalizedName) ||
                ContainsTerm(ingredient.Aliases, item.NormalizedName))
            .Select(item => item.Name).OrderBy(name => name).ToArray();

    private static bool ContainsTerm(string? source, string normalizedTerm) => !string.IsNullOrWhiteSpace(source) &&
        source.Split([',', ';', '|'], StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
            .Any(value => string.Equals(value, normalizedTerm, StringComparison.OrdinalIgnoreCase));
}
