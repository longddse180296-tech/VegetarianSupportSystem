// Chức năng: báo cáo nội dung cần xem xét. Tầng Infrastructure thực hiện truy vấn, lưu trữ hoặc giao tiếp dịch vụ ngoài.
using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

// ContentReportConfiguration: ánh xạ entity, kiểu cột và ràng buộc dữ liệu khi làm việc với SQL Server.
public sealed class ContentReportConfiguration : IEntityTypeConfiguration<ContentReport>
{
    // Configure: Ánh xạ entity, ràng buộc và quan hệ cho cơ sở dữ liệu.
    public void Configure(EntityTypeBuilder<ContentReport> builder)
    {
        builder.ToTable("ContentReports");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.TargetType).HasConversion<string>().HasMaxLength(20);
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(x => x.Reason).HasConversion<string>().HasMaxLength(30);
        builder.Property(x => x.ContentTitle).HasMaxLength(200).IsRequired();
        builder.Property(x => x.ReporterId).HasMaxLength(450).IsRequired();
        builder.Property(x => x.Details).HasMaxLength(2000);
        builder.Property(x => x.ResolvedBy).HasMaxLength(450);
        builder.Property(x => x.ResolutionNote).HasMaxLength(2000);
        builder.Property(x => x.RowVersion).IsRowVersion();
        builder.HasIndex(x => new { x.ReporterId, x.TargetType, x.TargetId }).IsUnique()
            .HasFilter("[Status] = N'Pending'");
        builder.HasIndex(x => new { x.Status, x.CreatedAt });
    }
}
