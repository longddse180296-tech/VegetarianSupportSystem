// BE2-04 | Mô hình nghiệp vụ lưu liên kết công thức với nguyên liệu, số lượng và đơn vị.
// Lưu nguyên liệu và định lượng của công thức.
namespace Domain.Entities;

// RecipeIngredient: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class RecipeIngredient
{
    public Guid RecipeId { get; set; }
    public Recipe? Recipe { get; set; }
    public Guid IngredientId { get; set; }
    public Ingredient? Ingredient { get; set; }
    public decimal Quantity { get; set; }
    public string Unit { get; set; } = string.Empty;
    public string? Note { get; set; }
}
