// BE2-03 | Mô hình nghiệp vụ lưu nguồn gốc, dị nguyên và mốc dinh dưỡng của nguyên liệu.
// Lưu nguyên liệu, nguồn gốc, đơn vị và dinh dưỡng.

namespace Domain.Entities;

// Ingredient: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class Ingredient
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string? Aliases { get; set; }
    public bool ContainsEgg { get; set; }
    public bool ContainsMilk { get; set; }
    public bool ContainsHoney { get; set; }
    public string? Allergens { get; set; }
    public string? DefaultUnit { get; set; }
    public decimal? Calories { get; set; }
    public decimal? ProteinGram { get; set; }
    public decimal? CarbohydrateGram { get; set; }
    public decimal? FatGram { get; set; }
    public string NutritionBasisUnit { get; set; } = "g";
    public decimal NutritionBasisQuantity { get; set; } = 100;
    public string? Source { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAt { get; set; }

    public ICollection<RecipeIngredient> RecipeIngredients { get; set; } = new List<RecipeIngredient>();
}
