namespace Domain.Entities;

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
