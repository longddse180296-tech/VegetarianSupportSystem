using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace Api.Authorization;

public static class AccountAuthorization
{
    public const string AdminPolicy = "ActiveAdmin";

    public static void AddAccountPolicies(AuthorizationOptions options)
    {
        options.AddPolicy(AdminPolicy, policy => policy.RequireAuthenticatedUser()
            .RequireAssertion(context => context.User.HasRole("Admin")));
    }

    public static string? GetUserId(this ClaimsPrincipal principal)
    {
        if (principal.Identity?.IsAuthenticated != true) return null;
        var subjects = principal.FindAll("sub").ToArray();
        return subjects.Length == 1 && !string.IsNullOrWhiteSpace(subjects[0].Value)
            ? subjects[0].Value : null;
    }

    public static bool HasRole(this ClaimsPrincipal principal, string role) =>
        principal.GetUserId() is not null && principal.IsInRole(role);

    public static bool Owns(this ClaimsPrincipal principal, string ownerUserId) =>
        principal.GetUserId() is { } userId &&
        string.Equals(userId, ownerUserId, StringComparison.Ordinal);
}
