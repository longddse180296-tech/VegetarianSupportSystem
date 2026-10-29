// Chức năng: danh mục nội dung. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
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
