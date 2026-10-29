// Chức năng: hạ tầng và quy tắc dùng chung. Tầng Domain mô tả dữ liệu hoặc quy tắc nghiệp vụ, không phụ thuộc HTTP hay cơ sở dữ liệu.
namespace Domain.Entities;

// PasswordResetToken: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class PasswordResetToken
{
    private PasswordResetToken() { }

    private PasswordResetToken(string tokenHash, string userId, DateTimeOffset createdAtUtc,
        DateTimeOffset expiresAtUtc)
    {
        TokenHash = tokenHash;
        UserId = userId;
        CreatedAtUtc = createdAtUtc;
        ExpiresAtUtc = expiresAtUtc;
    }

    public string TokenHash { get; private set; } = string.Empty;
    public string UserId { get; private set; } = string.Empty;
    public DateTimeOffset CreatedAtUtc { get; private set; }
    public DateTimeOffset ExpiresAtUtc { get; private set; }
    public DateTimeOffset? ConsumedAtUtc { get; private set; }

    // Create: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public static PasswordResetToken Create(string tokenHash, string userId,
        DateTimeOffset createdAtUtc, DateTimeOffset expiresAtUtc)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (tokenHash.Length != 64 || !tokenHash.All(Uri.IsHexDigit))
            throw new ArgumentException("Invalid token hash.", nameof(tokenHash));
        if (string.IsNullOrWhiteSpace(userId))
            throw new ArgumentException("User ID is required.", nameof(userId));
        if (expiresAtUtc <= createdAtUtc)
            throw new ArgumentException("Expiry must follow creation.", nameof(expiresAtUtc));
        return new PasswordResetToken(tokenHash, userId, createdAtUtc, expiresAtUtc);
    }
}
