using System.Security.Claims;
using System.Globalization;
using Application.Features.Auth;

namespace Api.Authorization;

public sealed class AccountTokenValidator(
    IUserAccountRepository accounts,
    IRevokedAccessTokenRepository revokedTokens)
{
    public async Task<bool> IsValidAsync(ClaimsPrincipal? principal, CancellationToken cancellationToken)
    {
        var ids = principal?.FindAll("sub").ToArray() ?? [];
        var roles = principal?.FindAll("role").ToArray() ?? [];
        var tokenIds = principal?.FindAll("jti").ToArray() ?? [];
        var versions = principal?.FindAll("ver").ToArray() ?? [];
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
        if (user is null || user.IsLocked || user.Role.ToString() != roles[0].Value ||
            user.TokenVersion != tokenVersion)
            return false;

        return !await revokedTokens.IsRevokedAsync(tokenIds[0].Value, cancellationToken);
    }
}
