using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Application.Abstractions.AI;
using Domain.Enums;
using Infrastructure.AI.Gemini;
using Microsoft.Extensions.Configuration;
using Application.Features.Media;

namespace Domain.Tests;

// Kiểm tra hợp đồng với Gemini bằng HTTP giả lập; không dùng API key thật hay nội dung của người dùng.
public sealed class GeminiModerationTests
{
    [Fact]
    public async Task SeparateModerationKeyDoesNotChangeChatScanOrOcrKey()
    {
        using var handler = new ProviderHandler("STOP");
        using var client = new HttpClient(handler);
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        { ["Gemini:ApiKey"] = "common-test-key", ["Gemini:ModerationApiKey"] = "article-test-key", ["Gemini:ModerationModel"] = "gemini-3.8-flash" }).Build();
        var service = new GeminiService(client, config);
        await service.CheckContentAsync(new(ModeratedContentType.Article, "Rau luộc", "Rửa rau.", []));
        Assert.Contains("gemini-3.8-flash", handler.ModelUrls[0]);
        using (var moderationPayload = JsonDocument.Parse(handler.Payload!))
            Assert.Equal("low", moderationPayload.RootElement.GetProperty("generationConfig").GetProperty("thinkingConfig").GetProperty("thinkingLevel").GetString());
        await service.GenerateChatReplyAsync(new("Cách luộc rau?", []));
        await service.AnalyzeDishImageAsync(new([1, 2, 3], "image/png"));
        await service.ReadIngredientLabelAsync(new([1, 2, 3], "image/png"));
        Assert.Equal(new[] { "article-test-key", "common-test-key", "common-test-key", "common-test-key" }, handler.KeysUsed);
        Assert.All(handler.ModelUrls.Skip(1), url => Assert.Contains("gemini-2.5-flash", url));
    }

    [Fact]
    public async Task ModerationCanUseOwnKeyWithoutCommonKeyAndFallbackKeepsIt()
    {
        using var handler = new ProviderHandler("SAFETY", imageOnlyBlock: true);
        using var client = new HttpClient(handler);
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        { ["Gemini:ModerationApiKey"] = "article-only-test-key" }).Build();
        var service = new GeminiService(client, config, new CoverStore());
        var result = await service.CheckContentAsync(new(ModeratedContentType.Article, "Rau luộc", "Rửa rau.", [CoverUrl]));
        Assert.Equal(AiFlagStatus.Partial, result.AiFlagStatus);
        Assert.Equal(new[] { "article-only-test-key", "article-only-test-key" }, handler.KeysUsed);
        var chat = await service.GenerateChatReplyAsync(new("Cách luộc rau?", []));
        Assert.Equal("NotConfigured", chat.ErrorCode);
    }

    [Fact]
    public void RateLimitMessageIsDistinctFromSafetyBlock()
    {
        var rateLimit = ModerationFailureMessage.For("ProviderHttp429");
        Assert.Contains("hạn mức", rateLimit);
        Assert.Contains("không phải kết luận ảnh vi phạm", rateLimit);
        Assert.DoesNotContain("bộ lọc an toàn", rateLimit);
        Assert.Contains("bộ lọc an toàn", ModerationFailureMessage.For("ProviderSafetyBlocked"));
    }

    [Fact]
    public async Task JsonModerationDisablesThinkingForConfiguredFlashModel()
    {
        using var handler = new ProviderHandler("STOP");
        using var client = new HttpClient(handler);
        var service = CreateService(client);
        var result = await service.CheckContentAsync(new(ModeratedContentType.Article, "Rau luộc", "Rửa rau và luộc chín.", []));
        Assert.True(result.IsAvailable);
        Assert.Equal(AiFlagStatus.Passed, result.AiFlagStatus);
        using var payload = JsonDocument.Parse(handler.Payload!);
        Assert.Equal(0, payload.RootElement.GetProperty("generationConfig").GetProperty("thinkingConfig").GetProperty("thinkingBudget").GetInt32());
        var schema = payload.RootElement.GetProperty("generationConfig").GetProperty("responseSchema");
        Assert.Equal(new[] { "Passed", "Flagged", "Partial" }, schema.GetProperty("properties").GetProperty("status").GetProperty("enum").EnumerateArray().Select(value => value.GetString()));
        Assert.Equal("STRING", schema.GetProperty("properties").GetProperty("checkedScope").GetProperty("type").GetString());
    }

    [Fact]
    public async Task TruncatedProviderResultHasExplicitDiagnosticCode()
    {
        using var handler = new ProviderHandler("MAX_TOKENS");
        using var client = new HttpClient(handler);
        var result = await CreateService(client).CheckContentAsync(new(ModeratedContentType.Article, "Rau luộc", "Rửa rau.", []));
        Assert.False(result.IsAvailable);
        Assert.Equal("OutputTokenLimit", result.ErrorCode);
    }

    [Fact]
    public async Task AttachedImageIsReportedAsUncheckedRatherThanPassed()
    {
        using var handler = new ProviderHandler("STOP");
        using var client = new HttpClient(handler);
        var result = await CreateService(client).CheckContentAsync(new(ModeratedContentType.Article, "Rau luộc", "Rửa rau.", ["image.jpg"]));
        Assert.True(result.IsAvailable);
        Assert.Equal(AiFlagStatus.Partial, result.AiFlagStatus);
        Assert.False(string.IsNullOrWhiteSpace(result.UncheckedScope));
    }

    [Theory]
    [InlineData("{\"status\":\"NotFlagged\",\"summary\":\"Không có cờ.\",\"checkedScope\":\"Văn bản\"}", "InvalidModerationStatus")]
    [InlineData("{\"status\":\"Passed\",\"summary\":\"Đã xem.\",\"checkedScope\":[\"Spam\"]}", "InvalidModerationResponse")]
    [InlineData("{\"status\":\"Passed\",\"summary\":\"Đã xem.\",\"checkedScope\":\"Văn bản\",\"uncheckedScope\":\"Một phần chưa xem\"}", "InvalidModerationResponse")]
    [InlineData("{\"status\":\"Passed\",\"summary\":\"Đã xem.\",\"checkedScope\":\"Văn bản\",\"flagReason\":\"Có vi phạm\"}", "InvalidModerationResponse")]
    [InlineData("{\"status\":\"Flagged\",\"summary\":\"Cần xem\",\"checkedScope\":\"Văn bản\",\"flagReason\":\"Cờ\",\"flagType\":\"HealthClaim\",\"priority\":\"High\",\"evidence\":\"Trích đoạn không có thật\"}", "UnsupportedEvidence")]
    [InlineData("[]", "InvalidModerationResponse")]
    public async Task InvalidOutputCannotBeRecordedAsPassed(string json, string code)
    {
        using var handler = new ProviderHandler("STOP", json);
        using var client = new HttpClient(handler);
        var result = await CreateService(client).CheckContentAsync(new(ModeratedContentType.Article, "Rau luộc", "Rửa rau.", []));
        Assert.False(result.IsAvailable);
        Assert.Null(result.AiFlagStatus);
        Assert.Equal(code, result.ErrorCode);
    }

    [Fact]
    public async Task HealthClaimKeepsVerbatimEvidenceAndAllowedFlagMetadata()
    {
        const string evidence = "bỏ tất cả thuốc";
        var json = JsonSerializer.Serialize(new { status = "Flagged", summary = "Cần Admin kiểm tra tuyên bố sức khỏe.",
            checkedScope = "Tiêu đề và văn bản.", flagReason = "Khuyên ngừng điều trị.", flagType = "HealthClaim", priority = "High", evidence });
        using var handler = new ProviderHandler("STOP", json);
        using var client = new HttpClient(handler);
        var result = await CreateService(client).CheckContentAsync(new(ModeratedContentType.Article, "Bài kiểm thử", "Hãy bỏ tất cả thuốc đang dùng.", []));
        Assert.True(result.IsAvailable);
        Assert.Equal(AiFlagStatus.Flagged, result.AiFlagStatus);
        Assert.Equal(evidence, result.Evidence);
    }

    [Fact]
    public async Task UploadedCoverBytesAreSentAndImageEvidenceIsClearlyAttributed()
    {
        var json = JsonSerializer.Serialize(new { status = "Flagged", summary = "Ảnh cần xem xét.", checkedScope = "Văn bản và ảnh đại diện",
            flagReason = "Ảnh chứa quảng cáo.", flagType = "InappropriateImage", priority = "High", evidence = "Banner quảng cáo trên ảnh", evidenceSource = "Image" });
        using var handler = new ProviderHandler("STOP", json);
        using var client = new HttpClient(handler);
        var store = new CoverStore();
        var result = await CreateService(client, store).CheckContentAsync(new(ModeratedContentType.Article, "Bài kiểm thử", "Chia sẻ nấu ăn.", [CoverUrl]));
        Assert.True(result.IsAvailable);
        Assert.Equal(AiFlagStatus.Flagged, result.AiFlagStatus);
        Assert.Equal("Ảnh đại diện: Banner quảng cáo trên ảnh", result.Evidence);
        using var payload = JsonDocument.Parse(handler.Payload!);
        var inline = payload.RootElement.GetProperty("contents")[0].GetProperty("parts")[1].GetProperty("inline_data");
        Assert.Equal("image/png", inline.GetProperty("mime_type").GetString());
        Assert.Equal(store.Bytes, Convert.FromBase64String(inline.GetProperty("data").GetString()!));
    }

    [Fact]
    public async Task ReadableCoverDoesNotForcePassedIntoPartial()
    {
        using var handler = new ProviderHandler("STOP");
        using var client = new HttpClient(handler);
        var result = await CreateService(client, new CoverStore()).CheckContentAsync(new(ModeratedContentType.Article, "Rau luộc", "Rửa rau.", [CoverUrl]));
        Assert.True(result.IsAvailable);
        Assert.Equal(AiFlagStatus.Passed, result.AiFlagStatus);
        Assert.Null(result.UncheckedScope);
    }

    [Theory]
    [InlineData("http://169.254.169.254/latest/meta-data/")]
    [InlineData("file:///etc/passwd")]
    [InlineData("/api/public-images/../../secret.png")]
    public async Task ArbitraryReferencesAreNotFetchedOrRead(string reference)
    {
        using var handler = new ProviderHandler("STOP");
        using var client = new HttpClient(handler);
        var store = new CoverStore();
        var result = await CreateService(client, store).CheckContentAsync(new(ModeratedContentType.Article, "Rau luộc", "Rửa rau.", [reference]));
        Assert.Equal(AiFlagStatus.Partial, result.AiFlagStatus);
        Assert.Equal(0, store.Reads);
        Assert.DoesNotContain("inline_data", handler.Payload);
    }

    [Fact]
    public async Task ImageEvidenceWithoutImageBytesIsRejected()
    {
        var json = JsonSerializer.Serialize(new { status = "Flagged", summary = "Cờ", checkedScope = "Văn bản", flagReason = "Ảnh", flagType = "InappropriateImage",
            priority = "High", evidence = "Không có ảnh để xem", evidenceSource = "Image" });
        using var handler = new ProviderHandler("STOP", json);
        using var client = new HttpClient(handler);
        var result = await CreateService(client).CheckContentAsync(new(ModeratedContentType.Article, "Rau luộc", "Rửa rau.", []));
        Assert.False(result.IsAvailable);
        Assert.Equal("UnsupportedEvidence", result.ErrorCode);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task UnreadableOrOversizedCoverRemainsUnchecked(bool oversized)
    {
        using var handler = new ProviderHandler("STOP");
        using var client = new HttpClient(handler);
        var store = new CoverStore { Bytes = oversized ? new byte[10 * 1024 * 1024 + 1] : [1, 2, 3] };
        var result = await CreateService(client, store).CheckContentAsync(new(ModeratedContentType.Article, "Rau luộc", "Rửa rau.", [CoverUrl]));
        Assert.Equal(AiFlagStatus.Partial, result.AiFlagStatus);
        Assert.DoesNotContain("inline_data", handler.Payload);
    }

    [Fact]
    public async Task ProviderSafetyBlockCannotBecomePassed()
    {
        using var handler = new ProviderHandler("SAFETY");
        using var client = new HttpClient(handler);
        var result = await CreateService(client, new CoverStore()).CheckContentAsync(new(ModeratedContentType.Article, "Rau luộc", "Rửa rau.", [CoverUrl]));
        Assert.False(result.IsAvailable);
        Assert.Equal("ProviderSafetyBlocked", result.ErrorCode);
    }

    [Fact]
    public async Task BlockedImageKeepsCompletedTextCheckAndDisclosesUncheckedImage()
    {
        using var handler = new ProviderHandler("SAFETY", imageOnlyBlock: true);
        using var client = new HttpClient(handler);
        var result = await CreateService(client, new CoverStore()).CheckContentAsync(new(ModeratedContentType.Article, "Rau luộc", "Rửa rau.", [CoverUrl]));
        Assert.True(result.IsAvailable);
        Assert.Equal(AiFlagStatus.Partial, result.AiFlagStatus);
        Assert.Contains("Ảnh đại diện chưa có kết quả", result.UncheckedScope);
        Assert.Null(result.FlagReason);
        Assert.Equal(2, handler.Calls);
        Assert.DoesNotContain("inline_data", handler.Payload);
    }

    [Fact]
    public async Task BlockedImageDoesNotDiscardWarningFoundInText()
    {
        var json = JsonSerializer.Serialize(new { status = "Flagged", summary = "Cần xem văn bản.", checkedScope = "Văn bản", flagReason = "Khuyên ngừng thuốc.",
            flagType = "HealthClaim", priority = "High", evidence = "bỏ tất cả thuốc", evidenceSource = "Text" });
        using var handler = new ProviderHandler("SAFETY", json, imageOnlyBlock: true);
        using var client = new HttpClient(handler);
        var result = await CreateService(client, new CoverStore()).CheckContentAsync(new(ModeratedContentType.Article, "Rau luộc", "Hãy bỏ tất cả thuốc.", [CoverUrl]));
        Assert.Equal(AiFlagStatus.Partial, result.AiFlagStatus);
        Assert.Equal("HealthClaim", result.FlagType);
        Assert.Equal("bỏ tất cả thuốc", result.Evidence);
        Assert.NotNull(result.FlagReason);
    }

    private const string CoverUrl = "http://localhost:5173/api/public-images/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.png";
    private sealed class CoverStore : IPublicImageStore
    {
        public byte[] Bytes { get; init; } = [137, 80, 78, 71, 13, 10, 26, 10, 0];
        public int Reads { get; private set; }
        public Task<Stream?> OpenReadAsync(string key, CancellationToken ct) { Reads++; return Task.FromResult<Stream?>(new MemoryStream(Bytes)); }
        public Task<string> SaveAsync(Stream source, string extension, long maxBytes, CancellationToken ct) => throw new NotSupportedException();
    }

    private static GeminiService CreateService(HttpClient client, IPublicImageStore? store = null) => new(client,
        new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        { ["Gemini:ApiKey"] = "test-only-key", ["Gemini:Model"] = "gemini-2.5-flash" }).Build(), store);

    private sealed class ProviderHandler(string finishReason, string? output = null, bool imageOnlyBlock = false) : HttpMessageHandler
    {
        public string? Payload { get; private set; }
        public int Calls { get; private set; }
        public List<string?> KeysUsed { get; } = [];
        public List<string> ModelUrls { get; } = [];
        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
        {
            Payload = await request.Content!.ReadAsStringAsync(ct);
            Calls++;
            ModelUrls.Add(request.RequestUri!.AbsoluteUri);
            KeysUsed.Add(request.Headers.TryGetValues("x-goog-api-key", out var keys) ? keys.Single() : null);
            var effectiveReason = imageOnlyBlock && !Payload.Contains("inline_data", StringComparison.Ordinal) ? "STOP" : finishReason;
            var text = output ?? (finishReason == "MAX_TOKENS" ? "{\"status\":" : "{\"status\":\"Passed\",\"summary\":\"Đã kiểm tra văn bản.\",\"checkedScope\":\"Tiêu đề và nội dung.\"}");
            return new(HttpStatusCode.OK) { Content = JsonContent.Create(new { candidates = new[] { new { finishReason = effectiveReason, content = new { parts = new[] { new { text } } } } } }) };
        }
    }
}
