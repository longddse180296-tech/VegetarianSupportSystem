using System.Net;
using System.Net.Sockets;
using System.Text;
using Infrastructure.Email;
using Microsoft.Extensions.Configuration;

namespace CoreDataChecks;

public static class SmtpTransportChecks
{
    public static async Task RunAsync(Action<bool, string> check)
    {
        using var listener = new TcpListener(IPAddress.Loopback, 0);
        listener.Start();
        var port = ((IPEndPoint)listener.LocalEndpoint).Port;
        using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(10));
        var server = ReceiveAsync(listener, timeout.Token);
        var configuration = new ConfigurationManager
        {
            ["PasswordReset:Smtp:Host"] = "127.0.0.1",
            ["PasswordReset:Smtp:Port"] = port.ToString(),
            ["PasswordReset:Smtp:From"] = "noreply@example.invalid",
            ["PasswordReset:Smtp:EnableSsl"] = "false"
        };
        var sender = new SmtpPasswordResetEmailSender(configuration);
        check(sender.IsConfigured, "loopback SMTP is configured for transport test");
        await sender.SendAsync("recipient@example.invalid",
            "http://localhost:5173/#/auth/reset-password?token=TEST", timeout.Token);
        check(await server, "SMTP server received password reset message");
    }

    private static async Task<bool> ReceiveAsync(TcpListener listener, CancellationToken cancellationToken)
    {
        using var client = await listener.AcceptTcpClientAsync(cancellationToken);
        await using var stream = client.GetStream();
        using var reader = new StreamReader(stream, Encoding.ASCII, leaveOpen: true);
        await using var writer = new StreamWriter(stream, Encoding.ASCII, leaveOpen: true)
        {
            NewLine = "\r\n",
            AutoFlush = true
        };
        await writer.WriteLineAsync("220 localhost test SMTP");
        var receivedData = false;
        var inData = false;
        while (await reader.ReadLineAsync(cancellationToken) is { } line)
        {
            if (inData)
            {
                if (line == ".")
                {
                    receivedData = true;
                    inData = false;
                    await writer.WriteLineAsync("250 Message accepted");
                }
                continue;
            }
            if (line.StartsWith("EHLO", StringComparison.OrdinalIgnoreCase))
                await writer.WriteLineAsync("250 localhost");
            else if (line.StartsWith("MAIL FROM:", StringComparison.OrdinalIgnoreCase) ||
                     line.StartsWith("RCPT TO:", StringComparison.OrdinalIgnoreCase))
                await writer.WriteLineAsync("250 OK");
            else if (line.Equals("DATA", StringComparison.OrdinalIgnoreCase))
            {
                inData = true;
                await writer.WriteLineAsync("354 End with <CRLF>.<CRLF>");
            }
            else if (line.Equals("QUIT", StringComparison.OrdinalIgnoreCase))
            {
                await writer.WriteLineAsync("221 Bye");
                break;
            }
            else
                await writer.WriteLineAsync("250 OK");
        }
        return receivedData;
    }
}
