using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Api.Authorization;
using Api.Configuration;
using Application.Features.Auth;
using Domain.Entities;
using Infrastructure.Identity;
using Infrastructure.Persistence;
using Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;

namespace CoreDataChecks;

public static class PasswordResetChecks
{
    public static async Task RunAsync(AppDbContext db, Action<bool, string> check)
    {
        var now = DateTimeOffset.UtcNow;
        var hasher = new Pbkdf2PasswordHasher();
        var user = User.Register("Reset test", "reset-test@example.invalid",
            hasher.Hash("old-password"), now);
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var resets = new PasswordResetRepository(db);
        var accounts = new UserAccountRepository(db);
        var validator = new AccountTokenValidator(accounts, new RevokedAccessTokenRepository(db));
        var jwt = new JwtAccessTokenIssuer("reset-tests", "reset-tests", new string('k', 32)).Issue(user);
        var claims = new JwtSecurityTokenHandler().ReadJwtToken(jwt.Value).Claims;
        var oldPrincipal = new ClaimsPrincipal(new ClaimsIdentity(claims, "Bearer", "sub", "role"));
        check(await validator.IsValidAsync(oldPrincipal, default), "old JWT initially valid");

        var tokenHash = new string('A', 64);
        check(await resets.TryIssueAsync(user.Id, tokenHash, now, now.AddMinutes(20), default),
            "reset token stored");
        check(!await resets.TryIssueAsync(user.Id, new string('B', 64), now.AddMinutes(1),
            now.AddMinutes(21), default), "per-account reset cooldown");

        check(await resets.TryResetPasswordAsync(tokenHash, hasher.Hash("new-password"),
            now.AddMinutes(2), default), "reset token changes password");
        check(!await resets.TryResetPasswordAsync(tokenHash, hasher.Hash("other-password"),
            now.AddMinutes(3), default), "reset token cannot be reused");
        check(!await validator.IsValidAsync(oldPrincipal, default), "old JWT invalid after reset");
        var updated = await accounts.FindByIdAsync(user.Id, default);
        check(updated is not null && updated.TokenVersion == 1 &&
              hasher.Verify(updated.PasswordHash, "new-password") &&
              !hasher.Verify(updated.PasswordHash, "old-password"), "new password replaces old hash");

        var expiredHash = new string('C', 64);
        db.PasswordResetTokens.Add(PasswordResetToken.Create(expiredHash, user.Id,
            now.AddMinutes(-30), now.AddMinutes(-10)));
        await db.SaveChangesAsync();
        check(!await resets.TryResetPasswordAsync(expiredHash, hasher.Hash("late-password"), now, default),
            "expired reset token rejected");

        var another = User.Register("Another reset test", "reset-link@example.invalid",
            hasher.Hash("old-password"), now);
        db.Users.Add(another);
        await db.SaveChangesAsync();
        var firstHash = new string('D', 64);
        var secondHash = new string('E', 64);
        check(await resets.TryIssueAsync(another.Id, firstHash, now.AddMinutes(-10),
            now.AddMinutes(10), default), "first reset link issued");
        check(await resets.TryIssueAsync(another.Id, secondHash, now.AddMinutes(-4),
            now.AddMinutes(16), default), "replacement reset link issued after cooldown");
        check(!await resets.TryResetPasswordAsync(firstHash, hasher.Hash("first-link-password"),
            now.AddMinutes(-3), default), "new request invalidates previous link");
        check(await resets.TryResetPasswordAsync(secondHash, hasher.Hash("second-link-password"),
            now.AddMinutes(-3), default), "latest reset link remains usable");

        var limited = User.Register("Limited reset test", "reset-limited@example.invalid",
            hasher.Hash("old-password"), now);
        db.Users.Add(limited);
        await db.SaveChangesAsync();
        for (var i = 0; i < 5; i++)
        {
            var requestedAt = now.AddHours(-20 + i * 4);
            check(await resets.TryIssueAsync(limited.Id, i.ToString("X64"), requestedAt,
                requestedAt.AddMinutes(20), default), "daily reset request within limit");
        }
        check(!await resets.TryIssueAsync(limited.Id, new string('F', 64), now,
            now.AddMinutes(20), default), "sixth reset request rejected within 24 hours");
    }
}
