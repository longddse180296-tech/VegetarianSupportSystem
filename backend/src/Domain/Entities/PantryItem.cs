// BE2-08 | Mô hình nghiệp vụ lưu nguyên liệu trong tủ của từng tài khoản.
// Lưu nguyên liệu và định lượng trong tủ bếp cá nhân.
namespace Domain.Entities;

// PantryItem: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class PantryItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserId { get; set; } = string.Empty;
    public Guid? IngredientId { get; set; }
    public Ingredient? Ingredient { get; set; }
    public string? CustomName { get; set; }
    public decimal? Quantity { get; set; }
    public string? Unit { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAt { get; set; }
}
