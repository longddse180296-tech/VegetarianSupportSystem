// Chức năng: đăng ký, đăng nhập và khôi phục mật khẩu. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using System.ComponentModel.DataAnnotations;
using Domain.Entities;

namespace Application.Features.Auth;

// AuthService: điều phối các bước nghiệp vụ và xử lý kết quả cho bên gọi.
public sealed class AuthService(
    IUserAccountRepository accounts,
    IAccountPasswordHasher passwordHasher,
    IRevokedAccessTokenRepository revokedTokens,
    AccountSessionService sessions)
{
    // RegisterAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public async Task<AuthResult> RegisterAsync(
        string? fullName, string? email, string? password, string? confirmPassword,
        CancellationToken cancellationToken)
    {
        var name = fullName?.Trim();
        var address = email?.Trim();
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
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
        return await sessions.StartAsync(user, cancellationToken)
            ?? throw new InvalidOperationException("Không thể tạo phiên đăng nhập. Vui lòng đăng nhập lại.");
    }

    // LoginAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public async Task<AuthResult?> LoginAsync(string? email, string? password, CancellationToken cancellationToken)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrEmpty(password)) return null;
        var user = await accounts.FindByEmailAsync(email.Trim().ToUpperInvariant(), cancellationToken);
        if (user is null || user.IsLocked || !passwordHasher.Verify(user.PasswordHash, password))
            return null;
        return await sessions.StartAsync(user, cancellationToken);
    }

    // GetCurrentUserAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<AuthenticatedUser?> GetCurrentUserAsync(string userId, CancellationToken cancellationToken)
    {
        var user = await accounts.FindByIdAsync(userId, cancellationToken);
        return user is null || user.IsLocked ? null : ToAuthenticatedUser(user);
    }

    // LogoutAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public Task LogoutAsync(string tokenId, DateTimeOffset expiresAtUtc, CancellationToken cancellationToken) =>
        revokedTokens.RevokeAsync(tokenId, expiresAtUtc, cancellationToken);

    // Result: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    // ToAuthenticatedUser: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    internal static AuthenticatedUser ToAuthenticatedUser(User user) =>
        new(user.Id, user.FullName, user.Email, user.Role.ToString(), user.IsLocked);
}
