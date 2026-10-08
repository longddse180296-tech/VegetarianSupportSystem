namespace Domain.Entities;

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

    public static RevokedAccessToken Create(string tokenId, DateTimeOffset expiresAtUtc)
    {
        if (!Guid.TryParseExact(tokenId, "N", out _))
            throw new ArgumentException("Invalid token ID.", nameof(tokenId));
        return new RevokedAccessToken(tokenId, expiresAtUtc);
    }
}
