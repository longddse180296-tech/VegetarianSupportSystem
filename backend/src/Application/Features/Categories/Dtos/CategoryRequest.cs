// BE2-02 | Dữ liệu đầu vào từ API (danh mục: tên, mô tả và trạng thái sử dụng).
// Nhận dữ liệu từ frontend để thực hiện thao tác với danh mục theo loại nội dung.
using System.ComponentModel.DataAnnotations;

namespace Application.Features.Categories;

// CategoryRequest: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class CategoryRequest
{
    [Required, StringLength(120)]
    public string Name { get; init; } = string.Empty;
    [StringLength(500)]
    public string? Description { get; init; }
}
