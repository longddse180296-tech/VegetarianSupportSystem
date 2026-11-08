// BE2-01/04 | Danh sách định lượng và số khẩu phần để tính dinh dưỡng (công thức: bộ lọc public, định lượng và dinh dưỡng theo khẩu phần).
// Chức năng: công thức và định lượng nguyên liệu. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using System.ComponentModel.DataAnnotations;

namespace Application.Features.Recipes;

// RecipeNutritionRequest: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class RecipeNutritionRequest
{
    [Range(1, 10000)]
    public int Servings { get; init; }
    [Required, MinLength(1), MaxLength(200)]
    public RecipeIngredientRequest[] Ingredients { get; init; } = [];
}
