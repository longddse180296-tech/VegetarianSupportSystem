using Domain.ValueObjects;

namespace Application.Features.Recipes;

public sealed record RecipeResponse(
    Guid Id,
    Guid CategoryId,
    string Name,
    string? Description,
    int Servings,
    string Instructions,
    int PrepTimeMinutes,
    int CookTimeMinutes,
    string? ImageUrl,
    decimal? CaloriesPerServing,
    decimal? ProteinGramPerServing,
    decimal? CarbohydrateGramPerServing,
    decimal? FatGramPerServing,
    bool IsActive, DateTimeOffset CreatedAt, DateTimeOffset? UpdatedAt,
    string CategoryName, IReadOnlyList<RecipeIngredientResponse> Ingredients,
    IReadOnlyList<DietaryAssessment> DietaryAssessments);
