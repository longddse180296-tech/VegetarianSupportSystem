// Chức năng: công thức và định lượng nguyên liệu. Tầng Domain mô tả dữ liệu hoặc quy tắc nghiệp vụ, không phụ thuộc HTTP hay cơ sở dữ liệu.
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
