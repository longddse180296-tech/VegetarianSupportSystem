// Chức năng: danh mục nội dung. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
namespace Application.Features.Categories;

// CategoryPage: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record CategoryPage(IReadOnlyList<CategoryResponse> Items, int PageNumber, int PageSize, int TotalCount);
