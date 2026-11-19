using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CoreDataChecks;

internal static class HistoryDeletionChecks
{
    public static async Task RunAsync(HttpClient client, AppDbContext db, Action<bool, string> check)
    {
        var owner = User.Register("History owner", "history-owner@example.test", "test", DateTimeOffset.UtcNow);
        var other = User.Register("Other owner", "history-other@example.test", "test", DateTimeOffset.UtcNow);
        var conversation = AiChatConversation.Create(owner.Id, DateTimeOffset.UtcNow);
        var retained = AiChatConversation.Create(owner.Id, DateTimeOffset.UtcNow);
        var scan = FoodScanRecord.Create(owner.Id, "Dish", "{}", "{}", "{}");
        var otherScan = FoodScanRecord.Create(other.Id, "Dish", "{}", "{}", "{}");
        db.Users.AddRange(owner, other);
        db.Set<AiChatConversation>().AddRange(conversation, retained);
        db.Set<AiChatMessage>().Add(AiChatMessage.Create(conversation.Id, AiChatMessageRole.User, "A saved question", DateTimeOffset.UtcNow));
        db.FoodScanRecords.AddRange(scan, otherScan);
        await db.SaveChangesAsync();
        var savedRole = client.DefaultRequestHeaders.TryGetValues("Test-Role", out var roles) ? roles.ToArray() : [];
        var savedUser = client.DefaultRequestHeaders.TryGetValues("Test-UserId", out var users) ? users.ToArray() : [];
        void Caller(string id) {
            client.DefaultRequestHeaders.Remove("Test-Role"); client.DefaultRequestHeaders.Add("Test-Role", "User");
            client.DefaultRequestHeaders.Remove("Test-UserId"); client.DefaultRequestHeaders.Add("Test-UserId", id);
        }
        try
        {
            var chatUrl = $"/api/ai-chat/conversations/{conversation.Id}";
            var scanUrl = $"/api/food-scans/{scan.Id}";
            Caller(other.Id);
            check((await client.DeleteAsync(chatUrl)).StatusCode == HttpStatusCode.NotFound, "other users cannot delete a conversation");
            check((await client.DeleteAsync(scanUrl)).StatusCode == HttpStatusCode.NotFound, "other users cannot delete a food scan");
            check(await db.Set<AiChatMessage>().AnyAsync(x => x.ConversationId == conversation.Id), "failed deletion preserves saved messages");
            Caller(owner.Id);
            check((await client.DeleteAsync(chatUrl)).StatusCode == HttpStatusCode.NoContent, "owner can delete a conversation");
            check(!await db.Set<AiChatMessage>().AnyAsync(x => x.ConversationId == conversation.Id), "conversation deletion removes its messages through cascade");
            check((await client.GetAsync(chatUrl)).StatusCode == HttpStatusCode.NotFound &&
                  (await client.GetAsync(chatUrl + "/messages")).StatusCode == HttpStatusCode.NotFound, "deleted conversation and messages can no longer be read");
            var history = await client.GetFromJsonAsync<JsonElement>("/api/ai-chat/conversations");
            check(history.GetProperty("items").EnumerateArray().All(x => x.GetProperty("id").GetGuid() != conversation.Id), "deleted conversation disappears from history");
            check(await db.Set<AiChatConversation>().AnyAsync(x => x.Id == retained.Id), "unselected conversation remains unchanged");
            check((await client.DeleteAsync(scanUrl)).StatusCode == HttpStatusCode.NoContent, "owner can delete a food scan");
            check((await client.GetAsync(scanUrl)).StatusCode == HttpStatusCode.NotFound && !await db.FoodScanRecords.AnyAsync(x => x.Id == scan.Id), "deleted scan is no longer accessible or stored");
            var scans = await client.GetFromJsonAsync<JsonElement>("/api/food-scans/history");
            check(scans.GetProperty("totalCount").GetInt32() == 0, "scan history count decreases after deletion");
            check(await db.FoodScanRecords.AnyAsync(x => x.Id == otherScan.Id), "deletion preserves another account's history");
        }
        finally
        {
            client.DefaultRequestHeaders.Remove("Test-Role"); foreach (var role in savedRole) client.DefaultRequestHeaders.Add("Test-Role", role);
            client.DefaultRequestHeaders.Remove("Test-UserId"); foreach (var id in savedUser) client.DefaultRequestHeaders.Add("Test-UserId", id);
        }
    }
}
