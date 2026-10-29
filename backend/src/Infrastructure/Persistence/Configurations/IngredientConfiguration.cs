// Chức năng: danh mục nguyên liệu và dữ liệu dinh dưỡng. Tầng Infrastructure thực hiện truy vấn, lưu trữ hoặc giao tiếp dịch vụ ngoài.
using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

// IngredientConfiguration: ánh xạ entity, kiểu cột và ràng buộc dữ liệu khi làm việc với SQL Server.
public sealed class IngredientConfiguration : IEntityTypeConfiguration<Ingredient>
{
    // Configure: Ánh xạ entity, ràng buộc và quan hệ cho cơ sở dữ liệu.
    public void Configure(EntityTypeBuilder<Ingredient> builder)
    {
        builder.ToTable("Ingredients", table =>
        {
            table.HasCheckConstraint("CK_Ingredients_CaloriesPer100Gram", "[CaloriesPer100Gram] IS NULL OR [CaloriesPer100Gram] >= 0");
            table.HasCheckConstraint("CK_Ingredients_ProteinGramPer100Gram", "[ProteinGramPer100Gram] IS NULL OR [ProteinGramPer100Gram] >= 0");
            table.HasCheckConstraint("CK_Ingredients_CarbohydrateGramPer100Gram", "[CarbohydrateGramPer100Gram] IS NULL OR [CarbohydrateGramPer100Gram] >= 0");
            table.HasCheckConstraint("CK_Ingredients_FatGramPer100Gram", "[FatGramPer100Gram] IS NULL OR [FatGramPer100Gram] >= 0");
            table.HasCheckConstraint("CK_Ingredients_Origin", "[Origin] IN (0, 1, 2)");
            table.HasCheckConstraint("CK_Ingredients_NutritionBasisQuantity", "[NutritionBasisQuantity] > 0");
            table.HasCheckConstraint("CK_Ingredients_NutritionBasisUnit", "[NutritionBasisUnit] IN (N'g', N'kg', N'ml', N'đơn vị')");
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
        // Preserve existing physical columns and values; the explicit basis supplies their meaning.
        builder.Property(x => x.Calories).HasColumnName("CaloriesPer100Gram").HasPrecision(12, 3);
        builder.Property(x => x.ProteinGram).HasColumnName("ProteinGramPer100Gram").HasPrecision(12, 3);
        builder.Property(x => x.CarbohydrateGram).HasColumnName("CarbohydrateGramPer100Gram").HasPrecision(12, 3);
        builder.Property(x => x.FatGram).HasColumnName("FatGramPer100Gram").HasPrecision(12, 3);
        builder.Property(x => x.NutritionBasisUnit).HasMaxLength(40).IsRequired().HasDefaultValue("g");
        builder.Property(x => x.NutritionBasisQuantity).HasPrecision(12, 3).HasDefaultValue(100m);
    }
}
