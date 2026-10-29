// Chức năng: kiểm duyệt nội dung và kết quả kiểm tra AI. Tầng Infrastructure thực hiện truy vấn, lưu trữ hoặc giao tiếp dịch vụ ngoài.
using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

// ModerationSubmissionConfiguration: ánh xạ entity, kiểu cột và ràng buộc dữ liệu khi làm việc với SQL Server.
public sealed class ModerationSubmissionConfiguration : IEntityTypeConfiguration<ModerationSubmission>
{
    // Configure: Ánh xạ entity, ràng buộc và quan hệ cho cơ sở dữ liệu.
    public void Configure(EntityTypeBuilder<ModerationSubmission> builder)
    {
        builder.ToTable("ModerationSubmissions");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.OwnerUserId).HasMaxLength(450).IsRequired();
        builder.Property(x => x.Title).HasMaxLength(200).IsRequired();
        builder.Property(x => x.TextContent).HasMaxLength(50_000).IsRequired();
        builder.Property(x => x.MediaReference).HasMaxLength(2_000);
        builder.Property(x => x.ContentType).HasConversion<string>().HasMaxLength(16);
        builder.Property(x => x.AiFlagStatus).HasConversion<string>().HasMaxLength(16);
        builder.Property(x => x.AdminReviewStatus).HasConversion<string>().HasMaxLength(24);
        builder.Property(x => x.AiSummary).HasMaxLength(2_000);
        builder.Property(x => x.SystemRejectionReason).HasMaxLength(2_000);
        builder.Property(x => x.AiFlagReason).HasMaxLength(2_000);
        builder.Property(x => x.AiFlagType).HasMaxLength(100);
        builder.Property(x => x.AiPriority).HasMaxLength(20);
        builder.Property(x => x.AiEvidence).HasMaxLength(2_000);
        builder.Property(x => x.AiCheckedScope).HasMaxLength(2_000);
        builder.Property(x => x.AiUncheckedScope).HasMaxLength(2_000);
        builder.Property(x => x.RowVersion).IsRowVersion();

        builder.HasIndex(x => new { x.ContentId, x.Version }).IsUnique();
        builder.HasIndex(x => x.ContentId)
            .IsUnique()
            .HasFilter("[IsCurrentPublished] = 1");
        builder.HasIndex(x => new { x.AdminReviewStatus, x.SubmittedAt });
        builder.HasIndex(x => new { x.OwnerUserId, x.SubmittedAt });

        builder.HasMany(x => x.Decisions)
            .WithOne()
            .HasForeignKey(x => x.SubmissionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

// ModerationDecisionConfiguration: ánh xạ entity, kiểu cột và ràng buộc dữ liệu khi làm việc với SQL Server.
public sealed class ModerationDecisionConfiguration : IEntityTypeConfiguration<ModerationDecision>
{
    // Configure: Ánh xạ entity, ràng buộc và quan hệ cho cơ sở dữ liệu.
    public void Configure(EntityTypeBuilder<ModerationDecision> builder)
    {
        builder.ToTable("ModerationDecisions");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.AdminUserId).HasMaxLength(450).IsRequired();
        builder.Property(x => x.Reason).HasMaxLength(2_000).IsRequired();
        builder.Property(x => x.Decision).HasConversion<string>().HasMaxLength(24);
        builder.HasIndex(x => new { x.SubmissionId, x.DecidedAt });
    }
}
