using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public sealed class MemberStatusChangeConfiguration : IEntityTypeConfiguration<MemberStatusChange>
{
    public void Configure(EntityTypeBuilder<MemberStatusChange> builder)
    {
        builder.ToTable("MemberStatusChanges");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.UserId).HasMaxLength(450).IsRequired();
        builder.Property(x => x.AdminId).HasMaxLength(450).IsRequired();
        builder.Property(x => x.Reason).HasMaxLength(1_000).IsRequired();
        builder.HasIndex(x => new { x.UserId, x.OccurredAtUtc });
        builder.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<User>().WithMany().HasForeignKey(x => x.AdminId).OnDelete(DeleteBehavior.Restrict);
    }
}
