// BE2-02 | Kết quả danh sách và thông tin phân trang (danh mục: tên, mô tả và trạng thái sử dụng).
// Chức năng: danh mục nội dung. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
namespace Application.Features.Categories;

// CategoryPage: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record CategoryPage(IReadOnlyList<CategoryResponse> Items, int PageNumber, int PageSize, int TotalCount);
