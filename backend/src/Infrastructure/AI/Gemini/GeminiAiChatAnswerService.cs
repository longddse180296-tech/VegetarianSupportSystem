// Chức năng: kết nối Gemini để phân tích nội dung. Tầng Infrastructure thực hiện truy vấn, lưu trữ hoặc giao tiếp dịch vụ ngoài.
using Application.Abstractions.AI;
using Application.Features.AiChat;
using Domain.Enums;

namespace Infrastructure.AI.Gemini;

// GeminiAiChatAnswerService: điều phối các bước nghiệp vụ và xử lý kết quả cho bên gọi.
public sealed class GeminiAiChatAnswerService(IGeminiService geminiService) : IAiChatAnswerService
{
    // GenerateAsync: Tạo kết quả dựa trên đầu vào và các ràng buộc đang áp dụng.
    public async Task<AiChatAnswerResult> GenerateAsync(
        string prompt,
        IReadOnlyList<AiChatTurn> history,
        CancellationToken cancellationToken,
        string? profileContext = null)
    {
        var request = new GeminiChatRequest(
            prompt,
            history.Select(turn => new GeminiChatTurn(
                turn.Role == AiChatMessageRole.User ? "user" : "assistant",
                turn.Content)).ToArray(), profileContext);

        try
        {
            var response = await geminiService.GenerateChatReplyAsync(request, cancellationToken);
            return response.IsAvailable && !string.IsNullOrWhiteSpace(response.Answer)
                ? AiChatAnswerResult.FromAnswer(response.Answer.Trim())
                : AiChatAnswerResult.Unavailable();
        }
        catch (Exception ex) when (ex is HttpRequestException or TimeoutException
                                   || (ex is OperationCanceledException && !cancellationToken.IsCancellationRequested))
        {
            return AiChatAnswerResult.Unavailable();
        }
    }
}
