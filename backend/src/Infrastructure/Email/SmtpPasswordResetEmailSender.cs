using System.Net;
using System.Net.Mail;
using System.Text;
using Application.Features.Auth;
using Microsoft.Extensions.Configuration;

namespace Infrastructure.Email;

public sealed class SmtpPasswordResetEmailSender(IConfiguration configuration) : IPasswordResetEmailSender
{
    private string? Host => configuration["PasswordReset:Smtp:Host"];
    private string? From => configuration["PasswordReset:Smtp:From"];

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(Host) &&
        !string.IsNullOrWhiteSpace(From) &&
        int.TryParse(configuration["PasswordReset:Smtp:Port"], out var port) &&
        port is >= 1 and <= 65535 &&
        IsValidSender(From) &&
        (UseSsl || Host is "localhost" or "127.0.0.1" or "::1") &&
        (string.IsNullOrEmpty(configuration["PasswordReset:Smtp:Username"]) ==
        string.IsNullOrEmpty(configuration["PasswordReset:Smtp:Password"]));

    private bool UseSsl => !bool.TryParse(configuration["PasswordReset:Smtp:EnableSsl"], out var ssl) || ssl;

    public async Task SendAsync(string email, string resetUrl, CancellationToken cancellationToken)
    {
        if (!IsConfigured)
            throw new InvalidOperationException("Password reset SMTP is not configured.");

        using var message = new MailMessage(new MailAddress(From!), new MailAddress(email))
        {
            Subject = "Đặt lại mật khẩu Vegetarian Support",
            Body = $"Dùng liên kết sau để đặt lại mật khẩu trong 20 phút:\n{resetUrl}\n\nNếu bạn không yêu cầu, hãy bỏ qua email này.",
            IsBodyHtml = false,
            BodyEncoding = Encoding.UTF8,
            SubjectEncoding = Encoding.UTF8
        };
        using var client = new SmtpClient(Host!, int.Parse(configuration["PasswordReset:Smtp:Port"]!))
        {
            EnableSsl = UseSsl,
            DeliveryMethod = SmtpDeliveryMethod.Network,
            UseDefaultCredentials = false,
            Timeout = 15000
        };
        var username = configuration["PasswordReset:Smtp:Username"];
        if (!string.IsNullOrEmpty(username))
            client.Credentials = new NetworkCredential(username, configuration["PasswordReset:Smtp:Password"]);
        await client.SendMailAsync(message, cancellationToken);
    }

    private static bool IsValidSender(string? address)
    {
        try { return new MailAddress(address!).Address == address; }
        catch (FormatException) { return false; }
    }
}
