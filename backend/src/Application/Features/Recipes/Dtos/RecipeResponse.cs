// Chức năng: công thức và định lượng nguyên liệu. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using Domain.ValueObjects;
using Domain.Enums;

namespace Application.Features.Recipes;

// RecipeResponse: định nghĩa dữ liệu trao đổi của tính năng.
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
    DietaryType? DeclaredDietaryType,
    bool IsActive, DateTimeOffset CreatedAt, DateTimeOffset? UpdatedAt,
    string CategoryName, IReadOnlyList<RecipeIngredientResponse> Ingredients,
    IReadOnlyList<DietaryAssessment> DietaryAssessments);
