// BE2-03 | Kết quả danh sách và thông tin phân trang (nguyên liệu: nguồn gốc, dị nguyên và dinh dưỡng theo đơn vị).
// Trả một trang nguyên liệu, nguồn gốc, đơn vị và dinh dưỡng kèm thông tin phân trang.
namespace Application.Features.Ingredients;

// IngredientPage: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record IngredientPage(IReadOnlyList<IngredientResponse> Items, int PageNumber, int PageSize, int TotalCount);
