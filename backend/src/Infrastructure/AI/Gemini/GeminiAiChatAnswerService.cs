// Chuyển câu hỏi, lịch sử và ngữ cảnh hồ sơ thành request Gemini. Chuẩn hóa kết quả về định dạng mà AI Chat sử dụng.
using Application.Abstractions.AI;
using Application.Features.AiChat;
using Domain.Enums;

namespace Infrastructure.AI.Gemini;

// GeminiAiChatAnswerService: điều phối các bước nghiệp vụ và xử lý kết quả cho bên gọi.
public sealed class GeminiAiChatAnswerService(IGeminiService geminiService) : IAiChatAnswerService
{
    // Ánh xạ vai trò các lượt chat sang hợp đồng Gemini và chuyển lỗi kết nối hoặc timeout về trạng thái không có câu trả lời.
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
