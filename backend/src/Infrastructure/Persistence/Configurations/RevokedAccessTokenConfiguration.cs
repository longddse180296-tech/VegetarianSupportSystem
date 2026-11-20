// Ánh xạ mã định danh access token đã bị thu hồi sang bảng SQL cùng các ràng buộc dữ liệu.
using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

// RevokedAccessTokenConfiguration: ánh xạ entity, kiểu cột và ràng buộc dữ liệu khi làm việc với SQL Server.
public sealed class RevokedAccessTokenConfiguration : IEntityTypeConfiguration<RevokedAccessToken>
{
    // Configure: Ánh xạ entity, ràng buộc và quan hệ cho cơ sở dữ liệu.
    public void Configure(EntityTypeBuilder<RevokedAccessToken> builder)
    {
        builder.ToTable("RevokedAccessTokens");
        builder.HasKey(x => x.TokenId);
        builder.Property(x => x.TokenId).HasMaxLength(32).ValueGeneratedNever();
        builder.HasIndex(x => x.ExpiresAtUtc);
    }
}
