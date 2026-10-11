using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.Text.Json;
using Api.Configuration;
using Api.Controllers;
using Application.Features.Auth;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Identity;

namespace Domain.Tests;

public sealed class AuthTests
{
    private const string SigningKey = "12345678901234567890123456789012";

    [Fact]
    public async Task RegistrationPersistsOnlyUserWithHashAndRealTokenClaims()
    {
        var accounts = new MemoryAccounts();
        var service = CreateService(accounts);

        var result = await service.RegisterAsync(" Test User ", " Test@Example.com ", "StrongPass1", "StrongPass1", default);
        var saved = Assert.Single(accounts.Users);
        Assert.Equal(UserRole.User, saved.Role);
        Assert.NotEqual("StrongPass1", saved.PasswordHash);
        Assert.StartsWith("pbkdf2-sha256$", saved.PasswordHash);
        Assert.Equal(saved.Id, result.User.Id);
        Assert.NotNull(saved.Profile);
        Assert.Equal("Test@Example.com", saved.Email);
        Assert.Equal("TEST@EXAMPLE.COM", saved.NormalizedEmail);
        Assert.False(result.User.IsLocked);

        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(result.Token.Value);
        Assert.Equal(saved.Id, jwt.Subject);
        Assert.Equal("User", jwt.Claims.Single(x => x.Type == "role").Value);
        Assert.True(Guid.TryParseExact(jwt.Claims.Single(x => x.Type == "jti").Value, "N", out _));

        var login = await service.LoginAsync("test@example.com", "StrongPass1", default);
        Assert.NotNull(login);
        Assert.Equal(saved.Id, login.User.Id);
    }

    [Fact]
    public async Task InvalidOrLockedAccountCannotLogin()
    {
        var accounts = new MemoryAccounts();
        var service = CreateService(accounts);
        await service.RegisterAsync("Test User", "test@example.com", "StrongPass1", "StrongPass1", default);
        Assert.Null(await service.LoginAsync("test@example.com", "wrong", default));
        accounts.Users[0].Lock("Admin decision", DateTimeOffset.UtcNow);
        Assert.Null(await service.LoginAsync("test@example.com", "StrongPass1", default));
        Assert.Null(await service.GetCurrentUserAsync(accounts.Users[0].Id, default));
    }

    [Fact]
    public async Task InternalAdminAccountGetsAdminClaim()
    {
        var hasher = new Pbkdf2PasswordHasher();
        var admin = User.CreateInitialAdmin("System Admin", "admin@example.com",
            hasher.Hash("strong-admin-password"), DateTimeOffset.UtcNow);
        var accounts = new MemoryAccounts();
        await accounts.AddAsync(admin, default);

        var login = await CreateService(accounts).LoginAsync("admin@example.com", "strong-admin-password", default);
        Assert.NotNull(login);
        Assert.Equal("Admin", login.User.Role);
        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(login.Token.Value);
        Assert.Equal(admin.Id, jwt.Subject);
        Assert.Equal("Admin", jwt.Claims.Single(x => x.Type == "role").Value);
    }

    [Fact]
    public async Task DuplicateEmailCannotRegisterAndRoleFieldIsRejected()
    {
        var service = CreateService(new MemoryAccounts());
        await service.RegisterAsync("Test User", "test@example.com", "StrongPass1", "StrongPass1", default);
        await Assert.ThrowsAsync<DuplicateEmailException>(() =>
            service.RegisterAsync("Other User", "TEST@example.com", "StrongPass1", "StrongPass1", default));

        Assert.Throws<JsonException>(() => JsonSerializer.Deserialize<AuthController.RegisterRequest>(
            """{"fullName":"Test","email":"test@example.com","password":"StrongPass1","confirmPassword":"StrongPass1","role":"Admin"}""",
            new JsonSerializerOptions(JsonSerializerDefaults.Web)));
        Assert.Throws<JsonException>(() => JsonSerializer.Deserialize<AuthController.LoginRequest>(
            """{"email":"test@example.com","password":"StrongPass1","role":"Admin"}""",
            new JsonSerializerOptions(JsonSerializerDefaults.Web)));
    }

    [Theory]
    [InlineData(null, "password")]
    [InlineData("not-an-email", "password")]
    [InlineData("user@example.com", null)]
    public void LoginRequestReportsFieldValidationErrors(string? email, string? password)
    {
        var request = new AuthController.LoginRequest { Email = email, Password = password };
        var errors = new List<ValidationResult>();
        Assert.False(Validator.TryValidateObject(request, new ValidationContext(request), errors, true));
        Assert.NotEmpty(errors);
    }

    [Theory]
    [InlineData("invalid", "StrongPass1", "StrongPass1")]
    [InlineData("user@example.com", "abcde", "abcde")]
    [InlineData("user@example.com", "Password 1", "Password 1")]
    [InlineData("user@example.com", "StrongPass1", "Mismatch1")]
    public async Task RegistrationRejectsInvalidInput(string email, string password, string confirmation)
    {
        await Assert.ThrowsAsync<ArgumentException>(() => CreateService(new MemoryAccounts())
            .RegisterAsync("Test User", email, password, confirmation, default));
    }

    [Theory]
    [InlineData("abcdef")]
    [InlineData("123456")]
    [InlineData("!@#$%^")]
    public async Task RegistrationAcceptsAnySixNonWhitespaceCharacters(string password)
    {
        var service = CreateService(new MemoryAccounts());
        var result = await service.RegisterAsync("Test User", "test@example.com", password, password, default);
        Assert.NotNull(await service.LoginAsync(result.User.Email, password, default));
    }

    [Fact]
    public async Task CurrentUserUsesStoredAccountAndLogoutRevokesOnlyItsToken()
    {
        var accounts = new MemoryAccounts();
        var revoked = new MemoryRevokedTokens();
        var service = CreateService(accounts, revoked);
        var login = await service.RegisterAsync("Test User", "test@example.com", "StrongPass1", "StrongPass1", default);
        var tokenId = new JwtSecurityTokenHandler().ReadJwtToken(login.Token.Value)
            .Claims.Single(x => x.Type == "jti").Value;

        var current = await service.GetCurrentUserAsync(login.User.Id, default);
        Assert.Equal("Test User", current?.FullName);
        Assert.Equal("test@example.com", current?.Email);
        Assert.Null(await service.GetCurrentUserAsync("missing", default));

        await service.LogoutAsync(tokenId, login.Token.ExpiresAtUtc, default);
        Assert.True(await revoked.IsRevokedAsync(tokenId, default));
        Assert.Equal(login.Token.ExpiresAtUtc, revoked.Expiry[tokenId]);
    }

    private static AuthService CreateService(MemoryAccounts accounts, MemoryRevokedTokens? revoked = null) => new(
        accounts,
        new Pbkdf2PasswordHasher(),
        new JwtAccessTokenIssuer("issuer", "audience", SigningKey),
        revoked ?? new MemoryRevokedTokens());

    private sealed class MemoryRevokedTokens : IRevokedAccessTokenRepository
    {
        public Dictionary<string, DateTimeOffset> Expiry { get; } = [];
        public Task<bool> IsRevokedAsync(string tokenId, CancellationToken cancellationToken) =>
            Task.FromResult(Expiry.ContainsKey(tokenId));
        public Task RevokeAsync(string tokenId, DateTimeOffset expiresAtUtc, CancellationToken cancellationToken)
        {
            Expiry.Add(tokenId, expiresAtUtc);
            return Task.CompletedTask;
        }
    }

    private sealed class MemoryAccounts : IUserAccountRepository
    {
        public List<User> Users { get; } = [];
        public Task<User?> FindByEmailAsync(string normalizedEmail, CancellationToken cancellationToken) =>
            Task.FromResult(Users.FirstOrDefault(x => x.NormalizedEmail == normalizedEmail));
        public Task<User?> FindByIdAsync(string id, CancellationToken cancellationToken) =>
            Task.FromResult(Users.FirstOrDefault(x => x.Id == id));
        public Task<bool> HasAdminAsync(CancellationToken cancellationToken) =>
            Task.FromResult(Users.Any(x => x.Role == UserRole.Admin));
        public Task AddAsync(User user, CancellationToken cancellationToken)
        {
            Users.Add(user);
            return Task.CompletedTask;
        }
    }
}
