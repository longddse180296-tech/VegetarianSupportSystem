// Chức năng: lưu một phiên trình duyệt cho mỗi tài khoản và thu hồi đúng phiên khi đăng xuất.
using Domain.Entities;

namespace Application.Features.Auth;

public interface IAccountSessionRepository
{
    Task<bool> ReplaceAsync(User user, string sessionId, string tokenHash, DateTimeOffset expiresAtUtc, CancellationToken ct);
    Task<User?> FindAsync(string sessionId, string tokenHash, DateTimeOffset now, CancellationToken ct);
    Task EndAsync(string userId, string sessionId, CancellationToken ct);
}
