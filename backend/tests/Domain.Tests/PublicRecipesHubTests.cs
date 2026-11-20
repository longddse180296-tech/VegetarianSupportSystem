using System.Net.WebSockets;
using System.Text;
using Api.Hubs;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;

namespace Domain.Tests;

public sealed class PublicRecipesHubTests
{
    [Fact]
    public async Task AnonymousViewersBothReceiveRecipeInvalidationOverWebSockets()
    {
        // Máy chủ test biệt lập, không kết nối hoặc thay đổi database local.
        var builder = WebApplication.CreateBuilder();
        builder.WebHost.UseUrls("http://127.0.0.1:0");
        builder.Services.AddSignalR();
        builder.Services.AddScoped<PublicRecipeUpdates>();
        await using var app = builder.Build();
        app.MapHub<PublicRecipesHub>("/api/hubs/public-recipes");
        await app.StartAsync();
        using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(10));
        using var first = new ClientWebSocket();
        using var second = new ClientWebSocket();
        var url = new Uri(app.Urls.Single().Replace("http://", "ws://") + "/api/hubs/public-recipes");
        foreach (var client in new[] { first, second })
        {
            await client.ConnectAsync(url, timeout.Token);
            await client.SendAsync(Encoding.UTF8.GetBytes("{\"protocol\":\"json\",\"version\":1}\u001e"),
                WebSocketMessageType.Text, true, timeout.Token);
            Assert.Equal("{}\u001e", await ReceiveAsync(client, timeout.Token));
        }
        using var scope = app.Services.CreateScope();
        await scope.ServiceProvider.GetRequiredService<PublicRecipeUpdates>().PublishAsync();
        foreach (var client in new[] { first, second })
        {
            var message = await ReceiveAsync(client, timeout.Token);
            Assert.Contains("\"target\":\"RecipesChanged\"", message);
            Assert.Contains("\"arguments\":[]", message);
        }
        first.Abort();
        second.Abort();
        await app.StopAsync(timeout.Token);
    }

    private static async Task<string> ReceiveAsync(ClientWebSocket client, CancellationToken ct)
    {
        var buffer = new byte[4096];
        var text = new StringBuilder();
        WebSocketReceiveResult result;
        do
        {
            result = await client.ReceiveAsync(new ArraySegment<byte>(buffer), ct);
            Assert.Equal(WebSocketMessageType.Text, result.MessageType);
            text.Append(Encoding.UTF8.GetString(buffer, 0, result.Count));
        } while (!result.EndOfMessage);
        return text.ToString();
    }
}
