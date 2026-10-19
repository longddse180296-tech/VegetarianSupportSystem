using Domain.ValueObjects;
using Domain.Enums;

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
    DietaryType? DeclaredDietaryType,
    bool IsActive,
    IReadOnlyList<DietaryAssessment> DietaryAssessments);
