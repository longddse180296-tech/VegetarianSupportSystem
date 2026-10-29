// Chức năng: danh sách nội dung yêu thích. Tầng Infrastructure thực hiện truy vấn, lưu trữ hoặc giao tiếp dịch vụ ngoài.
using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

// FavoriteConfiguration: ánh xạ entity, kiểu cột và ràng buộc dữ liệu khi làm việc với SQL Server.
public sealed class FavoriteConfiguration : IEntityTypeConfiguration<Favorite>
{
    // Configure: Ánh xạ entity, ràng buộc và quan hệ cho cơ sở dữ liệu.
    public void Configure(EntityTypeBuilder<Favorite> builder)
    {
        builder.ToTable("Favorites", table => table.HasCheckConstraint("CK_Favorites_SavedFrom",
            "[SavedFrom] IS NULL OR ([TargetType] = 'Recipe' AND [SavedFrom] IN ('Recipe', 'Pantry'))"));
        builder.HasKey(favorite => favorite.Id);
        builder.Property(favorite => favorite.Id).ValueGeneratedNever();
        builder.Property(favorite => favorite.UserId).HasMaxLength(450).IsRequired();
        builder.Property(favorite => favorite.TargetType).HasConversion<string>().HasMaxLength(16);
        builder.Property(favorite => favorite.SavedFrom).HasConversion<string>().HasMaxLength(16);
        builder.HasIndex(favorite => new { favorite.UserId, favorite.TargetType, favorite.TargetId }).IsUnique();
        builder.HasIndex(favorite => new { favorite.UserId, favorite.CreatedAt });
    }
}
