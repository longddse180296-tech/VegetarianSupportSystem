using System.ComponentModel.DataAnnotations;
using System.Security.Cryptography;
using System.Text;

namespace Application.Features.Auth;

public sealed class PasswordResetService(
    IUserAccountRepository accounts,
    IPasswordResetRepository resets,
    IPasswordResetEmailSender emailSender,
    IAccountPasswordHasher passwordHasher,
    PasswordResetOptions options,
    TimeProvider clock,
    IPasswordResetFailureReporter failureReporter)
{
    public bool IsAvailable => emailSender.IsConfigured && IsValidResetPageUrl(options.ResetPageUrl);

    public async Task RequestAsync(string? email, CancellationToken cancellationToken)
    {
        if (!IsAvailable)
            throw new InvalidOperationException("Password reset email is not configured.");
        if (string.IsNullOrWhiteSpace(email) || email.Trim().Length > 254 ||
            !new EmailAddressAttribute().IsValid(email.Trim()))
            return;

        var user = await accounts.FindByEmailAsync(email.Trim().ToUpperInvariant(), cancellationToken);
        if (user is null || user.IsLocked) return;

        var now = clock.GetUtcNow();
        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        var hash = HashToken(token);
        if (!await resets.TryIssueAsync(user.Id, hash, now,
                now.Add(PasswordResetOptions.TokenLifetime), cancellationToken))
            return;

        var resetUrl = $"{options.ResetPageUrl}?token={Uri.EscapeDataString(token)}";
        try
        {
            await emailSender.SendAsync(user.Email, resetUrl, cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            await resets.InvalidateAsync(hash, clock.GetUtcNow(), cancellationToken);
            failureReporter.EmailDeliveryFailed(ex.GetType().Name);
        }
    }

    public async Task<bool> ResetAsync(string? token, string? newPassword,
        string? confirmPassword, CancellationToken cancellationToken)
    {
        if (newPassword is null || newPassword.Length is < 6 or > 128 ||
            newPassword.Any(char.IsWhiteSpace))
            throw new ArgumentException("Mật khẩu phải dài 6–128 ký tự và không chứa khoảng trắng.", nameof(newPassword));
        if (newPassword != confirmPassword)
            throw new ArgumentException("Xác nhận mật khẩu không khớp.", nameof(confirmPassword));

        if (token?.Length != 64 || !token.All(Uri.IsHexDigit)) return false;
        var hash = HashToken(token);
        return await resets.TryResetPasswordAsync(hash, passwordHasher.Hash(newPassword),
            clock.GetUtcNow(), cancellationToken);
    }

    private static string HashToken(string token) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));

    private static bool IsValidResetPageUrl(string? url) =>
        Uri.TryCreate(url, UriKind.Absolute, out var uri) &&
        (uri.Scheme == Uri.UriSchemeHttps ||
         (uri.Scheme == Uri.UriSchemeHttp && uri.IsLoopback)) &&
        !url!.Contains('?');
}
