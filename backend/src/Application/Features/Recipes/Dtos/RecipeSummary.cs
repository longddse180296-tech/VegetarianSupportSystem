// Chức năng: công thức và định lượng nguyên liệu. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using Domain.ValueObjects;
using Domain.Enums;

namespace Application.Features.Recipes;

// RecipeSummary: định nghĩa dữ liệu trao đổi của tính năng.
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
    IReadOnlyList<DietaryAssessment> DietaryAssessments,
    decimal? ProteinGramPerServing,
    decimal? CarbohydrateGramPerServing,
    decimal? FatGramPerServing,
    IReadOnlyList<string> IngredientNames,
    string? Description = null);
