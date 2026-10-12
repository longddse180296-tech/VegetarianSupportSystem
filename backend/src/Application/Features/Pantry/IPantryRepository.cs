using Domain.Entities;

namespace Application.Features.Pantry;

public interface IPantryRepository
{
    Task<IReadOnlyList<PantryItem>> ListAsync(string userId, CancellationToken ct);
    Task<PantryItem?> GetAsync(Guid id, string userId, CancellationToken ct);
    Task<Ingredient?> GetActiveIngredientAsync(Guid id, CancellationToken ct);
    Task<Ingredient?> FindActiveIngredientByNameOrAliasAsync(string name, CancellationToken ct);
    Task<bool> HasIngredientAsync(string userId, Guid ingredientId, Guid? exceptId, CancellationToken ct);
    Task<bool> HasCustomNameAsync(string userId, string name, Guid? exceptId, CancellationToken ct);
    Task<UserProfile?> GetProfileAsync(string userId, CancellationToken ct);
    Task<IReadOnlyList<Recipe>> GetActiveRecipesAsync(CancellationToken ct);
    Task<IReadOnlyList<Ingredient>> GetActiveIngredientsWithUnitAsync(string unit, CancellationToken ct);
    void Add(PantryItem item);
    void Remove(PantryItem item);
    Task SaveAsync(CancellationToken ct);
}
