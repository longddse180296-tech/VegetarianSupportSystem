using Domain.Entities;

namespace Application.Features.Auth;

public interface IUserAccountRepository
{
    Task<User?> FindByEmailAsync(string normalizedEmail, CancellationToken cancellationToken);
    Task<User?> FindByIdAsync(string id, CancellationToken cancellationToken);
    Task<bool> HasAdminAsync(CancellationToken cancellationToken);
    Task AddAsync(User user, CancellationToken cancellationToken);
}

public interface IAccountPasswordHasher
{
    string Hash(string password);
    bool Verify(string hash, string password);
}

public interface IAccessTokenIssuer
{
    AccessToken Issue(User user);
}

public interface IRevokedAccessTokenRepository
{
    Task<bool> IsRevokedAsync(string tokenId, CancellationToken cancellationToken);
    Task RevokeAsync(string tokenId, DateTimeOffset expiresAtUtc, CancellationToken cancellationToken);
}

public interface IPasswordResetRepository
{
    Task<bool> TryIssueAsync(string userId, string tokenHash, DateTimeOffset now,
        DateTimeOffset expiresAtUtc, CancellationToken cancellationToken);
    Task InvalidateAsync(string tokenHash, DateTimeOffset now, CancellationToken cancellationToken);
    Task<bool> TryResetPasswordAsync(string tokenHash, string newPasswordHash,
        DateTimeOffset now, CancellationToken cancellationToken);
}

public interface IPasswordResetEmailSender
{
    bool IsConfigured { get; }
    Task SendAsync(string email, string resetUrl, CancellationToken cancellationToken);
}

public interface IPasswordResetFailureReporter
{
    void EmailDeliveryFailed(string errorType);
}

public sealed record PasswordResetOptions(string? ResetPageUrl)
{
    public static readonly TimeSpan TokenLifetime = TimeSpan.FromMinutes(20);
}

public sealed record AccessToken(string Value, DateTimeOffset ExpiresAtUtc);
public sealed record AuthenticatedUser(string Id, string FullName, string Email, string Role, bool IsLocked);
public sealed record AuthResult(AuthenticatedUser User, AccessToken Token);

public sealed class DuplicateEmailException : Exception;
