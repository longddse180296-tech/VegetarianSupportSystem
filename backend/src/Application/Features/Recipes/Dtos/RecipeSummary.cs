// BE2-01/04 | Dữ liệu trả về cho giao diện (công thức: bộ lọc public, định lượng và dinh dưỡng theo khẩu phần).
// Trả thông tin rút gọn về công thức, số khẩu phần, nguyên liệu và hướng dẫn nấu để hiển thị trong danh sách.
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
    string? Description = null, DietaryType? InferredDietaryType = null, bool RequiresReview = false);
