namespace Application.Features.Pantry;

public sealed record PantryRecipeIngredientStatus(
    Guid IngredientId,
    string Name,
    decimal Quantity,
    string Unit,
    bool IsAvailable);
