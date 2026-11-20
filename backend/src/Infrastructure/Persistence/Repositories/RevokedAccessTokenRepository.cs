// Đọc và ghi mã định danh access token đã bị thu hồi bằng EF Core.
using Application.Features.Auth;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

// RevokedAccessTokenRepository: thực hiện truy vấn và lưu dữ liệu của tính năng qua EF Core.
public sealed class RevokedAccessTokenRepository(AppDbContext db) : IRevokedAccessTokenRepository
{
    // IsRevokedAsync: Đánh giá điều kiện nghiệp vụ để quyết định nhánh xử lý.
    public Task<bool> IsRevokedAsync(string tokenId, CancellationToken cancellationToken) =>
        db.RevokedAccessTokens.AnyAsync(x => x.TokenId == tokenId, cancellationToken);

    // RevokeAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public async Task RevokeAsync(string tokenId, DateTimeOffset expiresAtUtc, CancellationToken cancellationToken)
    {
        await db.RevokedAccessTokens
            .Where(x => x.ExpiresAtUtc < DateTimeOffset.UtcNow)
            .ExecuteDeleteAsync(cancellationToken);
        db.RevokedAccessTokens.Add(RevokedAccessToken.Create(tokenId, expiresAtUtc));
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await db.SaveChangesAsync(cancellationToken);
    }
}
