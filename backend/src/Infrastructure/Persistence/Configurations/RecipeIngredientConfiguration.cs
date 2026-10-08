using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public sealed class RecipeIngredientConfiguration : IEntityTypeConfiguration<RecipeIngredient>
{
    public void Configure(EntityTypeBuilder<RecipeIngredient> builder)
    {
        builder.ToTable("RecipeIngredients", table =>
            table.HasCheckConstraint("CK_RecipeIngredients_Quantity", "[Quantity] > 0"));
        builder.HasKey(x => new { x.RecipeId, x.IngredientId });
        builder.Property(x => x.Quantity).HasPrecision(12, 3);
        builder.Property(x => x.Unit).HasMaxLength(40).IsRequired();
        builder.Property(x => x.Note).HasMaxLength(500);
        builder.HasOne(x => x.Recipe).WithMany(x => x.RecipeIngredients)
            .HasForeignKey(x => x.RecipeId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Ingredient).WithMany(x => x.RecipeIngredients)
            .HasForeignKey(x => x.IngredientId).OnDelete(DeleteBehavior.Restrict);
    }
}
