// Chức năng: hạ tầng và quy tắc dùng chung. Tầng Infrastructure thực hiện truy vấn, lưu trữ hoặc giao tiếp dịch vụ ngoài.
using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

// FeaturedContentConfiguration: ánh xạ entity, kiểu cột và ràng buộc dữ liệu khi làm việc với SQL Server.
public sealed class FeaturedContentConfiguration : IEntityTypeConfiguration<FeaturedContent>
{
    // Configure: Ánh xạ entity, ràng buộc và quan hệ cho cơ sở dữ liệu.
    public void Configure(EntityTypeBuilder<FeaturedContent> builder)
    {
        builder.ToTable("FeaturedContent");
        builder.HasKey(x => new { x.ContentType, x.ContentId });
        builder.Property(x => x.ContentType).HasConversion<string>().HasMaxLength(16);
        builder.Property(x => x.PinnedByUserId).HasMaxLength(450).IsRequired();
        builder.HasIndex(x => new { x.ContentType, x.PinnedAt });
    }
}
