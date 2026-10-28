// Chức năng: công thức và định lượng nguyên liệu. Tầng Infrastructure thực hiện truy vấn, lưu trữ hoặc giao tiếp dịch vụ ngoài.
using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

// RecipeIngredientConfiguration: ánh xạ entity, kiểu cột và ràng buộc dữ liệu khi làm việc với SQL Server.
public sealed class RecipeIngredientConfiguration : IEntityTypeConfiguration<RecipeIngredient>
{
    // Configure: Ánh xạ entity, ràng buộc và quan hệ cho cơ sở dữ liệu.
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
