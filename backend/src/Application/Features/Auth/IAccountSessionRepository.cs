// Quy định các thao tác truy xuất phiên trình duyệt và mã làm mới mà nghiệp vụ sử dụng.
using Domain.Entities;

namespace Application.Features.Auth;

public interface IAccountSessionRepository
{
    Task<bool> ReplaceAsync(User user, string sessionId, string tokenHash, DateTimeOffset expiresAtUtc, CancellationToken ct);
    Task<User?> FindAsync(string sessionId, string tokenHash, DateTimeOffset now, CancellationToken ct);
    Task EndAsync(string userId, string sessionId, CancellationToken ct);
}
