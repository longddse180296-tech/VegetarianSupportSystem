// Chức năng: hội thoại hỗ trợ ăn chay. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using Domain.Enums;

namespace Application.Features.AiChat;

// AiChatGuestState: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class AiChatGuestState
{
    public int SuccessfulQuestions { get; set; }
    public List<AiChatTurn> Turns { get; set; } = [];
}

// AiChatGuestSessionInfo: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record AiChatGuestSessionInfo(int QuestionLimit, int RemainingQuestions);

// AiChatGuestAnswerStatus: định nghĩa các giá trị trạng thái được phép.
public enum AiChatGuestAnswerStatus
{
    Answered,
    Unavailable,
    LimitReached
}

// AiChatGuestSubmission: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record AiChatGuestSubmission(
    AiChatGuestAnswerStatus Status,
    string? Answer,
    int RemainingQuestions,
    AiChatGuestState State);

// AiChatGuestService: điều phối các bước nghiệp vụ và xử lý kết quả cho bên gọi.
public sealed class AiChatGuestService(IAiChatAnswerService answerService)
{
    public const int QuestionLimit = 3;
    private const int MaxTurnContentLength = 4000;

    // NormalizeState: Chuẩn hóa hoặc chuyển đổi dữ liệu giữa các bước xử lý.
    public AiChatGuestState NormalizeState(AiChatGuestState? state)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (state is null ||
            state.SuccessfulQuestions is < 0 or > QuestionLimit ||
            state.Turns is null ||
            state.Turns.Count != state.SuccessfulQuestions * 2)
        {
            return new AiChatGuestState();
        }

        return state;
    }

    // GetSessionInfo: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public AiChatGuestSessionInfo GetSessionInfo(AiChatGuestState? state)
    {
        var normalized = NormalizeState(state);
        return new AiChatGuestSessionInfo(
            QuestionLimit,
            QuestionLimit - normalized.SuccessfulQuestions);
    }

    // SubmitAsync: Chuyển bản nội dung hợp lệ sang quy trình gửi duyệt.
    public async Task<AiChatGuestSubmission> SubmitAsync(
        AiChatGuestState? state,
        string content,
        CancellationToken cancellationToken)
    {
        var current = NormalizeState(state);
        var remaining = QuestionLimit - current.SuccessfulQuestions;
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
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
