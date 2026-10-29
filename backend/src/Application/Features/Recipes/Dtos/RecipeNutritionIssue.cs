// Chức năng: công thức và định lượng nguyên liệu. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
namespace Application.Features.Recipes;

// RecipeNutritionIssue: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record RecipeNutritionIssue(Guid? IngredientId, string Message);
