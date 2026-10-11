using System.Data;
using Application.Features.Auth;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public sealed class PasswordResetRepository(AppDbContext db) : IPasswordResetRepository
{
    public async Task<bool> TryIssueAsync(string userId, string tokenHash, DateTimeOffset now,
        DateTimeOffset expiresAtUtc, CancellationToken cancellationToken)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(
            IsolationLevel.Serializable, cancellationToken);
        var recent = await db.PasswordResetTokens
            .Where(x => x.UserId == userId && x.CreatedAtUtc > now.AddDays(-1))
            .Select(x => x.CreatedAtUtc)
            .ToListAsync(cancellationToken);
        if (recent.Count >= 5 || recent.Any(x => x > now.AddMinutes(-5)))
            return false;

        await db.PasswordResetTokens
            .Where(x => x.UserId == userId && x.ConsumedAtUtc == null)
            .ExecuteUpdateAsync(setters => setters.SetProperty(x => x.ConsumedAtUtc, now), cancellationToken);
        db.PasswordResetTokens.Add(PasswordResetToken.Create(tokenHash, userId, now, expiresAtUtc));
        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return true;
    }

    public Task InvalidateAsync(string tokenHash, DateTimeOffset now, CancellationToken cancellationToken) =>
        db.PasswordResetTokens.Where(x => x.TokenHash == tokenHash && x.ConsumedAtUtc == null)
            .ExecuteUpdateAsync(setters => setters.SetProperty(x => x.ConsumedAtUtc, now), cancellationToken);

    public async Task<bool> TryResetPasswordAsync(string tokenHash, string newPasswordHash,
        DateTimeOffset now, CancellationToken cancellationToken)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(
            IsolationLevel.Serializable, cancellationToken);
        var token = await db.PasswordResetTokens.AsNoTracking()
            .FirstOrDefaultAsync(x => x.TokenHash == tokenHash, cancellationToken);
        if (token is null || token.ConsumedAtUtc is not null || token.ExpiresAtUtc <= now)
            return false;

        var claimed = await db.PasswordResetTokens
            .Where(x => x.TokenHash == tokenHash && x.ConsumedAtUtc == null && x.ExpiresAtUtc > now)
            .ExecuteUpdateAsync(setters => setters.SetProperty(x => x.ConsumedAtUtc, now), cancellationToken);
        if (claimed != 1) return false;

        var changed = await db.Users
            .Where(x => x.Id == token.UserId && !x.IsLocked)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(x => x.PasswordHash, newPasswordHash)
                .SetProperty(x => x.TokenVersion, x => x.TokenVersion + 1)
                .SetProperty(x => x.UpdatedAtUtc, now), cancellationToken);
        if (changed != 1) return false;

        await db.PasswordResetTokens
            .Where(x => x.UserId == token.UserId && x.ConsumedAtUtc == null)
            .ExecuteUpdateAsync(setters => setters.SetProperty(x => x.ConsumedAtUtc, now), cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return true;
    }
}
