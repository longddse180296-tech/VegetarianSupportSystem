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

public sealed record AccessToken(string Value, DateTimeOffset ExpiresAtUtc);
public sealed record AuthenticatedUser(string Id, string FullName, string Email, string Role);
public sealed record AuthResult(AuthenticatedUser User, AccessToken Token);

public sealed class DuplicateEmailException : Exception;
