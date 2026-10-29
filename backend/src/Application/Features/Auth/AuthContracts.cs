// Chức năng: đăng ký, đăng nhập và khôi phục mật khẩu. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using Domain.Entities;

namespace Application.Features.Auth;

// IUserAccountRepository: định nghĩa hợp đồng xử lý giữa các tầng.
public interface IUserAccountRepository
{
    // FindByEmailAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<User?> FindByEmailAsync(string normalizedEmail, CancellationToken cancellationToken);
    // FindByIdAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<User?> FindByIdAsync(string id, CancellationToken cancellationToken);
    // HasAdminAsync: Đánh giá điều kiện nghiệp vụ để quyết định nhánh xử lý.
    Task<bool> HasAdminAsync(CancellationToken cancellationToken);
    // AddAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    Task AddAsync(User user, CancellationToken cancellationToken);
}

// IAccountPasswordHasher: định nghĩa hợp đồng xử lý giữa các tầng.
public interface IAccountPasswordHasher
{
    // Hash: Đánh giá điều kiện nghiệp vụ để quyết định nhánh xử lý.
    string Hash(string password);
    // Verify: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    bool Verify(string hash, string password);
}

// IAccessTokenIssuer: định nghĩa hợp đồng xử lý giữa các tầng.
public interface IAccessTokenIssuer
{
    // Issue: Đánh giá điều kiện nghiệp vụ để quyết định nhánh xử lý.
    AccessToken Issue(User user);
}

// IRevokedAccessTokenRepository: định nghĩa hợp đồng xử lý giữa các tầng.
public interface IRevokedAccessTokenRepository
{
    // IsRevokedAsync: Đánh giá điều kiện nghiệp vụ để quyết định nhánh xử lý.
    Task<bool> IsRevokedAsync(string tokenId, CancellationToken cancellationToken);
    // RevokeAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    Task RevokeAsync(string tokenId, DateTimeOffset expiresAtUtc, CancellationToken cancellationToken);
}

// IPasswordResetRepository: định nghĩa hợp đồng xử lý giữa các tầng.
public interface IPasswordResetRepository
{
    // TryIssueAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    Task<bool> TryIssueAsync(string userId, string tokenHash, DateTimeOffset now,
        DateTimeOffset expiresAtUtc, CancellationToken cancellationToken);
    // InvalidateAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    Task InvalidateAsync(string tokenHash, DateTimeOffset now, CancellationToken cancellationToken);
    // TryResetPasswordAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    Task<bool> TryResetPasswordAsync(string tokenHash, string newPasswordHash,
        DateTimeOffset now, CancellationToken cancellationToken);
}

// IPasswordResetEmailSender: định nghĩa hợp đồng xử lý giữa các tầng.
public interface IPasswordResetEmailSender
{
    bool IsConfigured { get; }
    // SendAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    Task SendAsync(string email, string resetUrl, CancellationToken cancellationToken);
}

// IPasswordResetFailureReporter: định nghĩa hợp đồng xử lý giữa các tầng.
public interface IPasswordResetFailureReporter
{
    // EmailDeliveryFailed: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    void EmailDeliveryFailed(string errorType);
}

// PasswordResetOptions: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record PasswordResetOptions(string? ResetPageUrl)
{
    public static readonly TimeSpan TokenLifetime = TimeSpan.FromMinutes(20);
}

// AccessToken: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record AccessToken(string Value, DateTimeOffset ExpiresAtUtc);
// AuthenticatedUser: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record AuthenticatedUser(string Id, string FullName, string Email, string Role, bool IsLocked);
// AuthResult: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record AuthResult(AuthenticatedUser User, AccessToken Token, string? RefreshSecret = null, DateTimeOffset? SessionExpiresAtUtc = null);

// DuplicateEmailException: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class DuplicateEmailException : Exception;
