// Chức năng: tra cứu và quản lý nhà hàng. Tầng Domain mô tả dữ liệu hoặc quy tắc nghiệp vụ, không phụ thuộc HTTP hay cơ sở dữ liệu.
using Domain.Enums;

namespace Domain.Entities;

// Restaurant: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class Restaurant
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Address { get; set; } = string.Empty;
    public string? District { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string? ContactPhone { get; set; }
    public string? WebsiteUrl { get; set; }
    public string? OpeningHours { get; set; }
    public int? PriceFromVnd { get; set; }
    public int? PriceToVnd { get; set; }
    public string? ImageUrl { get; set; }
    public string? Source { get; set; }
    public DateTimeOffset DataUpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAt { get; set; }

    public ICollection<RestaurantDietaryType> DietaryTypes { get; set; } = new List<RestaurantDietaryType>();
    public ICollection<RestaurantAmenity> Amenities { get; set; } = new List<RestaurantAmenity>();
    public ICollection<RestaurantFeaturedDish> FeaturedDishes { get; set; } = new List<RestaurantFeaturedDish>();
}

// RestaurantDietaryType: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class RestaurantDietaryType
{
    public Guid RestaurantId { get; set; }
    public Restaurant? Restaurant { get; set; }
    public DietaryType DietaryType { get; set; }
}

// RestaurantAmenity: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class RestaurantAmenity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RestaurantId { get; set; }
    public Restaurant? Restaurant { get; set; }
    public string Name { get; set; } = string.Empty;
}

// RestaurantFeaturedDish: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class RestaurantFeaturedDish
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RestaurantId { get; set; }
    public Restaurant? Restaurant { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
}
