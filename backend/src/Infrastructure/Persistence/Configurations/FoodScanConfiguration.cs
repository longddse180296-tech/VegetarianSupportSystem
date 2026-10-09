using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public sealed class FoodScanConfiguration : IEntityTypeConfiguration<FoodScanRecord>
{
    public void Configure(EntityTypeBuilder<FoodScanRecord> builder)
    {
        builder.ToTable("FoodScanRecords");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.OwnerUserId).HasMaxLength(450).IsRequired();
        builder.Property(x => x.SourceType).HasMaxLength(20).IsRequired();
        builder.Property(x => x.InputJson).IsRequired();
        builder.Property(x => x.ResultJson).IsRequired();
        builder.Property(x => x.ProfileSnapshotJson).IsRequired();
        builder.HasIndex(x => new { x.OwnerUserId, x.CreatedAtUtc });
    }
}
