namespace Application.Features.Recipes;

public sealed record RecipeIngredientResponse(Guid IngredientId, string Name, bool IsActive, decimal Quantity, string Unit, string? Note);
