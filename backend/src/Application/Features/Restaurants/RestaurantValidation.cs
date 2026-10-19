using System.ComponentModel.DataAnnotations;
using Application.Common.Validation;
using Domain.Enums;

namespace Application.Features.Restaurants;

internal static class RestaurantValidation
{
    public static void Validate(RestaurantRequest request)
    {
        RequestValidation.Validate(request);
        if (string.IsNullOrWhiteSpace(request.Name))
            Fail(nameof(request.Name), "Restaurant name is required.");
        if (string.IsNullOrWhiteSpace(request.Address))
            Fail(nameof(request.Address), "Restaurant address is required.");
        if (request.Latitude.HasValue != request.Longitude.HasValue)
            Fail(nameof(request.Latitude), "Latitude and longitude must be supplied together.");
        if (request.PriceFromVnd.HasValue && request.PriceToVnd.HasValue && request.PriceFromVnd > request.PriceToVnd)
            Fail(nameof(request.PriceToVnd), "Maximum price must be greater than or equal to minimum price.");
        if (!IsHttpUrl(request.WebsiteUrl))
            Fail(nameof(request.WebsiteUrl), "Website URL must use http or https.");
        if (!IsHttpUrl(request.ImageUrl))
            Fail(nameof(request.ImageUrl), "Image URL must use http or https.");
        GetSelectedDietaryType(request);
        ValidateNames(request.Amenities, nameof(request.Amenities), 120);
        ValidateFeaturedDishes(request.FeaturedDishes);
    }

    public static void Validate(RestaurantListQuery query)
    {
        RequestValidation.Validate(query);
        if (query.Latitude.HasValue != query.Longitude.HasValue)
            Fail(nameof(query.Latitude), "Latitude and longitude must be supplied together.");
        if (query.MaxDistanceKm.HasValue && !query.Latitude.HasValue)
            Fail(nameof(query.MaxDistanceKm), "Distance filtering requires latitude and longitude.");
    }

    public static DietaryType GetSelectedDietaryType(RestaurantRequest request)
    {
        var legacyTypes = request.DietaryTypes ?? [];
        if (request.DietaryType is not DietaryType dietaryType)
        {
            if (legacyTypes.Length == 1 && Enum.IsDefined(legacyTypes[0]))
                return legacyTypes[0];

            Fail(nameof(request.DietaryType), "Select exactly one supported dietary type.");
            return default;
        }

        if (!Enum.IsDefined(dietaryType))
        {
            Fail(nameof(request.DietaryType), "Select exactly one supported dietary type.");
            return default;
        }

        if (legacyTypes.Length > 0 && (legacyTypes.Length != 1 || legacyTypes[0] != dietaryType))
        {
            Fail(nameof(request.DietaryType), "Only one dietary type may be selected.");
        }

        return dietaryType;
    }

    private static bool IsHttpUrl(string? value) => string.IsNullOrWhiteSpace(value) ||
        Uri.TryCreate(value, UriKind.Absolute, out var uri) && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);

    private static void ValidateNames(string[]? values, string field, int maxLength)
    {
        if (values is null || values.Any(value => string.IsNullOrWhiteSpace(value) || value.Trim().Length > maxLength) ||
            values.Select(value => value.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).Count() != values.Length)
            Fail(field, "Amenities must be non-empty, unique and within the supported length.");
    }

    private static void ValidateFeaturedDishes(RestaurantFeaturedDishRequest[]? dishes)
    {
        if (dishes is null)
        {
            Fail(nameof(RestaurantRequest.FeaturedDishes), "Enter exactly three featured dishes, each with a name and an uploaded image.");
            return;
        }

        if (dishes.Length != 3 || dishes.Any(dish => dish is null || string.IsNullOrWhiteSpace(dish.Name) ||
                dish.Name.Trim().Length > 120 || string.IsNullOrWhiteSpace(dish.ImageUrl) ||
                dish.ImageUrl.Trim().Length > 2048 || !IsHttpUrl(dish.ImageUrl)))
        {
            Fail(nameof(RestaurantRequest.FeaturedDishes), "Enter exactly three featured dishes, each with a name and an uploaded image.");
            return;
        }

        if (dishes.Select(dish => dish.Name.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).Count() != dishes.Length)
            Fail(nameof(RestaurantRequest.FeaturedDishes), "Featured dish names must be unique.");
    }

    public static void Fail(string member, string message) =>
        throw new ValidationException(new ValidationResult(message, [member]), null, null);
}
