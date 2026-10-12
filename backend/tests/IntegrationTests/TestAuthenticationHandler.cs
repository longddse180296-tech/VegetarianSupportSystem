using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

namespace CoreDataChecks;

internal sealed class TestAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue("Test-Role", out var role))
            return Task.FromResult(AuthenticateResult.NoResult());

        var userId = Request.Headers.TryGetValue("Test-UserId", out var suppliedUserId)
            && !string.IsNullOrWhiteSpace(suppliedUserId)
            ? suppliedUserId.ToString()
            : "test-" + role.ToString().ToLowerInvariant();
        var principal = new ClaimsPrincipal(new ClaimsIdentity(
        [
            new Claim("sub", userId),
            new Claim(ClaimTypes.Role, role.ToString())
        ], Scheme.Name));
        return Task.FromResult(AuthenticateResult.Success(
            new AuthenticationTicket(principal, Scheme.Name)));
    }
}
