// Chức năng: cấp/gia hạn phiên trình duyệt; không phát lại token cho tài khoản khóa, hết phiên hoặc phiên đã bị thay thế.
using System.Security.Cryptography;
using System.Text;
using Domain.Entities;

namespace Application.Features.Auth;

public sealed class AccountSessionService(IAccountSessionRepository sessions, IAccessTokenIssuer issuer)
{
    // Bí mật ngẫu nhiên chỉ trả về API để đặt cookie HttpOnly, không đưa vào JSON hoặc log.
    public async Task<AuthResult?> StartAsync(User user, CancellationToken ct)
    {
        var id = Guid.NewGuid().ToString("N");
        var secret = id + "." + Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        var expires = DateTimeOffset.UtcNow.AddDays(7);
        var hash = Hash(secret);
        if (!await sessions.ReplaceAsync(user, id, hash, expires, ct)) return null;
        user.StartSession(id, hash, expires);
        return new(AuthService.ToAuthenticatedUser(user), issuer.Issue(user), secret, expires);
    }

    public async Task<AuthResult?> RefreshAsync(string? secret, CancellationToken ct)
    {
        if (secret is null || secret.Length != 97 || secret[32] != '.' || !Guid.TryParseExact(secret[..32], "N", out _)) return null;
        var user = await sessions.FindAsync(secret[..32], Hash(secret), DateTimeOffset.UtcNow, ct);
        if (user is null) return null;
        // Giữ thời hạn tuyệt đối 7 ngày; gia hạn access token không kéo dài vô hạn phiên trình duyệt.
        return new(AuthService.ToAuthenticatedUser(user), issuer.Issue(user));
    }

    public Task EndAsync(string userId, string sessionId, CancellationToken ct) => sessions.EndAsync(userId, sessionId, ct);
    private static string Hash(string secret) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(secret)));
}
