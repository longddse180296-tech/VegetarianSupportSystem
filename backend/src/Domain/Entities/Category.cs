// BE2-02 | Mô hình nghiệp vụ lưu danh mục và trạng thái còn sử dụng.
// Chức năng: hạ tầng và quy tắc dùng chung. Tầng Domain mô tả dữ liệu hoặc quy tắc nghiệp vụ, không phụ thuộc HTTP hay cơ sở dữ liệu.
using Domain.Enums;

namespace Domain.Entities;

// Category: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class Category
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public CategoryKind Kind { get; init; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAt { get; set; }

    public ICollection<Recipe> Recipes { get; set; } = new List<Recipe>();
}
