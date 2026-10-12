using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Api.Authorization;
using Api.Configuration;
using Application.Features.Auth;
using Domain.Entities;
using Domain.Enums;
using Microsoft.IdentityModel.Tokens;

namespace Domain.Tests;

public sealed class AuthTokenValidationTests
{
    private const string Issuer = "auth-tests";
    private const string Audience = "auth-tests-client";
    private const string SigningKey = "12345678901234567890123456789012";

    [Fact]
    public async Task IssuedTokenSurvivesValidationUntilLogoutThenFails()
    {
        var user = NewUser();
        var accounts = new Accounts(user);
        var revoked = new RevokedTokens();
        var token = new JwtAccessTokenIssuer(Issuer, Audience, SigningKey).Issue(user);
        var principal = ValidateJwt(token.Value);
        var validator = new AccountTokenValidator(accounts, revoked);

        Assert.InRange(token.ExpiresAtUtc, DateTimeOffset.UtcNow.AddMinutes(59), DateTimeOffset.UtcNow.AddMinutes(61));
        Assert.True(principal.IsInRole("User"));
        Assert.False(principal.IsInRole("Admin"));
        Assert.True(await validator.IsValidAsync(principal, default));

        await revoked.RevokeAsync(principal.FindFirst("jti")!.Value, token.ExpiresAtUtc, default);
        Assert.False(await validator.IsValidAsync(principal, default));
    }

    [Fact]
    public void ExpiredTokenFailsJwtLifetimeValidation()
    {
        var user = NewUser();
        var token = CreateToken(user.Id, "User", DateTime.UtcNow.AddSeconds(-1));
        Assert.Throws<SecurityTokenExpiredException>(() => ValidateJwt(token));
    }

    [Fact]
    public async Task LockedOrMissingAccountCannotUseExistingToken()
    {
        var user = NewUser();
        var accounts = new Accounts(user);
        var validator = new AccountTokenValidator(accounts, new RevokedTokens());
        var principal = ValidateJwt(new JwtAccessTokenIssuer(Issuer, Audience, SigningKey).Issue(user).Value);
        Assert.True(await validator.IsValidAsync(principal, default));

        user.Lock("Admin decision", DateTimeOffset.UtcNow);
        Assert.False(await validator.IsValidAsync(principal, default));
        user.Unlock(DateTimeOffset.UtcNow);
        accounts.User = null;
        Assert.False(await validator.IsValidAsync(principal, default));
    }

    [Fact]
    public async Task PasswordChangeInvalidatesPreviousJwtAndNewJwtWorks()
    {
        var user = NewUser();
        var validator = new AccountTokenValidator(new Accounts(user), new RevokedTokens());
        var issuer = new JwtAccessTokenIssuer(Issuer, Audience, SigningKey);
        var oldPrincipal = ValidateJwt(issuer.Issue(user).Value);
        Assert.True(await validator.IsValidAsync(oldPrincipal, default));

        user.ChangePasswordHash("replacement-hash", DateTimeOffset.UtcNow);
        Assert.False(await validator.IsValidAsync(oldPrincipal, default));
        var newPrincipal = ValidateJwt(issuer.Issue(user).Value);
        Assert.True(await validator.IsValidAsync(newPrincipal, default));
    }

    [Fact]
    public async Task ForgedOrChangedRoleCannotGainAccess()
    {
        var user = NewUser();
        var validator = new AccountTokenValidator(new Accounts(user), new RevokedTokens());
        var forgedAdmin = ValidateJwt(CreateToken(user.Id, "Admin", DateTime.UtcNow.AddMinutes(10)));
        Assert.True(forgedAdmin.IsInRole("Admin"));
        Assert.False(await validator.IsValidAsync(forgedAdmin, default));

        var ordinaryUser = ValidateJwt(new JwtAccessTokenIssuer(Issuer, Audience, SigningKey).Issue(user).Value);
        Assert.True(await validator.IsValidAsync(ordinaryUser, default));
        Assert.False(ordinaryUser.IsInRole("Admin"));
    }

    [Fact]
    public async Task InvalidOrDuplicateClaimsCannotUseAccount()
    {
        var user = NewUser();
        var validator = new AccountTokenValidator(new Accounts(user), new RevokedTokens());
        var claims = new[]
        {
            new Claim("sub", user.Id), new Claim("role", "User"),
            new Claim("role", "Admin"), new Claim("jti", Guid.NewGuid().ToString("N"))
        };
        var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, "Bearer", "sub", "role"));
        Assert.False(await validator.IsValidAsync(principal, default));
    }

    private static User NewUser() =>
        User.Register("Test User", "user@example.com", "test-hash", DateTimeOffset.UtcNow);

    private static string CreateToken(string userId, string role, DateTime expires) =>
        new JwtSecurityTokenHandler().WriteToken(new JwtSecurityToken(
            issuer: Issuer, audience: Audience,
            claims: [new Claim("sub", userId), new Claim("role", role), new Claim("jti", Guid.NewGuid().ToString("N"))],
            expires: expires,
            signingCredentials: new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(SigningKey)), SecurityAlgorithms.HmacSha256)));

    private static ClaimsPrincipal ValidateJwt(string token) =>
        new JwtSecurityTokenHandler { MapInboundClaims = false }.ValidateToken(token,
            new TokenValidationParameters
            {
                ValidateIssuer = true, ValidIssuer = Issuer,
                ValidateAudience = true, ValidAudience = Audience,
                ValidateLifetime = true, ClockSkew = TimeSpan.Zero,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(SigningKey)),
                NameClaimType = "sub", RoleClaimType = "role"
            }, out _);

    private sealed class Accounts(User? user) : IUserAccountRepository
    {
        public User? User { get; set; } = user;
        public Task<User?> FindByIdAsync(string id, CancellationToken ct) =>
            Task.FromResult(User?.Id == id ? User : null);
        public Task<User?> FindByEmailAsync(string email, CancellationToken ct) =>
            Task.FromResult(User?.NormalizedEmail == email ? User : null);
        public Task<bool> HasAdminAsync(CancellationToken ct) => Task.FromResult(User?.Role == UserRole.Admin);
        public Task AddAsync(User account, CancellationToken ct)
        {
            User = account;
            return Task.CompletedTask;
        }
    }

    private sealed class RevokedTokens : IRevokedAccessTokenRepository
    {
        private readonly HashSet<string> revoked = [];
        public Task<bool> IsRevokedAsync(string tokenId, CancellationToken ct) =>
            Task.FromResult(revoked.Contains(tokenId));
        public Task RevokeAsync(string tokenId, DateTimeOffset expiresAtUtc, CancellationToken ct)
        {
            revoked.Add(tokenId);
            return Task.CompletedTask;
        }
    }
}
