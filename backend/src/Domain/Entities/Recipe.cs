// Chức năng: công thức và định lượng nguyên liệu. Tầng Domain mô tả dữ liệu hoặc quy tắc nghiệp vụ, không phụ thuộc HTTP hay cơ sở dữ liệu.
namespace Domain.Entities;

using Domain.Enums;

// Recipe: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class Recipe
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CategoryId { get; set; }
    public Category? Category { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Servings { get; set; }
    public string Instructions { get; set; } = string.Empty;
    public int PrepTimeMinutes { get; set; }
    public int CookTimeMinutes { get; set; }
    public string? ImageUrl { get; set; }
    public decimal? CaloriesPerServing { get; set; }
    public decimal? ProteinGramPerServing { get; set; }
    public decimal? CarbohydrateGramPerServing { get; set; }
    public decimal? FatGramPerServing { get; set; }
    // Admin chooses one intended vegetarian diet. The application service verifies it
    // against the live ingredient-based classification before saving.
    public DietaryType? DeclaredDietaryType { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAt { get; set; }

    public ICollection<RecipeIngredient> RecipeIngredients { get; set; } = new List<RecipeIngredient>();
}
