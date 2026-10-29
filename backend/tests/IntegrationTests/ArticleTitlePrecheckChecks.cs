// Kiểm tra HTTP/SQL/worker cho tiền kiểm tiêu đề trên database riêng; provider đếm lượt chỉ phục vụ kiểm thử.
using System.Net.Http.Json;
using System.Text.Json;
using Application.Abstractions.AI;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Persistence;

namespace CoreDataChecks;

internal static class ArticleTitlePrecheckChecks
{
    public static async Task RunAsync(HttpClient client, AppDbContext db, TitlePrecheckAiProbe ai, Action<bool, string> check)
    {
        var owner = User.Register("Title precheck tester", "title-precheck@example.test", "test-only-hash", DateTimeOffset.UtcNow);
        db.Users.Add(owner);
        await db.SaveChangesAsync();
        void Caller(string role) { client.DefaultRequestHeaders.Remove("Test-Role"); client.DefaultRequestHeaders.Add("Test-Role", role);
            client.DefaultRequestHeaders.Remove("Test-UserId"); client.DefaultRequestHeaders.Add("Test-UserId", owner.Id); }
        Caller("User");
        async Task<Guid> Create(string title)
        {
            var response = await client.PostAsJsonAsync("/api/me/articles", new {title, content="<p>Rửa rau sạch và luộc chín.</p>", category="Ẩm thực", dietaryType="Vegan"});
            check(response.IsSuccessStatusCode, "create article draft for title precheck");
            return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();
        }
        async Task<JsonElement> Submit(Guid id)
        {
            var response = await client.PostAsync($"/api/me/articles/{id}/submit", null);
            check(response.IsSuccessStatusCode, "submit returns stored article even when system rejects title");
            return await response.Content.ReadFromJsonAsync<JsonElement>();
        }
        async Task<JsonElement> Wait(Guid id)
        {
            for (var attempt=0; attempt<40; attempt++)
            {
                var result = await client.GetFromJsonAsync<JsonElement>($"/api/me/articles/{id}");
                if (result.GetProperty("versions")[0].GetProperty("aiStatus").GetString() != "Checking") return result;
                await Task.Delay(250);
            }
            throw new TimeoutException("Test worker did not complete title-passed article.");
        }
        var first = await Create("Ăn chay mỗi ngày");
        await Submit(first);
        var accepted = await Wait(first);
        check(ai.Calls == 1 && accepted.GetProperty("status").GetString() == "PendingAdminReview", "unique title proceeds through AI to Admin");
        var pendingTwin = await Create("Ăn chay mỗi ngày");
        await Submit(pendingTwin);
        await Wait(pendingTwin);
        check(ai.Calls == 2, "pending review titles do not reject new submissions");
        Caller("Admin");
        var firstSubmission = accepted.GetProperty("versions")[0].GetProperty("submissionId").GetGuid();
        check((await client.PostAsJsonAsync($"/api/admin/moderation/submissions/{firstSubmission}/decisions", new {decision="Approve",reason="Test approval after AI"})).IsSuccessStatusCode, "Admin approves original after AI");
        Caller("User");
        var duplicate = await Create("  a\u0306n CHAY   mỗi ngày  ");
        var rejected = await Submit(duplicate);
        var version = rejected.GetProperty("versions")[0];
        check(rejected.GetProperty("status").GetString() == "Rejected" && version.GetProperty("aiStatus").GetString() == "NotSubmitted", "normalized duplicate rejects before AI");
        check(ai.Calls == 2 && version.GetProperty("systemRejectionReason").GetString()?.Contains("trùng") == true, "reason returned to author without consuming AI call");
        check(version.GetProperty("aiSummary").ValueKind == JsonValueKind.Null && version.GetProperty("adminFeedback").ValueKind == JsonValueKind.Null, "system rejection is not fake AI or Admin feedback");
        var mine = await client.GetFromJsonAsync<JsonElement>("/api/me/articles?status=Rejected");
        check(mine.GetProperty("items").EnumerateArray().Any(item => item.GetProperty("id").GetGuid() == duplicate), "rejected article remains in author's management list");
        Caller("Admin");
        var submissionId = version.GetProperty("submissionId").GetGuid();
        var admin = await client.GetFromJsonAsync<JsonElement>($"/api/admin/moderation/submissions/{submissionId}");
        check(admin.GetProperty("systemRejectionReason").GetString() == version.GetProperty("systemRejectionReason").GetString(), "Admin receives actual system rejection reason");
        check(!(await client.PostAsJsonAsync($"/api/admin/moderation/submissions/{submissionId}/decisions", new {decision="Approve",reason="Cannot override precheck rejection"})).IsSuccessStatusCode, "Admin cannot approve duplicate without corrected resubmission");
        Caller("User");
        async Task Update(Guid id,string title) => check((await client.PutAsJsonAsync($"/api/me/articles/{id}",new {title,content="<p>Nội dung cập nhật về nấu rau.</p>",category="Ẩm thực",dietaryType="Vegan"})).IsSuccessStatusCode, "owner can edit eligible article");
        await Update(duplicate,"Một tiêu đề riêng");
        await Submit(duplicate);
        var resubmitted = await Wait(duplicate);
        check(ai.Calls == 3 && resubmitted.GetProperty("versions")[0].GetProperty("systemRejectionReason").ValueKind == JsonValueKind.Null, "corrected title gets a new version and AI check");
        await Update(first,"Ăn chay mỗi ngày");
        await Submit(first);
        await Wait(first);
        check(ai.Calls == 4, "same article can retain its own published title");
        await Create("Tiêu đề chỉ có nháp");
        var freeTitle = await Create("Tiêu đề chỉ có nháp");
        await Submit(freeTitle);
        await Wait(freeTitle);
        check(ai.Calls == 5, "unsubmitted drafts do not reserve titles");
        var concurrentFirst = await Create("Cùng một tiêu đề đồng thời");
        var concurrentSecond = await Create("CÙNG MỘT TIÊU ĐỀ ĐỒNG THỜI");
        var results = await Task.WhenAll(Submit(concurrentFirst), Submit(concurrentSecond));
        check(results.All(item => item.GetProperty("status").GetString() != "Rejected"), "unpublished concurrent titles are not treated as approved duplicates");
        await Wait(concurrentFirst); await Wait(concurrentSecond);
        check(ai.Calls == 7, "both titles pass precheck when neither is approved yet");
        var publishedDuplicateA = await Create("Ăn chay mỗi ngày");
        var publishedDuplicateB = await Create("ĂN CHAY MỖI NGÀY");
        var publishedResults = await Task.WhenAll(Submit(publishedDuplicateA),Submit(publishedDuplicateB));
        check(publishedResults.All(item => item.GetProperty("status").GetString() == "Rejected") && ai.Calls == 7, "concurrent copies of approved title are both rejected before AI");
    }
}

internal sealed class TitlePrecheckAiProbe : IGeminiService
{
    private int calls;
    public int Calls => Volatile.Read(ref calls);
    public Task<GeminiModerationResponse> CheckContentAsync(GeminiModerationRequest request, CancellationToken ct)
    {
        Interlocked.Increment(ref calls);
        return Task.FromResult(new GeminiModerationResponse(true,AiFlagStatus.Passed,"Nội dung tổng hợp đã kiểm tra.","Văn bản",null));
    }
    public Task<GeminiChatResponse> GenerateChatReplyAsync(GeminiChatRequest request,CancellationToken ct)=>throw new NotSupportedException();
    public Task<GeminiDishImageResponse> AnalyzeDishImageAsync(GeminiDishImageRequest request,CancellationToken ct)=>throw new NotSupportedException();
    public Task<GeminiLabelResponse> ReadIngredientLabelAsync(GeminiDishImageRequest request,CancellationToken ct)=>throw new NotSupportedException();
}
