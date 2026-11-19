// BE2-02 | Kết quả danh sách và thông tin phân trang (danh mục: tên, mô tả và trạng thái sử dụng).
// Trả một trang danh mục theo loại nội dung kèm thông tin phân trang.
namespace Application.Features.Categories;

// CategoryPage: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record CategoryPage(IReadOnlyList<CategoryResponse> Items, int PageNumber, int PageSize, int TotalCount);
