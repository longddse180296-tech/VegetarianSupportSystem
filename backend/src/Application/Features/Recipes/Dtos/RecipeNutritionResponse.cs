// BE2-01/04 | Kết quả tính dinh dưỡng và các lỗi định lượng (công thức: bộ lọc public, định lượng và dinh dưỡng theo khẩu phần).
// Trả dinh dưỡng trên mỗi khẩu phần, mức độ đầy đủ và các lỗi định lượng.
namespace Application.Features.Recipes;

// RecipeNutritionResponse: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record RecipeNutritionResponse(
    bool IsComplete,
    decimal? CaloriesPerServing,
    decimal? ProteinGramPerServing,
    decimal? CarbohydrateGramPerServing,
    decimal? FatGramPerServing,
    IReadOnlyList<RecipeNutritionIssue> Issues);
