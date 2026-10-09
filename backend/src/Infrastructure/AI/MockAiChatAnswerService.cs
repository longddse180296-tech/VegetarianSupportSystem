using Application.Features.AiChat;

namespace Infrastructure.AI;

// Local development response so the chat flow can be exercised without a Gemini key.
public sealed class MockAiChatAnswerService : IAiChatAnswerService
{
    public Task<AiChatAnswerResult> GenerateAsync(
        string prompt,
        IReadOnlyList<AiChatTurn> history,
        CancellationToken cancellationToken,
        string? profileContext = null)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return Task.FromResult(AiChatAnswerResult.FromAnswer(
            "Phản hồi mẫu từ backend. Gemini chưa được kết nối; nội dung này chỉ dùng để thử luồng chat."));
    }
}
