// Chức năng: danh mục nguyên liệu và dữ liệu dinh dưỡng. Tầng Domain mô tả dữ liệu hoặc quy tắc nghiệp vụ, không phụ thuộc HTTP hay cơ sở dữ liệu.
using Domain.Enums;

namespace Domain.Entities;

// Ingredient: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class Ingredient
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string? Aliases { get; set; }
    public IngredientOrigin Origin { get; set; } = IngredientOrigin.Unknown;
    public bool ContainsEgg { get; set; }
    public bool ContainsMilk { get; set; }
    public bool ContainsHoney { get; set; }
    // Null means that other animal components have not been verified.
    public bool? ContainsOtherAnimalProducts { get; set; }
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
