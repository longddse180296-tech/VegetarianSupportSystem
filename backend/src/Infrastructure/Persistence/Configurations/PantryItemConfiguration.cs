using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public sealed class PantryItemConfiguration : IEntityTypeConfiguration<PantryItem>
{
    public void Configure(EntityTypeBuilder<PantryItem> builder)
    {
        builder.ToTable("PantryItems", table =>
            table.HasCheckConstraint("CK_PantryItems_Identity", "([IngredientId] IS NOT NULL AND [CustomName] IS NULL) OR ([IngredientId] IS NULL AND [CustomName] IS NOT NULL)"));
        builder.HasKey(item => item.Id);
        builder.Property(item => item.Id).ValueGeneratedNever();
        builder.Property(item => item.UserId).HasMaxLength(450).IsRequired();
        builder.Property(item => item.CustomName).HasMaxLength(120).UseCollation("Latin1_General_100_CI_AS");
        builder.Property(item => item.Quantity).HasPrecision(12, 3);
        builder.Property(item => item.Unit).HasMaxLength(40);
        builder.HasIndex(item => new { item.UserId, item.IngredientId }).IsUnique().HasFilter("[IngredientId] IS NOT NULL");
        builder.HasIndex(item => new { item.UserId, item.CustomName }).IsUnique().HasFilter("[IngredientId] IS NULL");
        builder.HasOne(item => item.Ingredient).WithMany().HasForeignKey(item => item.IngredientId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
