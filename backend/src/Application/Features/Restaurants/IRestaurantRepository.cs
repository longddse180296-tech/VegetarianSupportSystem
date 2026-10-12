using Domain.Entities;

namespace Application.Features.Restaurants;

public interface IRestaurantRepository
{
    Task<IReadOnlyList<Restaurant>> ListAsync(RestaurantListQuery query, bool includeInactive, CancellationToken ct);
    Task<Restaurant?> GetAsync(Guid id, CancellationToken ct);
    Task<bool> NameExistsAsync(string name, Guid? exceptId, CancellationToken ct);
    Task<IReadOnlyList<Recipe>> GetActiveRecipesAsync(IReadOnlyCollection<Guid> ids, CancellationToken ct);
    void Add(Restaurant entity);
    Task SaveAsync(CancellationToken ct);
}
