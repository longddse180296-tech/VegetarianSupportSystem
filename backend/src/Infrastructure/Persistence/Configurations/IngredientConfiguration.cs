using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public sealed class IngredientConfiguration : IEntityTypeConfiguration<Ingredient>
{
    public void Configure(EntityTypeBuilder<Ingredient> builder)
    {
        builder.ToTable("Ingredients", table =>
        {
            table.HasCheckConstraint("CK_Ingredients_CaloriesPer100Gram", "[CaloriesPer100Gram] IS NULL OR [CaloriesPer100Gram] >= 0");
            table.HasCheckConstraint("CK_Ingredients_ProteinGramPer100Gram", "[ProteinGramPer100Gram] IS NULL OR [ProteinGramPer100Gram] >= 0");
            table.HasCheckConstraint("CK_Ingredients_CarbohydrateGramPer100Gram", "[CarbohydrateGramPer100Gram] IS NULL OR [CarbohydrateGramPer100Gram] >= 0");
            table.HasCheckConstraint("CK_Ingredients_FatGramPer100Gram", "[FatGramPer100Gram] IS NULL OR [FatGramPer100Gram] >= 0");
            table.HasCheckConstraint("CK_Ingredients_Origin", "[Origin] IN (0, 1, 2)");
        });
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.Name).UseCollation("Latin1_General_100_CI_AS");
        builder.HasIndex(x => x.Name).IsUnique();
        builder.Property(x => x.Name).HasMaxLength(120).IsRequired();
        builder.Property(x => x.Aliases).HasMaxLength(1000);
        builder.Property(x => x.Allergens).HasMaxLength(1000);
        builder.Property(x => x.DefaultUnit).HasMaxLength(40);
        builder.Property(x => x.Source).HasMaxLength(1000);
        builder.Property(x => x.CaloriesPer100Gram).HasPrecision(12, 3);
        builder.Property(x => x.ProteinGramPer100Gram).HasPrecision(12, 3);
        builder.Property(x => x.CarbohydrateGramPer100Gram).HasPrecision(12, 3);
        builder.Property(x => x.FatGramPer100Gram).HasPrecision(12, 3);
    }
}
