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

        var result = await service.RegisterAsync(" Test User ", " Test@Example.com ", "strong-password", "strong-password", default);
        var saved = Assert.Single(accounts.Users);
        Assert.Equal(UserRole.User, saved.Role);
        Assert.NotEqual("strong-password", saved.PasswordHash);
        Assert.StartsWith("pbkdf2-sha256$", saved.PasswordHash);
        Assert.Equal(saved.Id, result.User.Id);

        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(result.Token.Value);
        Assert.Equal(saved.Id, jwt.Subject);
        Assert.Equal("User", jwt.Claims.Single(x => x.Type == "role").Value);

        var login = await service.LoginAsync("test@example.com", "strong-password", default);
        Assert.NotNull(login);
        Assert.Equal(saved.Id, login.User.Id);
    }

    [Fact]
    public async Task InvalidOrLockedAccountCannotLogin()
    {
        var accounts = new MemoryAccounts();
        var service = CreateService(accounts);
        await service.RegisterAsync("Test User", "test@example.com", "strong-password", "strong-password", default);
        Assert.Null(await service.LoginAsync("test@example.com", "wrong", default));
        accounts.Users[0].Lock("Admin decision", DateTimeOffset.UtcNow);
        Assert.Null(await service.LoginAsync("test@example.com", "strong-password", default));
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
        await service.RegisterAsync("Test User", "test@example.com", "strong-password", "strong-password", default);
        await Assert.ThrowsAsync<DuplicateEmailException>(() =>
            service.RegisterAsync("Other User", "TEST@example.com", "strong-password", "strong-password", default));

        Assert.Throws<JsonException>(() => JsonSerializer.Deserialize<AuthController.RegisterRequest>(
            """{"fullName":"Test","email":"test@example.com","password":"strong-password","confirmPassword":"strong-password","role":"Admin"}""",
            new JsonSerializerOptions(JsonSerializerDefaults.Web)));
    }

    private static AuthService CreateService(MemoryAccounts accounts) => new(
        accounts,
        new Pbkdf2PasswordHasher(),
        new JwtAccessTokenIssuer("issuer", "audience", SigningKey));

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
