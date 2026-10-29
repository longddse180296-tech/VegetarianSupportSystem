// Chức năng: cập nhật phiên bằng câu lệnh nguyên tử; đăng nhập đồng thời chỉ có phiên ghi cuối còn hiệu lực.
using Application.Features.Auth;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public sealed class AccountSessionRepository(AppDbContext db) : IAccountSessionRepository
{
    public async Task<bool> ReplaceAsync(User user, string sessionId, string tokenHash, DateTimeOffset expiresAtUtc, CancellationToken ct) =>
        await db.Users.Where(x => x.Id == user.Id && !x.IsLocked && x.Role == user.Role && x.PasswordHash == user.PasswordHash)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(x => x.TokenVersion, user.TokenVersion + 1)
                .SetProperty(x => x.ActiveSessionId, sessionId)
                .SetProperty(x => x.RefreshTokenHash, tokenHash)
                .SetProperty(x => x.SessionExpiresAtUtc, expiresAtUtc), ct) == 1;

    public Task<User?> FindAsync(string sessionId, string tokenHash, DateTimeOffset now, CancellationToken ct) =>
        db.Users.AsNoTracking().FirstOrDefaultAsync(x => x.ActiveSessionId == sessionId && x.RefreshTokenHash == tokenHash &&
            !x.IsLocked && x.SessionExpiresAtUtc > now, ct);

    // Điều kiện sessionId ngăn yêu cầu đăng xuất đến muộn ở máy cũ xóa nhầm phiên mới.
    public Task EndAsync(string userId, string sessionId, CancellationToken ct) =>
        db.Users.Where(x => x.Id == userId && x.ActiveSessionId == sessionId)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(x => x.ActiveSessionId, (string?)null)
                .SetProperty(x => x.RefreshTokenHash, (string?)null)
                .SetProperty(x => x.SessionExpiresAtUtc, (DateTimeOffset?)null), ct);
}
