using System.Net;
using System.Net.Http.Json;
using Application.Features.Auth;

namespace CoreDataChecks;

public sealed class CapturingResetEmailSender : IPasswordResetEmailSender
{
    public bool IsConfigured => true;
    public string? LastEmail { get; private set; }
    public string? LastUrl { get; private set; }
    public Task SendAsync(string email, string resetUrl, CancellationToken cancellationToken)
    {
        LastEmail = email;
        LastUrl = resetUrl;
        return Task.CompletedTask;
    }
}

public static class PasswordResetApiChecks
{
    public static async Task RunAsync(HttpClient client, CapturingResetEmailSender sender,
        Action<bool, string> check)
    {
        const string email = "api-reset@example.invalid";
        var registration = await client.PostAsJsonAsync("/api/auth/register", new
        {
            fullName = "API reset test", email, password = "old-password",
            confirmPassword = "old-password"
        });
        check(registration.StatusCode == HttpStatusCode.Created,
            $"auth registration before reset ({(int)registration.StatusCode})");

        var known = await client.PostAsJsonAsync("/api/auth/forgot-password", new { email });
        var knownBody = await known.Content.ReadAsStringAsync();
        check(known.StatusCode == HttpStatusCode.Accepted && sender.LastEmail == email,
            $"forgot password sends email to known account ({(int)known.StatusCode}, sent={sender.LastEmail == email})");
        var unknown = await client.PostAsJsonAsync("/api/auth/forgot-password", new
        {
            email = "missing-reset@example.invalid"
        });
        check(unknown.StatusCode == HttpStatusCode.Accepted &&
              await unknown.Content.ReadAsStringAsync() == knownBody,
            "forgot password does not reveal account existence");

        var token = sender.LastUrl!.Split("?token=")[1];
        var reset = await client.PostAsJsonAsync("/api/auth/reset-password", new
        {
            token, newPassword = "new-password", confirmPassword = "new-password"
        });
        check(reset.StatusCode == HttpStatusCode.NoContent, "reset endpoint changes password");
        check((await client.PostAsJsonAsync("/api/auth/reset-password", new
        {
            token, newPassword = "another-password", confirmPassword = "another-password"
        })).StatusCode == HttpStatusCode.BadRequest, "reset endpoint rejects reused token");
        check((await client.PostAsJsonAsync("/api/auth/login", new
        {
            email, password = "old-password"
        })).StatusCode == HttpStatusCode.Unauthorized, "old password rejected after reset");
        check((await client.PostAsJsonAsync("/api/auth/login", new
        {
            email, password = "new-password"
        })).StatusCode == HttpStatusCode.OK, "new password accepted after reset");
    }
}
