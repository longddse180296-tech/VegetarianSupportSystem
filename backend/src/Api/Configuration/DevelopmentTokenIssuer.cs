using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace Api.Configuration;

// Local testing only. This service is registered and mapped only in Development.
public sealed class DevelopmentTokenIssuer(string issuer, string audience, string signingKey)
{
    public DevelopmentTokenResponse Issue(string userId, string role)
    {
        var expiresAtUtc = DateTimeOffset.UtcNow.AddHours(1);
        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims:
            [
                new Claim(JwtRegisteredClaimNames.Sub, userId),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N")),
                new Claim("role", role)
            ],
            expires: expiresAtUtc.UtcDateTime,
            signingCredentials: new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(signingKey)),
                SecurityAlgorithms.HmacSha256));

        return new DevelopmentTokenResponse(
            new JwtSecurityTokenHandler().WriteToken(token),
            "Bearer",
            role,
            userId,
            expiresAtUtc);
    }
}

public sealed record DevelopmentTokenRequest(string? UserId, string? Role);

public sealed record DevelopmentTokenResponse(
    string AccessToken,
    string TokenType,
    string Role,
    string UserId,
    DateTimeOffset ExpiresAtUtc);
