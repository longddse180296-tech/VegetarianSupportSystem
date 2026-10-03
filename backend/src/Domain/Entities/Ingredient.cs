using Domain.Enums;

namespace Domain.Entities;

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
    public decimal? CaloriesPer100Gram { get; set; }
    public decimal? ProteinGramPer100Gram { get; set; }
    public decimal? CarbohydrateGramPer100Gram { get; set; }
    public decimal? FatGramPer100Gram { get; set; }
    public string? Source { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAt { get; set; }

    public ICollection<RecipeIngredient> RecipeIngredients { get; set; } = new List<RecipeIngredient>();
}
