namespace Domain.Entities;

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

    public static PasswordResetToken Create(string tokenHash, string userId,
        DateTimeOffset createdAtUtc, DateTimeOffset expiresAtUtc)
    {
        if (tokenHash.Length != 64 || !tokenHash.All(Uri.IsHexDigit))
            throw new ArgumentException("Invalid token hash.", nameof(tokenHash));
        if (string.IsNullOrWhiteSpace(userId))
            throw new ArgumentException("User ID is required.", nameof(userId));
        if (expiresAtUtc <= createdAtUtc)
            throw new ArgumentException("Expiry must follow creation.", nameof(expiresAtUtc));
        return new PasswordResetToken(tokenHash, userId, createdAtUtc, expiresAtUtc);
    }
}
