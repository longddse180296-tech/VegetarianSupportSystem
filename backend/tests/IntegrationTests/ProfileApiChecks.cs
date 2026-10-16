using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Application.Features.AiChat;
using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CoreDataChecks;

internal static class ProfileApiChecks
{
    public static async Task RunAsync(HttpClient client, AppDbContext db,
        ProfileContextCapture provider, Action<bool, string> check)
    {
        const string path = "/api/profile/me";
        check((await client.GetAsync(path)).StatusCode == HttpStatusCode.Unauthorized, "Profile rejects Guest");
        var user = User.Register("Profile Test", "profile-phase2@example.invalid", "test-only", DateTimeOffset.UtcNow);
        db.Users.Add(user);
        await db.SaveChangesAsync();
        client.DefaultRequestHeaders.Add("Test-Role", "User");
        client.DefaultRequestHeaders.Add("Test-UserId", user.Id);
        var initial = await client.GetFromJsonAsync<JsonElement>(path);
        check(initial.GetProperty("diet").ValueKind == JsonValueKind.Null &&
            initial.GetProperty("bmi").ValueKind == JsonValueKind.Null, "New SQL profile has no fabricated diet or BMI");

        foreach (var diet in new[] { "Vegan", "Lacto", "Ovo", "LactoOvo" })
        {
            var response = await client.PutAsJsonAsync(path, new
            {
                fullName = "Profile SQL Test", phoneNumber = "0912 345 678", diet,
                birthDate = "2000-02-29", sexForEnergyEstimate = "Female",
                heightCm = 170.55m, weightKg = 65.25m,
                activityLevel = "ModeratelyActive", weightGoal = "Maintain", restaurantArea = "Cầu Giấy"
            });
            check(response.StatusCode == HttpStatusCode.OK, $"Profile saves {diet} through HTTP");
            var saved = await client.GetFromJsonAsync<JsonElement>(path);
            check(saved.GetProperty("diet").GetString() == diet &&
                saved.GetProperty("birthDate").GetString() == "2000-02-29" &&
                saved.GetProperty("heightCm").GetDecimal() == 170.55m &&
                saved.GetProperty("restaurantArea").GetString() == "Cầu Giấy",
                $"Profile reads {diet}, exact birth date, decimals and area from SQL");
        }

        var allergy = await client.PostAsJsonAsync(path + "/allergies", new { name = "Đậu phộng" });
        var allergyItem = await allergy.Content.ReadFromJsonAsync<JsonElement>();
        var avoided = await client.PostAsJsonAsync(path + "/avoided-foods", new { name = "Nấm" });
        var avoidedItem = await avoided.Content.ReadFromJsonAsync<JsonElement>();
        check(allergy.StatusCode == HttpStatusCode.Created && avoided.StatusCode == HttpStatusCode.Created,
            "Allergy and avoided food saved separately");
        check((await client.PostAsJsonAsync(path + "/allergies", new { name = "đậu PHỘNG" })).StatusCode == HttpStatusCode.Conflict,
            "Duplicate allergy rejected case-insensitively");
        var preview = await client.PostAsJsonAsync(path + "/body/estimate", new
        {
            birthDate = "2000-02-29", sexForEnergyEstimate = "Female", heightCm = 180.25m,
            weightKg = 65.25m, activityLevel = "ModeratelyActive", weightGoal = "Maintain"
        });
        check(preview.StatusCode == HttpStatusCode.OK &&
            (await client.GetFromJsonAsync<JsonElement>(path)).GetProperty("heightCm").GetDecimal() == 170.55m,
            "Body preview returns estimate without writing SQL profile");

        var conversationResponse = await client.PostAsync("/api/ai-chat/conversations", null);
        var conversation = await conversationResponse.Content.ReadFromJsonAsync<JsonElement>();
        var conversationId = conversation.GetProperty("id").GetGuid();
        var submitted = await client.PostAsJsonAsync($"/api/ai-chat/conversations/{conversationId}/messages", new { content = "Xin chào" });
        check(submitted.StatusCode == HttpStatusCode.OK && provider.Contexts.Count == 1,
            "AI message receives SQL profile through provider test double without Gemini key");
        var savedProfile = await client.GetFromJsonAsync<JsonElement>(path);
        using var data = ContextData(provider.Contexts[0]!);
        check(data.RootElement.GetProperty("diet").GetString() == "LactoOvo" &&
            data.RootElement.GetProperty("bmi").GetDecimal() == savedProfile.GetProperty("bmi").GetDecimal() &&
            data.RootElement.GetProperty("estimatedTdeeKcal").GetInt32() == savedProfile.GetProperty("estimatedTdeeKcal").GetInt32() &&
            data.RootElement.GetProperty("allergies")[0].GetString() == "Đậu phộng" &&
            data.RootElement.GetProperty("avoidedFoods")[0].GetString() == "Nấm",
            "Provider receives same diet, BMI/TDEE and food lists as GET Profile");

        check((await client.PutAsJsonAsync(path + "/diet", new { diet = "Ovo" })).StatusCode == HttpStatusCode.OK,
            "Diet update preserves other saved profile fields");
        await client.PostAsJsonAsync($"/api/ai-chat/conversations/{conversationId}/messages", new { content = "Xin chào" });
        using var latest = ContextData(provider.Contexts.Last()!);
        check(latest.RootElement.GetProperty("diet").GetString() == "Ovo" &&
            latest.RootElement.GetProperty("allergies")[0].GetString() == "Đậu phộng",
            "Next AI message reads updated Profile from SQL");

        check((await client.DeleteAsync(path + "/allergies/" + allergyItem.GetProperty("id").GetGuid())).StatusCode == HttpStatusCode.NoContent &&
            (await client.DeleteAsync(path + "/avoided-foods/" + avoidedItem.GetProperty("id").GetGuid())).StatusCode == HttpStatusCode.NoContent,
            "User can remove saved food entries");
        db.ChangeTracker.Clear();
        var stored = await db.UserProfiles.AsNoTracking().SingleAsync(item => item.UserId == user.Id);
        check(stored.RestaurantArea == "Cầu Giấy", "RestaurantArea remains present in SQL as requested");
    }

    private static JsonDocument ContextData(string context) =>
        JsonDocument.Parse(context[context.IndexOf('{')..(context.LastIndexOf('}') + 1)]);
}

// Registered only by --profile-only in this temporary integration-test host.
internal sealed class ProfileContextCapture : IAiChatAnswerService
{
    public List<string?> Contexts { get; } = [];
    public Task<AiChatAnswerResult> GenerateAsync(string prompt, IReadOnlyList<AiChatTurn> history,
        CancellationToken ct, string? profileContext = null)
    {
        Contexts.Add(profileContext);
        return Task.FromResult(AiChatAnswerResult.Unavailable());
    }
}
