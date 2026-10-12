using System.Security.Claims;
using Api.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;

namespace Domain.Tests;

public sealed class AccountAuthorizationTests
{
    [Fact]
    public async Task AdminPolicyRequiresAuthenticatedAdminWithSubject()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddAuthorization(AccountAuthorization.AddAccountPolicies);
        using var provider = services.BuildServiceProvider();
        var authorization = provider.GetRequiredService<IAuthorizationService>();

        Assert.False((await authorization.AuthorizeAsync(new ClaimsPrincipal(), null,
            AccountAuthorization.AdminPolicy)).Succeeded);
        Assert.False((await authorization.AuthorizeAsync(Principal("User", "user-id"), null,
            AccountAuthorization.AdminPolicy)).Succeeded);
        Assert.False((await authorization.AuthorizeAsync(Principal("Admin", null), null,
            AccountAuthorization.AdminPolicy)).Succeeded);
        Assert.True((await authorization.AuthorizeAsync(Principal("Admin", "admin-id"), null,
            AccountAuthorization.AdminPolicy)).Succeeded);
    }

    [Fact]
    public void OwnershipUsesAuthenticatedSubjectOnly()
    {
        var admin = Principal("Admin", "admin-id");
        Assert.Equal("admin-id", admin.GetUserId());
        Assert.True(admin.HasRole("Admin"));
        Assert.True(admin.Owns("admin-id"));
        Assert.False(admin.Owns("other-id"));
        Assert.False(new ClaimsPrincipal(new ClaimsIdentity(
            [new Claim("sub", "admin-id")])).Owns("admin-id"));
        Assert.False(new ClaimsPrincipal(new ClaimsIdentity(
            [new Claim("sub", "admin-id"), new Claim("sub", "other-id")], "Test"))
            .Owns("admin-id"));
    }

    private static ClaimsPrincipal Principal(string role, string? userId)
    {
        var claims = new List<Claim> { new(ClaimTypes.Role, role) };
        if (userId is not null) claims.Add(new Claim("sub", userId));
        return new ClaimsPrincipal(new ClaimsIdentity(claims, "Test"));
    }
}
