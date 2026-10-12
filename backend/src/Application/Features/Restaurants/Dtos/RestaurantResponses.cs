using Domain.Enums;

namespace Application.Features.Restaurants;

public sealed record RestaurantSummary(
    Guid Id,
    string Name,
    string Address,
    string? District,
    string? ImageUrl,
    int? PriceFromVnd,
    int? PriceToVnd,
    bool IsActive,
    IReadOnlyList<DietaryType> DietaryTypes,
    IReadOnlyList<string> Amenities,
    decimal? DistanceKm);

public sealed record RestaurantRelatedRecipe(Guid Id, string Name, string? ImageUrl);

public sealed record RestaurantResponse(
    Guid Id,
    string Name,
    string? Description,
    string Address,
    string? District,
    decimal? Latitude,
    decimal? Longitude,
    string? ContactPhone,
    string? WebsiteUrl,
    string? OpeningHours,
    int? PriceFromVnd,
    int? PriceToVnd,
    string? ImageUrl,
    string? Source,
    DateTimeOffset DataUpdatedAt,
    bool IsActive,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt,
    IReadOnlyList<DietaryType> DietaryTypes,
    IReadOnlyList<string> Amenities,
    IReadOnlyList<RestaurantRelatedRecipe> RelatedRecipes,
    decimal? DistanceKm);

public sealed record RestaurantPage(
    IReadOnlyList<RestaurantSummary> Items,
    int PageNumber,
    int PageSize,
    int TotalCount);
