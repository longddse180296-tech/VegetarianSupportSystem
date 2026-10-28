// Chức năng: hội thoại hỗ trợ ăn chay. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using Domain.Enums;

namespace Application.Features.AiChat;

// AiChatTurn: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record AiChatTurn(AiChatMessageRole Role, string Content);

// AiChatAnswerResult: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record AiChatAnswerResult(bool IsAvailable, string? Answer)
{
    // Unavailable: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public static AiChatAnswerResult Unavailable() => new(false, null);

    // FromAnswer: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public static AiChatAnswerResult FromAnswer(string answer) =>
        new(true, answer);
}

// IAiChatAnswerService: định nghĩa hợp đồng xử lý giữa các tầng.
public interface IAiChatAnswerService
{
    // GenerateAsync: Tạo kết quả dựa trên đầu vào và các ràng buộc đang áp dụng.
    Task<AiChatAnswerResult> GenerateAsync(
        string prompt,
        IReadOnlyList<AiChatTurn> history,
        CancellationToken cancellationToken,
        string? profileContext = null);
}
