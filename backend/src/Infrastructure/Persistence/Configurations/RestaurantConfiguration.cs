using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public sealed class RestaurantConfiguration : IEntityTypeConfiguration<Restaurant>
{
    public void Configure(EntityTypeBuilder<Restaurant> builder)
    {
        builder.ToTable("Restaurants", table =>
        {
            table.HasCheckConstraint("CK_Restaurants_Coordinates", "([Latitude] IS NULL AND [Longitude] IS NULL) OR ([Latitude] IS NOT NULL AND [Longitude] IS NOT NULL AND [Latitude] BETWEEN -90 AND 90 AND [Longitude] BETWEEN -180 AND 180)");
            table.HasCheckConstraint("CK_Restaurants_Prices", "([PriceFromVnd] IS NULL OR [PriceFromVnd] >= 0) AND ([PriceToVnd] IS NULL OR [PriceToVnd] >= 0) AND ([PriceFromVnd] IS NULL OR [PriceToVnd] IS NULL OR [PriceToVnd] >= [PriceFromVnd])");
        });
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.Name).UseCollation("Latin1_General_100_CI_AS").HasMaxLength(120).IsRequired();
        builder.HasIndex(x => x.Name).IsUnique();
        builder.Property(x => x.Description).HasMaxLength(2000);
        builder.Property(x => x.Address).HasMaxLength(300).IsRequired();
        builder.Property(x => x.District).HasMaxLength(120);
        builder.Property(x => x.Latitude).HasPrecision(9, 6);
        builder.Property(x => x.Longitude).HasPrecision(9, 6);
        builder.Property(x => x.ContactPhone).HasMaxLength(40);
        builder.Property(x => x.WebsiteUrl).HasMaxLength(2048);
        builder.Property(x => x.OpeningHours).HasMaxLength(1000);
        builder.Property(x => x.ImageUrl).HasMaxLength(2048);
        builder.Property(x => x.Source).HasMaxLength(500);
    }
}

public sealed class RestaurantDietaryTypeConfiguration : IEntityTypeConfiguration<RestaurantDietaryType>
{
    public void Configure(EntityTypeBuilder<RestaurantDietaryType> builder)
    {
        builder.ToTable("RestaurantDietaryTypes");
        builder.HasKey(x => new { x.RestaurantId, x.DietaryType });
        builder.HasOne(x => x.Restaurant).WithMany(x => x.DietaryTypes)
            .HasForeignKey(x => x.RestaurantId).OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class RestaurantAmenityConfiguration : IEntityTypeConfiguration<RestaurantAmenity>
{
    public void Configure(EntityTypeBuilder<RestaurantAmenity> builder)
    {
        builder.ToTable("RestaurantAmenities");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.Name).UseCollation("Latin1_General_100_CI_AS").HasMaxLength(120).IsRequired();
        builder.HasIndex(x => new { x.RestaurantId, x.Name }).IsUnique();
        builder.HasOne(x => x.Restaurant).WithMany(x => x.Amenities)
            .HasForeignKey(x => x.RestaurantId).OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class RestaurantRecipeConfiguration : IEntityTypeConfiguration<RestaurantRecipe>
{
    public void Configure(EntityTypeBuilder<RestaurantRecipe> builder)
    {
        builder.ToTable("RestaurantRecipes");
        builder.HasKey(x => new { x.RestaurantId, x.RecipeId });
        builder.HasOne(x => x.Restaurant).WithMany(x => x.RelatedRecipes)
            .HasForeignKey(x => x.RestaurantId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Recipe).WithMany()
            .HasForeignKey(x => x.RecipeId).OnDelete(DeleteBehavior.Restrict);
    }
}
