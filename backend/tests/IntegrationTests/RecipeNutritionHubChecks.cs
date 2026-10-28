using System.Net;
using System.Net.Http.Json;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using Domain.Entities;
using Infrastructure.Persistence;

namespace CoreDataChecks;

internal static class RecipeNutritionHubChecks
{
    public static async Task RunAsync(HttpClient client, AppDbContext db, Action<bool, string> check)
    {
        const string route = "/api/hubs/recipe-nutrition";
        client.DefaultRequestHeaders.Remove("Test-Role");
        check((await client.PostAsync(route + "/negotiate?negotiateVersion=1", null)).StatusCode == HttpStatusCode.Unauthorized,
            "nutrition hub rejects Guest");
        client.DefaultRequestHeaders.Add("Test-Role", "User");
        check((await client.PostAsync(route + "/negotiate?negotiateVersion=1", null)).StatusCode == HttpStatusCode.Forbidden,
            "nutrition hub rejects User");
        client.DefaultRequestHeaders.Remove("Test-Role");
        client.DefaultRequestHeaders.Add("Test-Role", "Admin");
        var admin = User.CreateInitialAdmin("Nutrition admin", "nutrition-session@example.test", "test-only-hash", DateTimeOffset.UtcNow);
        db.Users.Add(admin);
        await db.SaveChangesAsync();
        client.DefaultRequestHeaders.Add("Test-UserId", admin.Id);
        var negotiation = await client.PostAsync(route + "/negotiate?negotiateVersion=1", null);
        check(negotiation.IsSuccessStatusCode, "Admin can negotiate SignalR nutrition hub");
        var document = (await negotiation.Content.ReadFromJsonAsync<JsonElement>());
        var item = new Ingredient
        {
            Name = "SignalR nutrition fixture", DefaultUnit = "g", NutritionBasisUnit = "g", NutritionBasisQuantity = 100,
            Calories = 100, ProteinGram = 10, CarbohydrateGram = 20, FatGram = 0
        };
        db.Ingredients.Add(item);
        var volume = new Ingredient {Name="Volume fixture",DefaultUnit="ml",NutritionBasisUnit="ml",NutritionBasisQuantity=100,
            Calories=200,ProteinGram=10,CarbohydrateGram=20,FatGram=0};
        var count = new Ingredient {Name="Count fixture",DefaultUnit="đơn vị",NutritionBasisUnit="đơn vị",NutritionBasisQuantity=1,
            Calories=200,ProteinGram=10,CarbohydrateGram=20,FatGram=0};
        db.Ingredients.AddRange(volume,count);
        await db.SaveChangesAsync();
        using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(15));
        using var socket = new ClientWebSocket();
        socket.Options.SetRequestHeader("Test-Role", "Admin");
        socket.Options.SetRequestHeader("Test-UserId", admin.Id);
        var address = new UriBuilder(client.BaseAddress!)
        {
            Scheme = "ws", Path = route,
            Query = "id=" + Uri.EscapeDataString(document.GetProperty("connectionToken").GetString()!)
        };
        await socket.ConnectAsync(address.Uri, timeout.Token);
        await SendAsync(socket, "{\"protocol\":\"json\",\"version\":1}", timeout.Token);
        await ReceiveAsync(socket, timeout.Token); // SignalR JSON handshake.
        foreach (var (quantity, servings, expected) in new[] { (100, 1, 100), (200, 1, 200), (200, 2, 100) })
        {
            var command = JsonSerializer.Serialize(new
            {
                type = 1, invocationId = Guid.NewGuid().ToString("N"), target = "Calculate",
                arguments = new[] { new { servings, ingredients = new[] { new { ingredientId = item.Id, quantity, unit = "g" } } } }
            });
            await SendAsync(socket, command, timeout.Token);
            var completed = await CompletionAsync(socket, timeout.Token);
            var result = completed.GetProperty("result");
            check(result.GetProperty("isComplete").GetBoolean() && result.GetProperty("caloriesPerServing").GetDecimal() == expected,
                $"SignalR calculates updated quantity/servings on same connection: {quantity}g/{servings}");
        }
        // Kiểm tra realtime dùng đúng mốc ml/số lượng, không áp gam cho mọi nguyên liệu.
        foreach (var (ingredient,quantity,servings,expected) in new[] {
            (volume,50m,1,100m),(volume,250m,2,250m),(count,2m,1,400m),(count,0.5m,1,100m) })
        {
            await SendAsync(socket,JsonSerializer.Serialize(new {
                type=1, invocationId=Guid.NewGuid().ToString("N"), target="Calculate",
                arguments=new[] {new {servings,ingredients=new[] {new {ingredientId=ingredient.Id,quantity,unit=ingredient.DefaultUnit}}}}
            }),timeout.Token);
            var result=(await CompletionAsync(socket,timeout.Token)).GetProperty("result");
            check(result.GetProperty("isComplete").GetBoolean() && result.GetProperty("caloriesPerServing").GetDecimal()==expected,
                $"SignalR uses stored {ingredient.DefaultUnit} basis directly: {quantity}/{servings}");
        }
        await socket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Test completed", timeout.Token);
        client.DefaultRequestHeaders.Remove("Test-UserId");
    }

    private static async Task SendAsync(ClientWebSocket socket, string json, CancellationToken ct) =>
        await socket.SendAsync(Encoding.UTF8.GetBytes(json + '\u001e').AsMemory(), WebSocketMessageType.Text, true, ct);

    private static async Task<string> ReceiveAsync(ClientWebSocket socket, CancellationToken ct)
    {
        using var data = new MemoryStream();
        var buffer = new byte[8192];
        ValueWebSocketReceiveResult received;
        do
        {
            received = await socket.ReceiveAsync(buffer.AsMemory(), ct);
            if (received.MessageType == WebSocketMessageType.Close) throw new InvalidOperationException("SignalR closed before completion.");
            data.Write(buffer, 0, received.Count);
        } while (!received.EndOfMessage);
        return Encoding.UTF8.GetString(data.ToArray());
    }

    private static async Task<JsonElement> CompletionAsync(ClientWebSocket socket, CancellationToken ct)
    {
        while (true)
            foreach (var record in (await ReceiveAsync(socket, ct)).Split('\u001e', StringSplitOptions.RemoveEmptyEntries))
            {
                var message = JsonSerializer.Deserialize<JsonElement>(record);
                if (message.TryGetProperty("type", out var type) && type.GetInt32() == 3) return message;
            }
    }
}
