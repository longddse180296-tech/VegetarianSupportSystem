// Chức năng: tra cứu và quản lý nhà hàng. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using System.ComponentModel.DataAnnotations;

namespace Application.Features.Restaurants;

// RestaurantFeaturedDishRequest: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class RestaurantFeaturedDishRequest
{
    [Required, StringLength(120)]
    public string Name { get; init; } = string.Empty;

    [Required, StringLength(2048)]
    public string ImageUrl { get; init; } = string.Empty;
}
