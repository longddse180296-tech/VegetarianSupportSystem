// BE2-01/04 | Kết quả danh sách và thông tin phân trang (công thức: bộ lọc public, định lượng và dinh dưỡng theo khẩu phần).
// Chức năng: công thức và định lượng nguyên liệu. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
namespace Application.Features.Recipes;

// RecipePage: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record RecipePage(IReadOnlyList<RecipeSummary> Items, int PageNumber, int PageSize, int TotalCount);
