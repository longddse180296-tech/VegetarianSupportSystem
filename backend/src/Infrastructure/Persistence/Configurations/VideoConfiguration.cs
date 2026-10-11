using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public sealed class VideoConfiguration : IEntityTypeConfiguration<Video>
{
    public void Configure(EntityTypeBuilder<Video> builder)
    {
        builder.ToTable("Videos");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.OwnerUserId).HasMaxLength(450).IsRequired();
        builder.Property(x => x.Title).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(5000).IsRequired();
        builder.Property(x => x.MediaKey).HasMaxLength(200);
        builder.Property(x => x.ThumbnailKey).HasMaxLength(200);
        builder.Property(x => x.PublishedThumbnailKey).HasMaxLength(200);
        builder.Property(x => x.UploadStatus).HasMaxLength(24).IsRequired();
        builder.HasIndex(x => new { x.OwnerUserId, x.CreatedAtUtc });
        builder.HasIndex(x => x.PublishedSubmissionId);
    }
}
