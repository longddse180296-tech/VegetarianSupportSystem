using Application.Common.Exceptions;
using Application.Features.Restaurants;
using Domain.Entities;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace Infrastructure.Persistence.Repositories;

public sealed class RestaurantRepository(AppDbContext db) : IRestaurantRepository
{
    public async Task<IReadOnlyList<Restaurant>> ListAsync(RestaurantListQuery request, bool includeInactive, CancellationToken ct)
    {
        var query = db.Restaurants.AsNoTracking().AsQueryable();
        if (!includeInactive)
            query = query.Where(restaurant => restaurant.IsActive);
        if (request.DietaryType.HasValue)
            query = query.Where(restaurant => restaurant.DietaryTypes.Any(type => type.DietaryType == request.DietaryType.Value));

        var restaurants = await query
            .Include(restaurant => restaurant.DietaryTypes)
            .Include(restaurant => restaurant.Amenities)
            .Include(restaurant => restaurant.FeaturedDishes)
            .AsSplitQuery()
            .ToListAsync(ct);

        // District data entered by Admin is free text ("Quận 3", "Q.3", ...).
        // Normalize both sides after loading so location search remains predictable
        // regardless of case, accents, punctuation, or the abbreviated district form.
        return restaurants
            .Where(restaurant => MatchesSearch(restaurant, request.Search))
            .Where(restaurant => MatchesDistrict(restaurant, request.District))
            .ToArray();
    }

    public Task<Restaurant?> GetAsync(Guid id, CancellationToken ct) => db.Restaurants
        .Include(restaurant => restaurant.DietaryTypes)
        .Include(restaurant => restaurant.Amenities)
        .Include(restaurant => restaurant.FeaturedDishes)
        .SingleOrDefaultAsync(restaurant => restaurant.Id == id, ct);

    public Task<bool> NameExistsAsync(string name, Guid? exceptId, CancellationToken ct) =>
        db.Restaurants.AnyAsync(restaurant => restaurant.Name == name && restaurant.Id != exceptId, ct);

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

    private static bool MatchesSearch(Restaurant restaurant, string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return true;
        var search = Normalize(value);
        return Normalize(restaurant.Name).Contains(search, StringComparison.Ordinal) ||
            Normalize(restaurant.Address).Contains(search, StringComparison.Ordinal) ||
            Normalize(restaurant.District).Contains(search, StringComparison.Ordinal);
    }

    private static bool MatchesDistrict(Restaurant restaurant, string? value) =>
        string.IsNullOrWhiteSpace(value) ||
        Normalize(restaurant.District).Contains(Normalize(value), StringComparison.Ordinal) ||
        Normalize(restaurant.Address).Contains(Normalize(value), StringComparison.Ordinal);

    private static string Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return string.Empty;
        var decomposed = value.Normalize(NormalizationForm.FormD);
        var plain = new string(decomposed.Where(character => CharUnicodeInfo.GetUnicodeCategory(character) != UnicodeCategory.NonSpacingMark).ToArray())
            .ToLowerInvariant();
        plain = Regex.Replace(plain, @"\bq\s*\.?\s*(\d+)\b", "quan $1");
        return Regex.Replace(plain, @"[^a-z0-9]+", " ").Trim();
    }
}
