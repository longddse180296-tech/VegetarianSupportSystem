using Application.Common.Exceptions;
using Domain.Entities;

namespace Application.Features.Restaurants;

public sealed class RestaurantService(IRestaurantRepository repository)
{
    public async Task<RestaurantPage> ListAsync(RestaurantListQuery query, bool includeInactive, CancellationToken ct)
    {
        RestaurantValidation.Validate(query);
        var restaurants = await repository.ListAsync(query, includeInactive, ct);
        var items = restaurants
            .Select(restaurant => new RestaurantWithDistance(restaurant, GetDistanceKm(restaurant, query.Latitude, query.Longitude)))
            .Where(item => !query.MaxDistanceKm.HasValue ||
                (item.DistanceKm.HasValue && item.DistanceKm.Value <= query.MaxDistanceKm.Value))
            .OrderBy(item => query.Latitude.HasValue ? item.DistanceKm ?? decimal.MaxValue : 0)
            .ThenBy(item => item.Restaurant.Name)
            .ThenBy(item => item.Restaurant.Id)
            .ToArray();

        var totalCount = items.Length;
        var offset = ((long)query.PageNumber - 1) * query.PageSize;
        var page = offset >= totalCount
            ? Array.Empty<RestaurantWithDistance>()
            : items.Skip((int)offset).Take(query.PageSize).ToArray();

        return new RestaurantPage(
            page.Select(item => RestaurantMapping.ToSummary(item.Restaurant, item.DistanceKm)).ToArray(),
            query.PageNumber,
            query.PageSize,
            totalCount);
    }

    public async Task<RestaurantResponse> GetAsync(Guid id, bool includeInactive, CancellationToken ct)
    {
        var entity = await FindAsync(id, ct);
        if (!includeInactive && !entity.IsActive)
            throw new KeyNotFoundException("Restaurant not found.");
        return RestaurantMapping.ToResponse(entity, null, includeInactive);
    }

    public async Task<RestaurantResponse> CreateAsync(RestaurantRequest request, CancellationToken ct)
    {
        var entity = new Restaurant();
        await ApplyAsync(entity, request, ct);
        repository.Add(entity);
        await repository.SaveAsync(ct);
        return RestaurantMapping.ToResponse(await FindAsync(entity.Id, ct), null);
    }

    public async Task<RestaurantResponse> UpdateAsync(Guid id, RestaurantRequest request, CancellationToken ct)
    {
        var entity = await FindAsync(id, ct);
        await ApplyAsync(entity, request, ct);
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        await repository.SaveAsync(ct);
        return RestaurantMapping.ToResponse(await FindAsync(entity.Id, ct), null);
    }

    public async Task DeactivateAsync(Guid id, CancellationToken ct)
    {
        var entity = await FindAsync(id, ct);
        if (!entity.IsActive)
            return;

        entity.IsActive = false;
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        await repository.SaveAsync(ct);
    }

    private async Task<Restaurant> FindAsync(Guid id, CancellationToken ct) =>
        await repository.GetAsync(id, ct) ?? throw new KeyNotFoundException("Restaurant not found.");

    private async Task ApplyAsync(Restaurant entity, RestaurantRequest request, CancellationToken ct)
    {
        RestaurantValidation.Validate(request);
        if (await repository.NameExistsAsync(request.Name.Trim(), entity.Id, ct))
            throw new ConflictException("Restaurant name already exists.");

        var recipeIds = request.RelatedRecipeIds;
        var recipes = await repository.GetActiveRecipesAsync(recipeIds, ct);
        if (recipes.Count != recipeIds.Length)
            RestaurantValidation.Fail(nameof(request.RelatedRecipeIds), "Related recipes must exist and be active.");

        entity.Name = request.Name.Trim();
        entity.Description = request.Description?.Trim();
        entity.Address = request.Address.Trim();
        entity.District = request.District?.Trim();
        entity.Latitude = request.Latitude;
        entity.Longitude = request.Longitude;
        entity.ContactPhone = request.ContactPhone?.Trim();
        entity.WebsiteUrl = request.WebsiteUrl?.Trim();
        entity.OpeningHours = request.OpeningHours?.Trim();
        entity.PriceFromVnd = request.PriceFromVnd;
        entity.PriceToVnd = request.PriceToVnd;
        entity.ImageUrl = request.ImageUrl?.Trim();
        entity.Source = request.Source?.Trim();
        entity.DataUpdatedAt = DateTimeOffset.UtcNow;

        entity.DietaryTypes.Clear();
        foreach (var dietaryType in request.DietaryTypes.Distinct().OrderBy(x => x))
            entity.DietaryTypes.Add(new RestaurantDietaryType { RestaurantId = entity.Id, DietaryType = dietaryType });

        entity.Amenities.Clear();
        foreach (var amenity in request.Amenities.Select(value => value.Trim()).OrderBy(value => value, StringComparer.OrdinalIgnoreCase))
            entity.Amenities.Add(new RestaurantAmenity { RestaurantId = entity.Id, Name = amenity });

        entity.RelatedRecipes.Clear();
        foreach (var recipe in recipes.OrderBy(recipe => recipe.Name).ThenBy(recipe => recipe.Id))
            entity.RelatedRecipes.Add(new RestaurantRecipe { RestaurantId = entity.Id, RecipeId = recipe.Id });
    }

    private static decimal? GetDistanceKm(Restaurant restaurant, decimal? latitude, decimal? longitude)
    {
        if (!latitude.HasValue || !longitude.HasValue || !restaurant.Latitude.HasValue || !restaurant.Longitude.HasValue)
            return null;

        const double earthRadiusKm = 6371.0088;
        var latitudeRadians = DegreesToRadians((double)latitude.Value);
        var latitudeDelta = DegreesToRadians((double)(restaurant.Latitude.Value - latitude.Value));
        var longitudeDelta = DegreesToRadians((double)(restaurant.Longitude.Value - longitude.Value));
        var sinLatitude = Math.Sin(latitudeDelta / 2);
        var sinLongitude = Math.Sin(longitudeDelta / 2);
        var haversine = sinLatitude * sinLatitude + Math.Cos(latitudeRadians) *
            Math.Cos(DegreesToRadians((double)restaurant.Latitude.Value)) * sinLongitude * sinLongitude;
        var distance = earthRadiusKm * 2 * Math.Atan2(Math.Sqrt(haversine), Math.Sqrt(1 - haversine));
        return decimal.Round((decimal)distance, 3, MidpointRounding.AwayFromZero);
    }

    private static double DegreesToRadians(double value) => value * Math.PI / 180d;

    private sealed record RestaurantWithDistance(Restaurant Restaurant, decimal? DistanceKm);
}
