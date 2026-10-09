using System.Net.Http.Json;
using System.Net;
using System.Text.Json;
using Application.Abstractions.AI;
using Domain.Enums;
using Microsoft.Extensions.Configuration;

namespace Infrastructure.AI.Gemini;

public sealed class GeminiService(HttpClient httpClient, IConfiguration configuration) : IGeminiService
{
    private const string ApiBase = "https://generativelanguage.googleapis.com/v1beta/models/";
    private readonly string? apiKey = configuration["Gemini:ApiKey"]?.Trim();
    private readonly string model = configuration["Gemini:Model"]?.Trim() is { Length: > 0 } configuredModel
        ? configuredModel
        : "gemini-3.8-flash";
    private readonly string imageModel = configuration["Gemini:ImageModel"]?.Trim() is { Length: > 0 } configuredImageModel
        ? configuredImageModel
        : "gemini-2.5-flash";

    public async Task<GeminiDishImageResponse> AnalyzeDishImageAsync(
        GeminiDishImageRequest request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(apiKey))
            return DishUnavailable("NotConfigured");

        const string prompt = """
            Phân tích ảnh món ăn cho Vegetarian Support. Chỉ gợi ý tên món và nguyên liệu NHÌN THẤY rõ trong ảnh.
            Không đoán nước dùng, nước mắm, dầu hào, mỡ, trứng, sữa, gelatin hoặc thành phần ẩn như thể đã nhìn thấy.
            Nếu ảnh mờ, không phải món ăn, hoặc không đủ thông tin để nhận diện, trả suggestedDishName rỗng và visibleIngredients rỗng.
            Trả duy nhất JSON: {"suggestedDishName":"...","visibleIngredients":["..."],"unknownFactors":["..."],"followUpQuestions":["..."]}.
            unknownFactors nêu thành phần/nguồn gốc cần người dùng kiểm tra. followUpQuestions hỏi ngắn gọn về nước dùng, gia vị và thành phần động vật có thể có theo ngữ cảnh; cho phép trả lời không biết.
            Không đưa kết luận chay, tỷ lệ phần trăm hay cam kết an toàn dị ứng.
            """;
        var imagePart = new Dictionary<string, object>
        {
            ["inline_data"] = new Dictionary<string, string>
            {
                ["mime_type"] = request.MimeType,
                ["data"] = Convert.ToBase64String(request.ImageBytes)
            }
        };
        var result = await GenerateAsync(prompt, cancellationToken, jsonResponse: true, imagePart, imageModel);
        if (!result.IsAvailable || result.Text is null)
            return DishUnavailable(result.ErrorCode ?? "ProviderUnavailable");

        try
        {
            using var document = JsonDocument.Parse(StripFence(result.Text));
            var root = document.RootElement;
            if (root.ValueKind != JsonValueKind.Object)
                return DishUnavailable("InvalidDishResponse");
            var name = ReadString(root, "suggestedDishName")?.Trim();
            var visible = ReadStringArray(root, "visibleIngredients");
            var unknown = ReadStringArray(root, "unknownFactors");
            var questions = ReadStringArray(root, "followUpQuestions");
            if (visible is null || unknown is null || questions is null)
                return DishUnavailable("InvalidDishResponse");
            if (string.IsNullOrWhiteSpace(name) && visible.Count == 0)
                return DishUnavailable("UnrecognizableImage");
            return new GeminiDishImageResponse(true, name, visible, unknown, questions);
        }
        catch (JsonException)
        {
            return DishUnavailable("InvalidDishResponse");
        }
    }

    public async Task<GeminiLabelResponse> ReadIngredientLabelAsync(
        GeminiDishImageRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(apiKey))
            return new GeminiLabelResponse(false, null, true, "NotConfigured");
        var imagePart = new Dictionary<string, object>
        {
            ["inline_data"] = new Dictionary<string, string>
            {
                ["mime_type"] = request.MimeType,
                ["data"] = Convert.ToBase64String(request.ImageBytes)
            }
        };
        const string prompt = "Đọc CHỈ chữ nhìn thấy trong bảng thành phần của ảnh. Không tự điền chữ bị mờ hoặc bị cắt. Trả JSON {\"extractedText\":\"...\",\"isIncomplete\":true/false}. Đánh dấu isIncomplete=true nếu chữ mờ, thiếu, bị cắt hoặc không đọc được đầy đủ.";
        var result = await GenerateAsync(prompt, cancellationToken, true, imagePart, imageModel);
        if (!result.IsAvailable || result.Text is null)
            return new GeminiLabelResponse(false, null, true, result.ErrorCode);
        try
        {
            using var document = JsonDocument.Parse(StripFence(result.Text));
            var root = document.RootElement;
            var extracted = ReadString(root, "extractedText");
            if (!root.TryGetProperty("isIncomplete", out var incomplete) ||
                incomplete.ValueKind is not (JsonValueKind.True or JsonValueKind.False))
                return new GeminiLabelResponse(false, null, true, "InvalidOcrResponse");
            return new GeminiLabelResponse(true, extracted?.Trim(), incomplete.GetBoolean());
        }
        catch (JsonException)
        {
            return new GeminiLabelResponse(false, null, true, "InvalidOcrResponse");
        }
    }

    private static GeminiDishImageResponse DishUnavailable(string errorCode) =>
        new(false, null, [], [], [], errorCode);

    private static IReadOnlyList<string>? ReadStringArray(JsonElement root, string property)
    {
        if (!root.TryGetProperty(property, out var value) || value.ValueKind != JsonValueKind.Array)
            return null;
        return value.EnumerateArray()
            .Where(item => item.ValueKind == JsonValueKind.String)
            .Select(item => item.GetString()?.Trim())
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Select(item => item!)
            .Take(20)
            .ToArray();
    }

    public async Task<GeminiChatResponse> GenerateChatReplyAsync(
        GeminiChatRequest request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(apiKey))
            return new GeminiChatResponse(false, null, "NotConfigured");

        var history = string.Join("\n", request.History.Select(turn =>
            $"{(turn.Role.Equals("assistant", StringComparison.OrdinalIgnoreCase) ? "Trợ lý" : "Người dùng")}: {turn.Text}"));
        var prompt = "Bạn là trợ lý AI của Vegetarian Support. Trả lời bằng tiếng Việt, rõ ràng. " +
            "Không khẳng định thành phần ẩn, không cam kết an toàn dị ứng, không thay thế tư vấn y tế. " +
            "Khi được yêu cầu lập thực đơn, hướng người dùng sang tính năng lập thực đơn; câu trả lời chat không phải kế hoạch đã lưu.\n" +
            (request.ProfileContext is null ? "" : "Hồ sơ do người dùng khai báo: " + request.ProfileContext + "\n") +
            history + "\nNgười dùng: " + request.Prompt;
        var result = await GenerateAsync(prompt, cancellationToken);
        return result.IsAvailable
            ? new GeminiChatResponse(true, result.Text)
            : new GeminiChatResponse(false, null, result.ErrorCode);
    }

    public async Task<GeminiModerationResponse> CheckContentAsync(
        GeminiModerationRequest request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(apiKey))
            return new GeminiModerationResponse(false, null, null, null, null, "NotConfigured");

        var hasMedia = request.MediaReferences.Count > 0;
        var prompt = $"""
            Bạn hỗ trợ gắn cờ nội dung cho nền tảng Vegetarian Support. Bạn đưa bằng chứng, không quyết định xuất bản.
            Kiểm tra tiêu đề và văn bản về spam, xúc phạm/không phù hợp, quảng cáo trái quy định, tuyên bố sức khỏe cần kiểm chứng hoặc không liên quan.
            Không khẳng định đã xem ảnh/video. {(hasMedia ? "Media reference có mặt nhưng chưa được phân tích, vì vậy trạng thái phải là Partial." : "")}
            Trả về duy nhất JSON với các thuộc tính status, summary, checkedScope, uncheckedScope, flagReason, flagType, priority, evidence.
            flagType nếu có cờ: Spam, Abuse, Advertising, HealthClaim hoặc OffTopic; priority: Low, Medium, High.
            evidence là trích đoạn NGẮN có thật trong tiêu đề/văn bản; nếu không có bằng chứng thì null. Flagged cần flagReason, flagType, priority và evidence cụ thể. Partial cần uncheckedScope. Không thêm bằng chứng không có trong văn bản.
            Loại nội dung: {request.ContentType}
            Tiêu đề: {request.Title}
            Nội dung: {request.Text}
            """;

        var result = await GenerateAsync(prompt, cancellationToken, jsonResponse: true);
        if (!result.IsAvailable || result.Text is null)
            return new GeminiModerationResponse(false, null, null, null, null, result.ErrorCode);

        try
        {
            using var document = JsonDocument.Parse(StripFence(result.Text));
            var root = document.RootElement;
            var statusText = ReadString(root, "status");
            if (!Enum.TryParse<AiFlagStatus>(statusText, true, out var status)
                || status is not (AiFlagStatus.Passed or AiFlagStatus.Flagged or AiFlagStatus.Partial))
                return new GeminiModerationResponse(false, null, null, null, null, "InvalidModerationStatus");

            var summary = ReadString(root, "summary");
            var checkedScope = ReadString(root, "checkedScope");
            var uncheckedScope = ReadString(root, "uncheckedScope");
            var flagReason = ReadString(root, "flagReason");
            var flagType = ReadString(root, "flagType");
            var priority = ReadString(root, "priority");
            var evidence = ReadString(root, "evidence");
            if (string.IsNullOrWhiteSpace(summary) || string.IsNullOrWhiteSpace(checkedScope)
                || (status == AiFlagStatus.Flagged && string.IsNullOrWhiteSpace(flagReason))
                || (status == AiFlagStatus.Flagged && (string.IsNullOrWhiteSpace(flagType)
                    || string.IsNullOrWhiteSpace(priority) || string.IsNullOrWhiteSpace(evidence)))
                || (status == AiFlagStatus.Partial && string.IsNullOrWhiteSpace(uncheckedScope)))
                return new GeminiModerationResponse(false, null, null, null, null, "InvalidModerationResponse");

            if (!string.IsNullOrWhiteSpace(evidence) &&
                !(request.Title.Contains(evidence, StringComparison.OrdinalIgnoreCase) ||
                  request.Text.Contains(evidence, StringComparison.OrdinalIgnoreCase)))
                return new GeminiModerationResponse(false, null, null, null, null, "UnsupportedEvidence");

            if (request.ContentType == ModeratedContentType.Video || hasMedia)
            {
                status = AiFlagStatus.Partial;
                uncheckedScope = request.ContentType == ModeratedContentType.Video
                    ? "Âm thanh và khung hình video chưa được kiểm tra; Admin cần xem trực tiếp."
                    : "Ảnh hoặc media đính kèm chưa được kiểm tra; Admin cần xem trực tiếp.";
            }
            return new GeminiModerationResponse(
                true, status, summary, checkedScope, uncheckedScope, null, flagReason,
                flagType, priority, evidence);
        }
        catch (JsonException)
        {
            return new GeminiModerationResponse(false, null, null, null, null, "InvalidJsonResponse");
        }
    }

    private async Task<GenerateResult> GenerateAsync(
        string prompt,
        CancellationToken cancellationToken,
        bool jsonResponse = false,
        Dictionary<string, object>? imagePart = null,
        string? modelOverride = null)
    {
        var generationConfig = jsonResponse
            ? new Dictionary<string, object>
            {
                ["temperature"] = 0.2,
                ["maxOutputTokens"] = imagePart is null ? 1024 : 2048,
                ["responseMimeType"] = "application/json"
            }
            : new Dictionary<string, object>
            {
                ["temperature"] = 0.6,
                ["maxOutputTokens"] = 2048
            };
        if (imagePart is not null
            && (modelOverride ?? model).StartsWith("gemini-2.5-", StringComparison.OrdinalIgnoreCase))
        {
            generationConfig["thinkingConfig"] = new Dictionary<string, int>
            {
                ["thinkingBudget"] = 0
            };
        }
        var requestParts = new List<object> { new { text = prompt } };
        if (imagePart is not null) requestParts.Add(imagePart);
        var payload = new
        {
            contents = new[] { new { parts = requestParts } },
            generationConfig
        };

        try
        {
            for (var attempt = 0; attempt < 3; attempt++)
            {
                using var message = new HttpRequestMessage(
                    HttpMethod.Post,
                    $"{ApiBase}{Uri.EscapeDataString(modelOverride ?? model)}:generateContent");
                message.Headers.TryAddWithoutValidation("x-goog-api-key", apiKey);
                message.Content = JsonContent.Create(payload);

                using var response = await httpClient.SendAsync(message, cancellationToken);
                if (attempt < 2 && response.StatusCode is
                    (HttpStatusCode.ServiceUnavailable or HttpStatusCode.BadGateway or HttpStatusCode.GatewayTimeout))
                {
                    var delay = TimeSpan.FromMilliseconds(
                        (1 << attempt) * 1000 + Random.Shared.Next(0, 500));
                    await Task.Delay(delay, cancellationToken);
                    continue;
                }

                if (!response.IsSuccessStatusCode)
                    return GenerateResult.Unavailable($"ProviderHttp{(int)response.StatusCode}");

                using var document = await JsonDocument.ParseAsync(
                    await response.Content.ReadAsStreamAsync(cancellationToken),
                    cancellationToken: cancellationToken);
                if (!document.RootElement.TryGetProperty("candidates", out var candidates)
                    || candidates.GetArrayLength() == 0
                    || !candidates[0].TryGetProperty("content", out var content)
                    || !content.TryGetProperty("parts", out var parts))
                    return GenerateResult.Unavailable("EmptyProviderResponse");

                var text = string.Join("\n", parts.EnumerateArray()
                    .Select(part => ReadString(part, "text"))
                    .Where(part => !string.IsNullOrWhiteSpace(part)));
                return string.IsNullOrWhiteSpace(text)
                    ? GenerateResult.Unavailable("EmptyProviderResponse")
                    : GenerateResult.Available(text.Trim());
            }

            return GenerateResult.Unavailable("ProviderHttp503");
        }
        catch (JsonException)
        {
            return GenerateResult.Unavailable("InvalidProviderResponse");
        }
        catch (HttpRequestException)
        {
            return GenerateResult.Unavailable("NetworkError");
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return GenerateResult.Unavailable("Timeout");
        }
    }

    private static string? ReadString(JsonElement element, string property) =>
        element.TryGetProperty(property, out var value) && value.ValueKind == JsonValueKind.String
            ? value.GetString()
            : null;

    private static string StripFence(string value)
    {
        var text = value.Trim();
        var fence = new string((char)96, 3);
        if (!text.StartsWith(fence, StringComparison.Ordinal)) return text;
        var firstLineEnd = text.IndexOf('\n');
        var lastFence = text.LastIndexOf(fence, StringComparison.Ordinal);
        return firstLineEnd >= 0 && lastFence > firstLineEnd
            ? text[(firstLineEnd + 1)..lastFence].Trim()
            : text;
    }

    private sealed record GenerateResult(bool IsAvailable, string? Text, string? ErrorCode)
    {
        public static GenerateResult Available(string text) => new(true, text, null);
        public static GenerateResult Unavailable(string error) => new(false, null, error);
    }
}
