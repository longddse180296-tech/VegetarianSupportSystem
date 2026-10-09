namespace Application.Features.Pantry;

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
