using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public sealed class FavoriteConfiguration : IEntityTypeConfiguration<Favorite>
{
    public void Configure(EntityTypeBuilder<Favorite> builder)
    {
        builder.ToTable("Favorites");
        builder.HasKey(favorite => favorite.Id);
        builder.Property(favorite => favorite.Id).ValueGeneratedNever();
        builder.Property(favorite => favorite.UserId).HasMaxLength(450).IsRequired();
        builder.Property(favorite => favorite.TargetType).HasConversion<string>().HasMaxLength(16);
        builder.HasIndex(favorite => new { favorite.UserId, favorite.TargetType, favorite.TargetId }).IsUnique();
        builder.HasIndex(favorite => new { favorite.UserId, favorite.CreatedAt });
    }
}
