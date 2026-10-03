using Domain.Entities;

namespace Application.Features.Ingredients;

public interface IIngredientRepository
{
    Task<(IReadOnlyList<Ingredient> Items, int TotalCount)> ListAsync(IngredientListQuery query, bool includeInactive, CancellationToken ct);
    Task<Ingredient?> GetAsync(Guid id, CancellationToken ct);
    Task<bool> NameExistsAsync(string name, Guid? exceptId, CancellationToken ct);
    void Add(Ingredient entity);
    Task SaveAsync(CancellationToken ct);
    Task<IReadOnlyList<Ingredient>> GetManyAsync(IReadOnlyCollection<Guid> ids, CancellationToken ct);
}
