using System.ComponentModel.DataAnnotations;
using Domain.Entities;

namespace Application.Features.Auth;

public sealed class AuthService(
    IUserAccountRepository accounts,
    IAccountPasswordHasher passwordHasher,
    IAccessTokenIssuer tokenIssuer,
    IRevokedAccessTokenRepository revokedTokens)
{
    public async Task<AuthResult> RegisterAsync(
        string? fullName, string? email, string? password, string? confirmPassword,
        CancellationToken cancellationToken)
    {
        var name = fullName?.Trim();
        var address = email?.Trim();
        if (string.IsNullOrWhiteSpace(name) || name.Length > 150)
            throw new ArgumentException("Họ tên phải dài từ 1 đến 150 ký tự.", nameof(fullName));
        if (string.IsNullOrWhiteSpace(address) || address.Length > 254 ||
            !new EmailAddressAttribute().IsValid(address))
            throw new ArgumentException("Email không hợp lệ.", nameof(email));
        if (password is null || password.Length is < 6 or > 128 ||
            password.Any(char.IsWhiteSpace))
            throw new ArgumentException("Mật khẩu phải dài 6–128 ký tự và không chứa khoảng trắng.", nameof(password));
        if (password != confirmPassword)
            throw new ArgumentException("Xác nhận mật khẩu không khớp.", nameof(confirmPassword));

        var normalizedEmail = address.ToUpperInvariant();
        if (await accounts.FindByEmailAsync(normalizedEmail, cancellationToken) is not null)
            throw new DuplicateEmailException();

        var user = User.Register(name, address, passwordHasher.Hash(password), DateTimeOffset.UtcNow);
        await accounts.AddAsync(user, cancellationToken);
        return Result(user);
    }

    public async Task<AuthResult?> LoginAsync(string? email, string? password, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrEmpty(password)) return null;
        var user = await accounts.FindByEmailAsync(email.Trim().ToUpperInvariant(), cancellationToken);
        if (user is null || user.IsLocked || !passwordHasher.Verify(user.PasswordHash, password))
            return null;
        return Result(user);
    }

    public async Task<AuthenticatedUser?> GetCurrentUserAsync(string userId, CancellationToken cancellationToken)
    {
        var user = await accounts.FindByIdAsync(userId, cancellationToken);
        return user is null || user.IsLocked ? null : ToAuthenticatedUser(user);
    }

    public Task LogoutAsync(string tokenId, DateTimeOffset expiresAtUtc, CancellationToken cancellationToken) =>
        revokedTokens.RevokeAsync(tokenId, expiresAtUtc, cancellationToken);

    private AuthResult Result(User user) => new(
        ToAuthenticatedUser(user),
        tokenIssuer.Issue(user));

    private static AuthenticatedUser ToAuthenticatedUser(User user) =>
        new(user.Id, user.FullName, user.Email, user.Role.ToString(), user.IsLocked);
}
