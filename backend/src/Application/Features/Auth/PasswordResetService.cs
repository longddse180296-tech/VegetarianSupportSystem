// Chức năng: đăng ký, đăng nhập và khôi phục mật khẩu. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using System.ComponentModel.DataAnnotations;
using System.Security.Cryptography;
using System.Text;

namespace Application.Features.Auth;

// PasswordResetService: điều phối các bước nghiệp vụ và xử lý kết quả cho bên gọi.
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

    // RequestAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public async Task RequestAsync(string? email, CancellationToken cancellationToken)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
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

    // ResetAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public async Task<bool> ResetAsync(string? token, string? newPassword,
        string? confirmPassword, CancellationToken cancellationToken)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
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

    // HashToken: băm mã khôi phục trước khi đối chiếu với dữ liệu lưu; không lưu token gốc.
    private static string HashToken(string token) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));

    // IsValidResetPageUrl: Đánh giá điều kiện nghiệp vụ để quyết định nhánh xử lý.
    private static bool IsValidResetPageUrl(string? url) =>
        Uri.TryCreate(url, UriKind.Absolute, out var uri) &&
        (uri.Scheme == Uri.UriSchemeHttps ||
         (uri.Scheme == Uri.UriSchemeHttp && uri.IsLoopback)) &&
        !url!.Contains('?');
}
