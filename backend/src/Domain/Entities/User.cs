// Chức năng: hạ tầng và quy tắc dùng chung. Tầng Domain mô tả dữ liệu hoặc quy tắc nghiệp vụ, không phụ thuộc HTTP hay cơ sở dữ liệu.
using Domain.Enums;

namespace Domain.Entities;

// User: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class User
{
    private User() { }

    private User(string fullName, string email, string passwordHash, UserRole role, DateTimeOffset createdAtUtc)
    {
        Id = Guid.NewGuid().ToString("N");
        FullName = fullName;
        Email = email;
        NormalizedEmail = email.ToUpperInvariant();
        PasswordHash = passwordHash;
        Role = role;
        CreatedAtUtc = createdAtUtc;
        UpdatedAtUtc = createdAtUtc;
        Profile = UserProfile.Create(Id, createdAtUtc);
    }

    public string Id { get; private set; } = string.Empty;
    public string FullName { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string? PhoneNumber { get; private set; }
    public string NormalizedEmail { get; private set; } = string.Empty;
    public string PasswordHash { get; private set; } = string.Empty;
    public int TokenVersion { get; private set; }
    // Mỗi tài khoản chỉ giữ một phiên trình duyệt; chỉ lưu hash của bí mật gia hạn.
    public string? ActiveSessionId { get; private set; }
    public string? RefreshTokenHash { get; private set; }
    public DateTimeOffset? SessionExpiresAtUtc { get; private set; }
    public UserRole Role { get; private set; }
    public bool IsLocked { get; private set; }
    public string? LockReason { get; private set; }
    public DateTimeOffset? LockedAtUtc { get; private set; }
    public DateTimeOffset CreatedAtUtc { get; private set; }
    public DateTimeOffset UpdatedAtUtc { get; private set; }
    public UserProfile? Profile { get; private set; }

    // Register: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public static User Register(string fullName, string email, string passwordHash, DateTimeOffset createdAtUtc)
    {
        fullName = RequireText(fullName, 150, nameof(fullName));
        email = RequireText(email, 254, nameof(email));
        passwordHash = RequireText(passwordHash, 1_000, nameof(passwordHash));
        return new User(fullName, email, passwordHash, UserRole.User, createdAtUtc);
    }

    // Only the opt-in internal bootstrap calls this factory. Public registration uses Register.
    // CreateInitialAdmin: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public static User CreateInitialAdmin(string fullName, string email, string passwordHash, DateTimeOffset createdAtUtc)
    {
        fullName = RequireText(fullName, 150, nameof(fullName));
        email = RequireText(email, 254, nameof(email));
        passwordHash = RequireText(passwordHash, 1_000, nameof(passwordHash));
        return new User(fullName, email, passwordHash, UserRole.Admin, createdAtUtc);
    }

    // UpdateContact: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public void UpdateContact(string fullName, string email, DateTimeOffset updatedAtUtc)
    {
        FullName = RequireText(fullName, 150, nameof(fullName));
        Email = RequireText(email, 254, nameof(email));
        NormalizedEmail = Email.ToUpperInvariant();
        UpdatedAtUtc = updatedAtUtc;
    }

    // SetPhoneNumber: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public void SetPhoneNumber(string? phoneNumber, DateTimeOffset updatedAtUtc)
    {
        phoneNumber = phoneNumber?.Trim();
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (string.IsNullOrEmpty(phoneNumber))
        {
            PhoneNumber = null;
        }
        else
        {
            var digits = phoneNumber.Count(char.IsDigit);
            if (phoneNumber.Length > 30 || digits is < 7 or > 15 ||
                phoneNumber.Any(c => !char.IsDigit(c) && c is not ('+' or ' ' or '-' or '.' or '(' or ')')) ||
                phoneNumber.Count(c => c == '+') > 1 ||
                (phoneNumber.Contains('+') && phoneNumber[0] != '+'))
                throw new ArgumentException("Phone number must contain 7 to 15 digits and at most 30 characters.", nameof(phoneNumber));
            PhoneNumber = phoneNumber;
        }

        UpdatedAtUtc = updatedAtUtc;
    }

    // ChangePasswordHash: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public void ChangePasswordHash(string passwordHash, DateTimeOffset updatedAtUtc)
    {
        PasswordHash = RequireText(passwordHash, 1_000, nameof(passwordHash));
        TokenVersion++;
        EndSession();
        UpdatedAtUtc = updatedAtUtc;
    }

    // Lock: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public void Lock(string reason, DateTimeOffset lockedAtUtc)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (IsLocked)
            throw new InvalidOperationException("Tài khoản đã bị khóa trước đó.");

        LockReason = RequireText(reason, 1_000, nameof(reason));
        IsLocked = true;
        TokenVersion++;
        EndSession();
        LockedAtUtc = lockedAtUtc;
        UpdatedAtUtc = lockedAtUtc;
    }

    // Unlock: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public void Unlock(DateTimeOffset unlockedAtUtc)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (!IsLocked)
            throw new InvalidOperationException("Tài khoản hiện không bị khóa.");

        IsLocked = false;
        LockReason = null;
        LockedAtUtc = null;
        UpdatedAtUtc = unlockedAtUtc;
    }

    // Mở phiên mới thay cho phiên cũ; kiểm tra bí mật và thời hạn thuộc Application.
    public void StartSession(string sessionId, string refreshTokenHash, DateTimeOffset expiresAtUtc)
    {
        // Token trước khi có sid cũng phải mất hiệu lực vĩnh viễn, kể cả sau khi phiên mới đăng xuất.
        TokenVersion++;
        ActiveSessionId = sessionId;
        RefreshTokenHash = refreshTokenHash;
        SessionExpiresAtUtc = expiresAtUtc;
    }

    public void EndSession()
    {
        ActiveSessionId = null;
        RefreshTokenHash = null;
        SessionExpiresAtUtc = null;
    }

    // RequireText: Kiểm tra dữ liệu và điều kiện nghiệp vụ; dừng xử lý khi không hợp lệ.
    private static string RequireText(string value, int maxLength, string parameterName)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (string.IsNullOrWhiteSpace(value) || value.Trim().Length > maxLength)
            throw new ArgumentException($"{parameterName} is required and must be at most {maxLength} characters.", parameterName);

        return value.Trim();
    }
}
