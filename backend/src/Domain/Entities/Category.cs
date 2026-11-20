// BE2-02 | Mô hình nghiệp vụ lưu danh mục và trạng thái còn sử dụng.
// Lưu tên, mô tả, loại và trạng thái của danh mục. Loại quyết định bộ chọn nào có thể sử dụng bản ghi.
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
