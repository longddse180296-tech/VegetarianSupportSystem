using Domain.Enums;

namespace Application.Features.AiChat;

public sealed class AiChatGuestState
{
    public int SuccessfulQuestions { get; set; }
    public List<AiChatTurn> Turns { get; set; } = [];
}

public sealed record AiChatGuestSessionInfo(int QuestionLimit, int RemainingQuestions);

public enum AiChatGuestAnswerStatus
{
    Answered,
    Unavailable,
    LimitReached
}

public sealed record AiChatGuestSubmission(
    AiChatGuestAnswerStatus Status,
    string? Answer,
    int RemainingQuestions,
    AiChatGuestState State);

public sealed class AiChatGuestService(IAiChatAnswerService answerService)
{
    public const int QuestionLimit = 3;
    private const int MaxTurnContentLength = 4000;

    public AiChatGuestState NormalizeState(AiChatGuestState? state)
    {
        if (state is null ||
            state.SuccessfulQuestions is < 0 or > QuestionLimit ||
            state.Turns is null ||
            state.Turns.Count != state.SuccessfulQuestions * 2)
        {
            return new AiChatGuestState();
        }

        return state;
    }

    public AiChatGuestSessionInfo GetSessionInfo(AiChatGuestState? state)
    {
        var normalized = NormalizeState(state);
        return new AiChatGuestSessionInfo(
            QuestionLimit,
            QuestionLimit - normalized.SuccessfulQuestions);
    }

    public async Task<AiChatGuestSubmission> SubmitAsync(
        AiChatGuestState? state,
        string content,
        CancellationToken cancellationToken)
    {
        var current = NormalizeState(state);
        var remaining = QuestionLimit - current.SuccessfulQuestions;
        if (remaining == 0)
        {
            return new AiChatGuestSubmission(
                AiChatGuestAnswerStatus.LimitReached, null, 0, current);
        }

        var answer = await answerService.GenerateAsync(
            content, current.Turns, cancellationToken);
        if (!answer.IsAvailable || string.IsNullOrWhiteSpace(answer.Answer))
        {
            return new AiChatGuestSubmission(
                AiChatGuestAnswerStatus.Unavailable, null, remaining, current);
        }

        var answerText = answer.Answer.Trim();
        var next = new AiChatGuestState
        {
            SuccessfulQuestions = current.SuccessfulQuestions + 1,
            Turns = [.. current.Turns]
        };
        next.Turns.Add(new AiChatTurn(AiChatMessageRole.User, content));
        next.Turns.Add(new AiChatTurn(
            AiChatMessageRole.Assistant,
            answerText.Length > MaxTurnContentLength
                ? answerText[..MaxTurnContentLength]
                : answerText));

        return new AiChatGuestSubmission(
            AiChatGuestAnswerStatus.Answered,
            answerText,
            QuestionLimit - next.SuccessfulQuestions,
            next);
    }
}
