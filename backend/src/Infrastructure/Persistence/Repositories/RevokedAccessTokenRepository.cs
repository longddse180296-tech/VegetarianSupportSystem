using Application.Features.Auth;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public sealed class RevokedAccessTokenRepository(AppDbContext db) : IRevokedAccessTokenRepository
{
    public Task<bool> IsRevokedAsync(string tokenId, CancellationToken cancellationToken) =>
        db.RevokedAccessTokens.AnyAsync(x => x.TokenId == tokenId, cancellationToken);

    public async Task RevokeAsync(string tokenId, DateTimeOffset expiresAtUtc, CancellationToken cancellationToken)
    {
        await db.RevokedAccessTokens
            .Where(x => x.ExpiresAtUtc < DateTimeOffset.UtcNow)
            .ExecuteDeleteAsync(cancellationToken);
        db.RevokedAccessTokens.Add(RevokedAccessToken.Create(tokenId, expiresAtUtc));
        await db.SaveChangesAsync(cancellationToken);
    }
}
