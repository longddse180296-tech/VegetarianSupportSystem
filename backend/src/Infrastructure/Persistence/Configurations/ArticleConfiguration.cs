using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public sealed class ArticleConfiguration : IEntityTypeConfiguration<Article>
{
    public void Configure(EntityTypeBuilder<Article> builder)
    {
        builder.ToTable("Articles");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.OwnerUserId).HasMaxLength(450).IsRequired();
        builder.Property(x => x.DraftTitle).HasMaxLength(200).IsRequired();
        builder.Property(x => x.DraftContent).HasMaxLength(50_000).IsRequired();
        builder.Property(x => x.DraftCategory).HasMaxLength(120).IsRequired();
        builder.Property(x => x.DraftCoverImageUrl).HasMaxLength(2_000);
        builder.Property(x => x.RowVersion).IsRowVersion();
        builder.HasIndex(x => new { x.OwnerUserId, x.UpdatedAt });
        builder.HasIndex(x => x.ModerationContentId).IsUnique().HasFilter("[ModerationContentId] IS NOT NULL");
        builder.HasMany(x => x.Versions).WithOne().HasForeignKey(x => x.ArticleId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class ArticleVersionConfiguration : IEntityTypeConfiguration<ArticleVersion>
{
    public void Configure(EntityTypeBuilder<ArticleVersion> builder)
    {
        builder.ToTable("ArticleVersions");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.Title).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Content).HasMaxLength(50_000).IsRequired();
        builder.Property(x => x.Category).HasMaxLength(120).IsRequired();
        builder.Property(x => x.CoverImageUrl).HasMaxLength(2_000);
        builder.HasIndex(x => new { x.ArticleId, x.Version }).IsUnique();
        builder.HasIndex(x => x.SubmissionId).IsUnique();
        builder.HasOne(x => x.Submission).WithMany().HasForeignKey(x => x.SubmissionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
