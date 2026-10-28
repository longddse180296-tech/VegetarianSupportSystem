// Chức năng: danh mục nguyên liệu và dữ liệu dinh dưỡng. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
namespace Application.Features.Ingredients;

// IngredientPage: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record IngredientPage(IReadOnlyList<IngredientResponse> Items, int PageNumber, int PageSize, int TotalCount);
