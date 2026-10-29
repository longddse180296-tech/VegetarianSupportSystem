// Chức năng: tủ bếp và nguyên liệu sẵn có. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using Domain.Entities;
using Domain.Enums;
using Domain.Rules;

namespace Application.Features.Pantry;

// PantryMapping: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
internal static class PantryMapping
{
    // ToItemResponse: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
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

    // ToRecipeSuggestion: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
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

    // ToSubstitutionCandidate: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public static PantrySubstitutionCandidateResponse ToSubstitutionCandidate(Ingredient ingredient, UserProfile? profile) => new(
        ingredient.Id,
        ingredient.Name,
        ingredient.DefaultUnit,
        profile?.Diet is null
            ? null
            : DietaryRules.Classify([ingredient]).Single(x => x.DietaryType == ToDietaryType(profile.Diet.Value)).Status,
        profile is null ? [] : MatchingAllergies(ingredient, profile),
        profile is null ? [] : MatchingAvoidedFoods(ingredient, profile));

    // IsUsableForProfile: Đánh giá điều kiện nghiệp vụ để quyết định nhánh xử lý.
    public static bool IsUsableForProfile(Ingredient ingredient, UserProfile? profile)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (profile?.Diet is { } diet && DietaryRules.Classify([ingredient])
            .Single(x => x.DietaryType == ToDietaryType(diet)).Status != DietaryCompatibility.Compatible)
            return false;

        return profile is null || MatchingAllergies(ingredient, profile).Count == 0 &&
            MatchingAvoidedFoods(ingredient, profile).Count == 0;
    }

    // IsRecipeUsableForProfile: Đánh giá điều kiện nghiệp vụ để quyết định nhánh xử lý.
    public static bool IsRecipeUsableForProfile(Recipe recipe, UserProfile? profile) =>
        recipe.RecipeIngredients.All(row => row.Ingredient is not null && IsUsableForProfile(row.Ingredient, profile));

    // ToDietaryType: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private static DietaryType ToDietaryType(VegetarianDiet diet) => diet switch
    {
        VegetarianDiet.Vegan => DietaryType.Vegan,
        VegetarianDiet.Lacto => DietaryType.LactoVegetarian,
        VegetarianDiet.Ovo => DietaryType.OvoVegetarian,
        VegetarianDiet.LactoOvo => DietaryType.LactoOvoVegetarian,
        _ => throw new ArgumentOutOfRangeException(nameof(diet))
    };

    // DietaryNotice: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private static string? DietaryNotice(Ingredient? ingredient, VegetarianDiet? diet, DietaryCompatibility? compatibility)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
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

    // MatchingAllergies: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private static IReadOnlyList<string> MatchingAllergies(Ingredient ingredient, UserProfile profile) =>
        // Người dùng có thể khai báo chính tên nguyên liệu hoặc tên gọi khác, không chỉ nhóm dị ứng trên nhãn.
        profile.Allergies.Where(item => ContainsTerm(ingredient.Allergens, item.NormalizedName)
                || ContainsTerm(ingredient.Name, item.NormalizedName)
                || ContainsTerm(ingredient.Aliases, item.NormalizedName))
            .Select(item => item.Name).OrderBy(name => name).ToArray();

    // MatchingAvoidedFoods: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private static IReadOnlyList<string> MatchingAvoidedFoods(Ingredient ingredient, UserProfile profile) =>
        profile.AvoidedFoods.Where(item => ContainsTerm(ingredient.Name, item.NormalizedName) ||
                ContainsTerm(ingredient.Aliases, item.NormalizedName))
            .Select(item => item.Name).OrderBy(name => name).ToArray();

    // ContainsTerm: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private static bool ContainsTerm(string? source, string normalizedTerm) => !string.IsNullOrWhiteSpace(source) &&
        source.Split([',', ';', '|'], StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
            .Any(value => string.Equals(value, normalizedTerm, StringComparison.OrdinalIgnoreCase));
}
