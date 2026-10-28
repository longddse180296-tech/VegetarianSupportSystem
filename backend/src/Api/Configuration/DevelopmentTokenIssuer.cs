// Chức năng: hạ tầng và quy tắc dùng chung. Tầng API nhận yêu cầu, kiểm tra quyền và chuyển xử lý cho Application.
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace Api.Configuration;

// Local testing only. This service is registered and mapped only in Development.
// DevelopmentTokenIssuer: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class DevelopmentTokenIssuer(string issuer, string audience, string signingKey)
{
    // Issue: Đánh giá điều kiện nghiệp vụ để quyết định nhánh xử lý.
    public DevelopmentTokenResponse Issue(string userId, string role, int tokenVersion)
    {
        var expiresAtUtc = DateTimeOffset.UtcNow.AddHours(1);
        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims:
            [
                new Claim(JwtRegisteredClaimNames.Sub, userId),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N")),
                new Claim("role", role),
                new Claim("ver", tokenVersion.ToString(System.Globalization.CultureInfo.InvariantCulture))
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

// DevelopmentTokenRequest: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record DevelopmentTokenRequest(string? UserId, string? Role);

// DevelopmentTokenResponse: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record DevelopmentTokenResponse(
    string AccessToken,
    string TokenType,
    string Role,
    string UserId,
    DateTimeOffset ExpiresAtUtc);
