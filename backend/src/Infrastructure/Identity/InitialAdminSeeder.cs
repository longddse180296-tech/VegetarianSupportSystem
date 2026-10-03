using Application.Features.Auth;
using Domain.Entities;
using System.ComponentModel.DataAnnotations;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure.Identity;

public static class InitialAdminSeeder
{
    public static async Task SeedAsync(IServiceProvider services, IConfiguration configuration, CancellationToken cancellationToken)
    {
        if (!configuration.GetValue<bool>("InitialAdmin:Enabled")) return;

        var fullName = configuration["InitialAdmin:FullName"]?.Trim();
        var email = configuration["InitialAdmin:Email"]?.Trim();
        var password = configuration["InitialAdmin:Password"];
        if (string.IsNullOrWhiteSpace(fullName) || string.IsNullOrWhiteSpace(email) ||
            !new EmailAddressAttribute().IsValid(email) ||
            password is null || password.Length is < 12 or > 128)
            throw new InvalidOperationException("InitialAdmin requires FullName, Email, and a 12-128 character Password from a secret source.");

        using var scope = services.CreateScope();
        var accounts = scope.ServiceProvider.GetRequiredService<IUserAccountRepository>();
        if (await accounts.HasAdminAsync(cancellationToken)) return;
        if (await accounts.FindByEmailAsync(email.ToUpperInvariant(), cancellationToken) is not null)
            throw new InvalidOperationException("InitialAdmin email belongs to an existing account.");

        var hasher = scope.ServiceProvider.GetRequiredService<IAccountPasswordHasher>();
        var admin = User.CreateInitialAdmin(fullName, email, hasher.Hash(password), DateTimeOffset.UtcNow);
        await accounts.AddAsync(admin, cancellationToken);
    }
}
