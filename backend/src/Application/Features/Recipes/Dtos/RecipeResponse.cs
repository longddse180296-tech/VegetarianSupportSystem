// BE2-01/04 | Dữ liệu trả về cho giao diện (công thức: bộ lọc public, định lượng và dinh dưỡng theo khẩu phần).
// Định nghĩa các trường API trả về cho công thức, số khẩu phần, nguyên liệu và hướng dẫn nấu.
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
