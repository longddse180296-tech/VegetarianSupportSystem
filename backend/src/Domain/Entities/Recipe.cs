namespace Domain.Entities;

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
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAt { get; set; }

    public ICollection<RecipeIngredient> RecipeIngredients { get; set; } = new List<RecipeIngredient>();
}
