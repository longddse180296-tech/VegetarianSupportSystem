using Domain.Enums;

namespace Domain.Entities;

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
    public ICollection<RestaurantRecipe> RelatedRecipes { get; set; } = new List<RestaurantRecipe>();
}

public sealed class RestaurantDietaryType
{
    public Guid RestaurantId { get; set; }
    public Restaurant? Restaurant { get; set; }
    public DietaryType DietaryType { get; set; }
}

public sealed class RestaurantAmenity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RestaurantId { get; set; }
    public Restaurant? Restaurant { get; set; }
    public string Name { get; set; } = string.Empty;
}

public sealed class RestaurantRecipe
{
    public Guid RestaurantId { get; set; }
    public Restaurant? Restaurant { get; set; }
    public Guid RecipeId { get; set; }
    public Recipe? Recipe { get; set; }
}
