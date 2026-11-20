// BE2-02 | Tham số lọc, phân trang hoặc giới hạn kết quả (danh mục: tên, mô tả và trạng thái sử dụng).
// Nhận bộ lọc và phân trang cho danh sách danh mục theo loại nội dung.
using System.ComponentModel.DataAnnotations;

namespace Application.Features.Categories;

// CategoryListQuery: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class CategoryListQuery
{
    [Range(1, int.MaxValue)]
    public int PageNumber { get; init; } = 1;
    [Range(1, 100)]
    public int PageSize { get; init; } = 20;
    [StringLength(120)]
    public string? Search { get; init; }
}
