// Chức năng: hạ tầng và quy tắc dùng chung. Tầng API nhận yêu cầu, kiểm tra quyền và chuyển xử lý cho Application.
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Application.Features.Auth;
using Domain.Entities;
using Microsoft.IdentityModel.Tokens;

namespace Api.Configuration;

// JwtAccessTokenIssuer: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class JwtAccessTokenIssuer(string issuer, string audience, string signingKey) : IAccessTokenIssuer
{
    // Issue: Đánh giá điều kiện nghiệp vụ để quyết định nhánh xử lý.
    public AccessToken Issue(User user)
    {
        var expiresAtUtc = DateTimeOffset.UtcNow.AddHours(1);
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N")),
            new("role", user.Role.ToString()),
            new("ver", user.TokenVersion.ToString(System.Globalization.CultureInfo.InvariantCulture))
        };
        if (user.ActiveSessionId is not null) claims.Add(new("sid", user.ActiveSessionId));
        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expiresAtUtc.UtcDateTime,
            signingCredentials: new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(signingKey)),
                SecurityAlgorithms.HmacSha256));
        return new AccessToken(new JwtSecurityTokenHandler().WriteToken(token), expiresAtUtc);
    }
}
