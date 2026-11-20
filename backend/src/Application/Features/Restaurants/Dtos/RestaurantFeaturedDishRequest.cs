// BE2-05 | Dữ liệu đầu vào từ API (nhà hàng: danh mục public và quản trị, vị trí và chế độ ăn).
// Nhận dữ liệu từ frontend để thực hiện thao tác với tên và ảnh của món nổi bật tại nhà hàng.
using System.ComponentModel.DataAnnotations;

namespace Application.Features.Restaurants;

// RestaurantFeaturedDishRequest: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class RestaurantFeaturedDishRequest
{
    [Required, StringLength(120)]
    public string Name { get; init; } = string.Empty;

    [StringLength(1000)]
    public string? Description { get; init; }

    [Required, StringLength(2048)]
    public string ImageUrl { get; init; } = string.Empty;
}
