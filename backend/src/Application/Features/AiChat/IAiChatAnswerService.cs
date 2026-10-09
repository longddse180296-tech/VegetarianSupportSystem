using Domain.Enums;

namespace Application.Features.AiChat;

public sealed record AiChatTurn(AiChatMessageRole Role, string Content);

public sealed record AiChatAnswerResult(bool IsAvailable, string? Answer)
{
    public static AiChatAnswerResult Unavailable() => new(false, null);

    public static AiChatAnswerResult FromAnswer(string answer) =>
        new(true, answer);
}

public interface IAiChatAnswerService
{
    Task<AiChatAnswerResult> GenerateAsync(
        string prompt,
        IReadOnlyList<AiChatTurn> history,
        CancellationToken cancellationToken,
        string? profileContext = null);
}
