// BE2-01/04 | Kết quả danh sách và thông tin phân trang (công thức: bộ lọc public, định lượng và dinh dưỡng theo khẩu phần).
// Trả một trang công thức, số khẩu phần, nguyên liệu và hướng dẫn nấu kèm thông tin phân trang.
namespace Application.Features.Recipes;

// RecipePage: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record RecipePage(IReadOnlyList<RecipeSummary> Items, int PageNumber, int PageSize, int TotalCount);
