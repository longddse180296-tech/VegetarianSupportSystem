// BE2-01/04 | Dữ liệu trả về cho giao diện (công thức: bộ lọc public, định lượng và dinh dưỡng theo khẩu phần).
// Định nghĩa các trường API trả về cho nguyên liệu và định lượng của công thức.
namespace Application.Features.Recipes;

// RecipeIngredientResponse: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record RecipeIngredientResponse(Guid IngredientId, string Name, bool IsActive, decimal Quantity, string Unit, string? Note);
