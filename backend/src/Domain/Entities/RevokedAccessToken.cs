// Chức năng: hạ tầng và quy tắc dùng chung. Tầng Domain mô tả dữ liệu hoặc quy tắc nghiệp vụ, không phụ thuộc HTTP hay cơ sở dữ liệu.
namespace Domain.Entities;

// RevokedAccessToken: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class RevokedAccessToken
{
    private RevokedAccessToken() { }

    private RevokedAccessToken(string tokenId, DateTimeOffset expiresAtUtc)
    {
        TokenId = tokenId;
        ExpiresAtUtc = expiresAtUtc;
    }

    public string TokenId { get; private set; } = string.Empty;
    public DateTimeOffset ExpiresAtUtc { get; private set; }

    // Create: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public static RevokedAccessToken Create(string tokenId, DateTimeOffset expiresAtUtc)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (!Guid.TryParseExact(tokenId, "N", out _))
            throw new ArgumentException("Invalid token ID.", nameof(tokenId));
        return new RevokedAccessToken(tokenId, expiresAtUtc);
    }
}
