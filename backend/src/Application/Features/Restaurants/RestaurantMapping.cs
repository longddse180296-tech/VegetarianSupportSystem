using Domain.Entities;

namespace Application.Features.Restaurants;

internal static class RestaurantMapping
{
    public static RestaurantSummary ToSummary(Restaurant restaurant, decimal? distanceKm) => new(
        restaurant.Id,
        restaurant.Name,
        restaurant.Address,
        restaurant.District,
        restaurant.ImageUrl,
        restaurant.PriceFromVnd,
        restaurant.PriceToVnd,
        restaurant.IsActive,
        restaurant.DietaryTypes.OrderBy(x => x.DietaryType).Select(x => x.DietaryType).ToArray(),
        restaurant.Amenities.OrderBy(x => x.Name).Select(x => x.Name).ToArray(),
        distanceKm);

    public static RestaurantResponse ToResponse(Restaurant restaurant, decimal? distanceKm, bool includeInactiveRelatedRecipes = false) => new(
        restaurant.Id,
        restaurant.Name,
        restaurant.Description,
        restaurant.Address,
        restaurant.District,
        restaurant.Latitude,
        restaurant.Longitude,
        restaurant.ContactPhone,
        restaurant.WebsiteUrl,
        restaurant.OpeningHours,
        restaurant.PriceFromVnd,
        restaurant.PriceToVnd,
        restaurant.ImageUrl,
        restaurant.Source,
        restaurant.DataUpdatedAt,
        restaurant.IsActive,
        restaurant.CreatedAt,
        restaurant.UpdatedAt,
        restaurant.DietaryTypes.OrderBy(x => x.DietaryType).Select(x => x.DietaryType).ToArray(),
        restaurant.Amenities.OrderBy(x => x.Name).Select(x => x.Name).ToArray(),
        restaurant.RelatedRecipes.Where(x => x.Recipe is not null && (includeInactiveRelatedRecipes || x.Recipe.IsActive))
            .OrderBy(x => x.Recipe!.Name).ThenBy(x => x.RecipeId)
            .Select(x => new RestaurantRelatedRecipe(x.RecipeId, x.Recipe!.Name, x.Recipe.ImageUrl)).ToArray(),
        distanceKm);
}
