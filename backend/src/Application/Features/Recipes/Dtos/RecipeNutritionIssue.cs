// BE2-01/04 | Thông tin nguyên liệu khiến phép tính dinh dưỡng chưa thể hoàn tất (công thức: bộ lọc public, định lượng và dinh dưỡng theo khẩu phần).
// Mô tả lỗi gắn với một nguyên liệu làm cho kết quả tính dinh dưỡng chưa đầy đủ.
namespace Application.Features.Recipes;

// RecipeNutritionIssue: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record RecipeNutritionIssue(Guid? IngredientId, string Message);
