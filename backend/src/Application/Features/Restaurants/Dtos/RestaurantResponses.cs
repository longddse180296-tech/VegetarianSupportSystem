// Chức năng: tra cứu và quản lý nhà hàng. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using Domain.Enums;

namespace Application.Features.Restaurants;

// RestaurantSummary: định nghĩa dữ liệu trao đổi của tính năng.
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
    DietaryType? DietaryType,
    IReadOnlyList<string> Amenities,
    decimal? DistanceKm,
    decimal? Latitude = null,
    decimal? Longitude = null);

// RestaurantFeaturedDishResponse: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record RestaurantFeaturedDishResponse(Guid Id, string Name, string ImageUrl, int DisplayOrder);

// RestaurantResponse: định nghĩa dữ liệu trao đổi của tính năng.
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
    DietaryType? DietaryType,
    IReadOnlyList<string> Amenities,
    IReadOnlyList<RestaurantFeaturedDishResponse> FeaturedDishes,
    decimal? DistanceKm);

// RestaurantPage: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record RestaurantPage(
    IReadOnlyList<RestaurantSummary> Items,
    int PageNumber,
    int PageSize,
    int TotalCount);
