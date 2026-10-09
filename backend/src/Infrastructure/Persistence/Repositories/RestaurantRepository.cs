using Application.Common.Exceptions;
using Application.Features.Restaurants;
using Domain.Entities;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public sealed class RestaurantRepository(AppDbContext db) : IRestaurantRepository
{
    public async Task<IReadOnlyList<Restaurant>> ListAsync(RestaurantListQuery request, bool includeInactive, CancellationToken ct)
    {
        var query = db.Restaurants.AsNoTracking().AsQueryable();
        if (!includeInactive)
            query = query.Where(restaurant => restaurant.IsActive);
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            query = query.Where(restaurant => restaurant.Name.Contains(search) || restaurant.Address.Contains(search) ||
                (restaurant.District != null && restaurant.District.Contains(search)));
        }
        if (!string.IsNullOrWhiteSpace(request.District))
        {
            var district = request.District.Trim();
            query = query.Where(restaurant => restaurant.District != null && restaurant.District.Contains(district));
        }
        if (request.DietaryType.HasValue)
            query = query.Where(restaurant => restaurant.DietaryTypes.Any(type => type.DietaryType == request.DietaryType.Value));

        return await query
            .Include(restaurant => restaurant.DietaryTypes)
            .Include(restaurant => restaurant.Amenities)
            .Include(restaurant => restaurant.RelatedRecipes).ThenInclude(link => link.Recipe)
            .AsSplitQuery()
            .ToListAsync(ct);
    }

    public Task<Restaurant?> GetAsync(Guid id, CancellationToken ct) => db.Restaurants
        .Include(restaurant => restaurant.DietaryTypes)
        .Include(restaurant => restaurant.Amenities)
        .Include(restaurant => restaurant.RelatedRecipes).ThenInclude(link => link.Recipe)
        .SingleOrDefaultAsync(restaurant => restaurant.Id == id, ct);

    public Task<bool> NameExistsAsync(string name, Guid? exceptId, CancellationToken ct) =>
        db.Restaurants.AnyAsync(restaurant => restaurant.Name == name && restaurant.Id != exceptId, ct);

    public async Task<IReadOnlyList<Recipe>> GetActiveRecipesAsync(IReadOnlyCollection<Guid> ids, CancellationToken ct) =>
        ids.Count == 0
            ? []
            : await db.Recipes.AsNoTracking().Where(recipe => ids.Contains(recipe.Id) && recipe.IsActive).ToListAsync(ct);

    public void Add(Restaurant entity) => db.Restaurants.Add(entity);

    public async Task SaveAsync(CancellationToken ct)
    {
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException { Number: 2601 or 2627 })
        {
            throw new ConflictException("Restaurant name or amenity already exists.");
        }
    }
}
