using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Application.Features.Auth;
using Domain.Entities;
using Microsoft.IdentityModel.Tokens;

namespace Api.Configuration;

public sealed class JwtAccessTokenIssuer(string issuer, string audience, string signingKey) : IAccessTokenIssuer
{
    public AccessToken Issue(User user)
    {
        var expiresAtUtc = DateTimeOffset.UtcNow.AddHours(1);
        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims:
            [
                new Claim(JwtRegisteredClaimNames.Sub, user.Id),
                new Claim("role", user.Role.ToString())
            ],
            expires: expiresAtUtc.UtcDateTime,
            signingCredentials: new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(signingKey)),
                SecurityAlgorithms.HmacSha256));
        return new AccessToken(new JwtSecurityTokenHandler().WriteToken(token), expiresAtUtc);
    }
}
