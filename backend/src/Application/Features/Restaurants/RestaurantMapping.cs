// Chức năng: tra cứu và quản lý nhà hàng. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using Domain.Entities;

namespace Application.Features.Restaurants;

// RestaurantMapping: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
internal static class RestaurantMapping
{
    // ToSummary: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public static RestaurantSummary ToSummary(Restaurant restaurant, decimal? distanceKm)
    {
        var dietaryTypes = GetDietaryTypes(restaurant);
        return new(
            restaurant.Id,
            restaurant.Name,
            restaurant.Address,
            restaurant.District,
            restaurant.ImageUrl,
            restaurant.PriceFromVnd,
            restaurant.PriceToVnd,
            restaurant.IsActive,
            dietaryTypes,
            dietaryTypes.Count == 1 ? dietaryTypes[0] : null,
            restaurant.Amenities.OrderBy(x => x.Name).Select(x => x.Name).ToArray(),
            distanceKm,
            restaurant.Latitude,
            restaurant.Longitude);
    }

    // ToResponse: Chuyển dữ liệu nội bộ sang cấu trúc trả về cho bên gọi.
    public static RestaurantResponse ToResponse(Restaurant restaurant, decimal? distanceKm)
    {
        var dietaryTypes = GetDietaryTypes(restaurant);
        return new(
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
            dietaryTypes,
            dietaryTypes.Count == 1 ? dietaryTypes[0] : null,
            restaurant.Amenities.OrderBy(x => x.Name).Select(x => x.Name).ToArray(),
            restaurant.FeaturedDishes.OrderBy(x => x.DisplayOrder).ThenBy(x => x.Id)
                .Select(x => new RestaurantFeaturedDishResponse(x.Id, x.Name, x.ImageUrl, x.DisplayOrder)).ToArray(),
            distanceKm);
    }

    // GetDietaryTypes: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    private static IReadOnlyList<Domain.Enums.DietaryType> GetDietaryTypes(Restaurant restaurant) =>
        restaurant.DietaryTypes.OrderBy(x => x.DietaryType).Select(x => x.DietaryType).ToArray();
}
