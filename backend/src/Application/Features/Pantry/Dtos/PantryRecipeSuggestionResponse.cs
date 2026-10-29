// Chức năng: tủ bếp và nguyên liệu sẵn có. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
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
    IReadOnlyList<PantryRecipeIngredientStatus> MissingIngredients);
