using Domain.Entities;

namespace Application.Features.Recipes;

public interface IRecipeRepository
{
    Task<(IReadOnlyList<Recipe> Items, int TotalCount)> ListAsync(RecipeListQuery query, bool includeInactive, CancellationToken ct);
    Task<Recipe?> GetAsync(Guid id, CancellationToken ct);
    Task<bool> NameExistsAsync(string name, Guid? exceptId, CancellationToken ct);
    void Add(Recipe entity);
    Task SaveAsync(CancellationToken ct);
}
