using Domain.ValueObjects;

namespace Application.Features.Recipes;

public sealed record RecipeSummary(
    Guid Id,
    string Name,
    Guid CategoryId,
    string CategoryName,
    int Servings,
    int PrepTimeMinutes,
    int CookTimeMinutes,
    string? ImageUrl,
    decimal? CaloriesPerServing,
    bool IsActive,
    IReadOnlyList<DietaryAssessment> DietaryAssessments);
