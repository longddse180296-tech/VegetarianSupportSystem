using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public sealed class FeaturedContentConfiguration : IEntityTypeConfiguration<FeaturedContent>
{
    public void Configure(EntityTypeBuilder<FeaturedContent> builder)
    {
        builder.ToTable("FeaturedContent");
        builder.HasKey(x => new { x.ContentType, x.ContentId });
        builder.Property(x => x.ContentType).HasConversion<string>().HasMaxLength(16);
        builder.Property(x => x.PinnedByUserId).HasMaxLength(450).IsRequired();
        builder.HasIndex(x => new { x.ContentType, x.PinnedAt });
    }
}
