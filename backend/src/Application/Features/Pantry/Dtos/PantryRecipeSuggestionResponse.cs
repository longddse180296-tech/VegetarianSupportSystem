// BE2-08 | Dữ liệu trả về cho giao diện (tủ bếp cá nhân và gợi ý từ nguyên liệu đang có).
// Định nghĩa các trường API trả về cho công thức gợi ý từ nguyên liệu trong tủ bếp.
namespace Application.Features.Pantry;

// PantryRecipeSuggestionResponse: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record PantryRecipeSuggestionResponse(
    Guid RecipeId,
    string RecipeName,
    string? ImageUrl,
    int Servings,
    int TotalTimeMinutes,
    decimal? CaloriesPerServing,
    decimal MatchPercent,
    IReadOnlyList<PantryRecipeIngredientStatus> AvailableIngredients,
    IReadOnlyList<PantryRecipeIngredientStatus> MissingIngredients,
    decimal? ProteinGramPerServing = null,
    decimal? CarbohydrateGramPerServing = null,
    decimal? FatGramPerServing = null);
