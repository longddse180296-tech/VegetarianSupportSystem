using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public sealed class RecipeConfiguration : IEntityTypeConfiguration<Recipe>
{
    public void Configure(EntityTypeBuilder<Recipe> builder)
    {
        builder.ToTable("Recipes", table =>
        {
            table.HasCheckConstraint("CK_Recipes_CaloriesPerServing", "[CaloriesPerServing] IS NULL OR [CaloriesPerServing] >= 0");
            table.HasCheckConstraint("CK_Recipes_ProteinGramPerServing", "[ProteinGramPerServing] IS NULL OR [ProteinGramPerServing] >= 0");
            table.HasCheckConstraint("CK_Recipes_CarbohydrateGramPerServing", "[CarbohydrateGramPerServing] IS NULL OR [CarbohydrateGramPerServing] >= 0");
            table.HasCheckConstraint("CK_Recipes_FatGramPerServing", "[FatGramPerServing] IS NULL OR [FatGramPerServing] >= 0");
            table.HasCheckConstraint("CK_Recipes_Servings", "[Servings] BETWEEN 1 AND 10000");
            table.HasCheckConstraint("CK_Recipes_Times", "[PrepTimeMinutes] BETWEEN 0 AND 10080 AND [CookTimeMinutes] BETWEEN 0 AND 10080");
        });
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.Name).UseCollation("Latin1_General_100_CI_AS");
        builder.HasIndex(x => x.Name).IsUnique();
        builder.Property(x => x.Name).HasMaxLength(120).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(2000);
        builder.Property(x => x.Instructions).HasMaxLength(20000).IsRequired();
        builder.Property(x => x.ImageUrl).HasMaxLength(2048);
        builder.Property(x => x.CaloriesPerServing).HasPrecision(12, 3);
        builder.Property(x => x.ProteinGramPerServing).HasPrecision(12, 3);
        builder.Property(x => x.CarbohydrateGramPerServing).HasPrecision(12, 3);
        builder.Property(x => x.FatGramPerServing).HasPrecision(12, 3);
        builder.HasOne(x => x.Category).WithMany(x => x.Recipes)
            .HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Restrict);
    }
}
