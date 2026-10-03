using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public sealed class RevokedAccessTokenConfiguration : IEntityTypeConfiguration<RevokedAccessToken>
{
    public void Configure(EntityTypeBuilder<RevokedAccessToken> builder)
    {
        builder.ToTable("RevokedAccessTokens");
        builder.HasKey(x => x.TokenId);
        builder.Property(x => x.TokenId).HasMaxLength(32).ValueGeneratedNever();
        builder.HasIndex(x => x.ExpiresAtUtc);
    }
}
