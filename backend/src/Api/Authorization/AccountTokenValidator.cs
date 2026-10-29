// Chức năng: kiểm tra quyền truy cập. Tầng API nhận yêu cầu, kiểm tra quyền và chuyển xử lý cho Application.
using System.Security.Claims;
using System.Globalization;
using Application.Features.Auth;

namespace Api.Authorization;

// AccountTokenValidator: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class AccountTokenValidator(
    IUserAccountRepository accounts,
    IRevokedAccessTokenRepository revokedTokens)
{
    public string? FailureCode { get; private set; }
    // IsValidAsync: Đánh giá điều kiện nghiệp vụ để quyết định nhánh xử lý.
    public async Task<bool> IsValidAsync(ClaimsPrincipal? principal, CancellationToken cancellationToken)
    {
        FailureCode = null;
        var ids = principal?.FindAll("sub").ToArray() ?? [];
        var roles = principal?.FindAll("role").ToArray() ?? [];
        var tokenIds = principal?.FindAll("jti").ToArray() ?? [];
        var versions = principal?.FindAll("ver").ToArray() ?? [];
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (ids.Length != 1 || roles.Length != 1 || tokenIds.Length != 1 ||
            versions.Length > 1 ||
            string.IsNullOrWhiteSpace(ids[0].Value) ||
            roles[0].Value is not ("User" or "Admin") ||
            !Guid.TryParseExact(tokenIds[0].Value, "N", out _))
            return false;

        // Tokens issued before the version claim was introduced are version zero.
        var tokenVersion = 0;
        if (versions.Length == 1 &&
            (!int.TryParse(versions[0].Value, NumberStyles.None, CultureInfo.InvariantCulture, out tokenVersion)
             || tokenVersion < 0))
            return false;

        var user = await accounts.FindByIdAsync(ids[0].Value, cancellationToken);
        if (user is null || user.IsLocked || user.Role.ToString() != roles[0].Value)
            return false;

        var sessions = principal?.FindAll("sid").ToArray() ?? [];
        if (sessions.Length > 1 || (sessions.SingleOrDefault()?.Value != user.ActiveSessionId))
        {
            FailureCode = "SESSION_REPLACED";
            return false;
        }
        if (user.TokenVersion != tokenVersion) return false;
        if (user.ActiveSessionId is not null &&
            (user.SessionExpiresAtUtc is not DateTimeOffset expiry || expiry <= DateTimeOffset.UtcNow))
            return false;
        return !await revokedTokens.IsRevokedAsync(tokenIds[0].Value, cancellationToken);
    }
}
