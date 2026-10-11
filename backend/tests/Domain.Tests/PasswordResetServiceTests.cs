using System.Security.Cryptography;
using System.Text;
using Application.Features.Auth;
using Domain.Entities;
using Infrastructure.Identity;

namespace Domain.Tests;

public sealed class PasswordResetServiceTests
{
    [Fact]
    public async Task KnownAccountReceivesRandomLinkWhileUnknownAccountGetsNoEmail()
    {
        var user = NewUser();
        var resets = new Resets();
        var sender = new Sender();
        var service = CreateService(user, resets, sender);

        await service.RequestAsync(" USER@EXAMPLE.COM ", default);
        Assert.Equal(user.Email, sender.LastEmail);
        var token = Assert.Single(sender.LastUrl!.Split("?token=").Skip(1));
        Assert.Equal(64, token.Length);
        Assert.All(token, c => Assert.True(Uri.IsHexDigit(c)));
        Assert.Equal(Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token))), resets.IssuedHash);
        Assert.NotEqual(token, resets.IssuedHash);
        Assert.Equal(TimeSpan.FromMinutes(20), resets.ExpiresAt - resets.CreatedAt);

        sender.LastEmail = null;
        await service.RequestAsync("unknown@example.com", default);
        Assert.Null(sender.LastEmail);
    }

    [Fact]
    public async Task DeliveryFailureInvalidatesLinkWithoutLoggingSensitiveValues()
    {
        var resets = new Resets();
        var sender = new Sender { Fail = true };
        var reporter = new Reporter();
        var service = CreateService(NewUser(), resets, sender, reporter);
        await service.RequestAsync("user@example.com", default);
        Assert.Equal(resets.IssuedHash, resets.InvalidatedHash);
        Assert.Equal("InvalidOperationException", reporter.ErrorType);
    }

    [Fact]
    public async Task UnconfiguredSenderCannotAcceptRequests()
    {
        var sender = new Sender { IsConfigured = false };
        var service = CreateService(NewUser(), new Resets(), sender);
        Assert.False(service.IsAvailable);
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.RequestAsync("user@example.com", default));
    }

    [Theory]
    [InlineData("short", "short")]
    [InlineData("password with space", "password with space")]
    [InlineData("valid-password", "different-password")]
    public async Task ResetRejectsInvalidPasswords(string password, string confirmation)
    {
        var service = CreateService(NewUser(), new Resets(), new Sender());
        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.ResetAsync(new string('A', 64), password, confirmation, default));
    }

    [Fact]
    public async Task ResetHashesPasswordBeforePassingItToRepository()
    {
        var resets = new Resets();
        var service = CreateService(NewUser(), resets, new Sender());
        Assert.True(await service.ResetAsync(new string('A', 64), "new-password", "new-password", default));
        Assert.True(new Pbkdf2PasswordHasher().Verify(resets.NewPasswordHash!, "new-password"));
        Assert.NotEqual(new string('A', 64), resets.ResetHash);
        Assert.False(await service.ResetAsync("bad", "new-password", "new-password", default));
    }

    private static User NewUser() =>
        User.Register("Test", "user@example.com", "test-hash", DateTimeOffset.UtcNow);

    private static PasswordResetService CreateService(User user, Resets resets, Sender sender,
        Reporter? reporter = null) =>
        new(new Accounts(user), resets, sender, new Pbkdf2PasswordHasher(),
            new PasswordResetOptions("http://localhost:5173/#/auth/reset-password"),
            TimeProvider.System, reporter ?? new Reporter());

    private sealed class Accounts(User user) : IUserAccountRepository
    {
        public Task<User?> FindByEmailAsync(string email, CancellationToken ct) =>
            Task.FromResult(user.NormalizedEmail == email ? user : null);
        public Task<User?> FindByIdAsync(string id, CancellationToken ct) =>
            Task.FromResult(user.Id == id ? user : null);
        public Task<bool> HasAdminAsync(CancellationToken ct) => Task.FromResult(false);
        public Task AddAsync(User newUser, CancellationToken ct) => Task.CompletedTask;
    }

    private sealed class Resets : IPasswordResetRepository
    {
        public string? IssuedHash { get; private set; }
        public string? InvalidatedHash { get; private set; }
        public string? ResetHash { get; private set; }
        public string? NewPasswordHash { get; private set; }
        public DateTimeOffset CreatedAt { get; private set; }
        public DateTimeOffset ExpiresAt { get; private set; }
        public Task<bool> TryIssueAsync(string userId, string tokenHash, DateTimeOffset now,
            DateTimeOffset expires, CancellationToken ct)
        {
            IssuedHash = tokenHash;
            CreatedAt = now;
            ExpiresAt = expires;
            return Task.FromResult(true);
        }
        public Task InvalidateAsync(string tokenHash, DateTimeOffset now, CancellationToken ct)
        {
            InvalidatedHash = tokenHash;
            return Task.CompletedTask;
        }
        public Task<bool> TryResetPasswordAsync(string tokenHash, string newHash,
            DateTimeOffset now, CancellationToken ct)
        {
            ResetHash = tokenHash;
            NewPasswordHash = newHash;
            return Task.FromResult(true);
        }
    }

    private sealed class Sender : IPasswordResetEmailSender
    {
        public bool IsConfigured { get; set; } = true;
        public bool Fail { get; set; }
        public string? LastEmail { get; set; }
        public string? LastUrl { get; private set; }
        public Task SendAsync(string email, string url, CancellationToken ct)
        {
            LastEmail = email;
            LastUrl = url;
            if (Fail) throw new InvalidOperationException("Simulated SMTP failure");
            return Task.CompletedTask;
        }
    }

    private sealed class Reporter : IPasswordResetFailureReporter
    {
        public string? ErrorType { get; private set; }
        public void EmailDeliveryFailed(string errorType) => ErrorType = errorType;
    }
}
