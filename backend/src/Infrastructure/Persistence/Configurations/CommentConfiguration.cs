using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public sealed class CommentConfiguration : IEntityTypeConfiguration<Comment>
{
    public void Configure(EntityTypeBuilder<Comment> builder)
    {
        builder.ToTable("Comments");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.TargetType).HasConversion<string>().HasMaxLength(16);
        builder.Property(x => x.AuthorId).HasMaxLength(450).IsRequired();
        builder.Property(x => x.Body).HasMaxLength(2_000).IsRequired();
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(16);
        builder.Property(x => x.ModerationReason).HasMaxLength(1_000);
        builder.Property(x => x.ModeratedBy).HasMaxLength(450);
        builder.Property(x => x.RowVersion).IsRowVersion();
        builder.HasOne<Comment>().WithMany().HasForeignKey(x => x.ParentId).OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(x => new { x.TargetType, x.TargetId, x.CreatedAt });
        builder.HasIndex(x => new { x.AuthorId, x.CreatedAt });
        builder.HasIndex(x => new { x.Status, x.CreatedAt });
    }
}

public sealed class ContentReactionConfiguration : IEntityTypeConfiguration<ContentReaction>
{
    public void Configure(EntityTypeBuilder<ContentReaction> builder)
    {
        builder.ToTable("ContentReactions");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.UserId).HasMaxLength(450).IsRequired();
        builder.Property(x => x.TargetType).HasConversion<string>().HasMaxLength(24);
        builder.HasIndex(x => new { x.UserId, x.TargetType, x.TargetId }).IsUnique();
        builder.HasIndex(x => new { x.TargetType, x.TargetId });
    }
}
