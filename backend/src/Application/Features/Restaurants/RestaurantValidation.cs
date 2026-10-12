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
        var dietaryTypes = request.DietaryTypes ?? [];
        if (dietaryTypes.Length == 0 || dietaryTypes.Any(type => !Enum.IsDefined(type)))
            Fail(nameof(request.DietaryTypes), "Select at least one supported dietary type.");
        if (dietaryTypes.Distinct().Count() != dietaryTypes.Length)
            Fail(nameof(request.DietaryTypes), "Dietary types must not be duplicated.");
        ValidateNames(request.Amenities, nameof(request.Amenities), 120);
        if (request.RelatedRecipeIds is null || request.RelatedRecipeIds.Any(id => id == Guid.Empty) || request.RelatedRecipeIds.Distinct().Count() != request.RelatedRecipeIds.Length)
            Fail(nameof(request.RelatedRecipeIds), "Related recipe IDs must be non-empty and unique.");
    }

    public static void Validate(RestaurantListQuery query)
    {
        RequestValidation.Validate(query);
        if (query.Latitude.HasValue != query.Longitude.HasValue)
            Fail(nameof(query.Latitude), "Latitude and longitude must be supplied together.");
        if (query.MaxDistanceKm.HasValue && !query.Latitude.HasValue)
            Fail(nameof(query.MaxDistanceKm), "Distance filtering requires latitude and longitude.");
    }

    private static bool IsHttpUrl(string? value) => string.IsNullOrWhiteSpace(value) ||
        Uri.TryCreate(value, UriKind.Absolute, out var uri) && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);

    private static void ValidateNames(string[]? values, string field, int maxLength)
    {
        if (values is null || values.Any(value => string.IsNullOrWhiteSpace(value) || value.Trim().Length > maxLength) ||
            values.Select(value => value.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).Count() != values.Length)
            Fail(field, "Amenities must be non-empty, unique and within the supported length.");
    }

    public static void Fail(string member, string message) =>
        throw new ValidationException(new ValidationResult(message, [member]), null, null);
}
