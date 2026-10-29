// Chức năng: hội thoại hỗ trợ ăn chay. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using Domain.Enums;

namespace Application.Features.AiChat;

// AiChatPage: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record AiChatPage<T>(
    IReadOnlyList<T> Items,
    int Page,
    int PageSize,
    long TotalCount);

// AiChatConversationDto: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record AiChatConversationDto(
    Guid Id,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc);

// AiChatMessageDto: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record AiChatMessageDto(
    Guid Id,
    Guid ConversationId,
    AiChatMessageRole Role,
    string Content,
    DateTimeOffset CreatedAtUtc);

// AiChatAnswerStatus: định nghĩa các giá trị trạng thái được phép.
public enum AiChatAnswerStatus
{
    Answered,
    Unavailable
}

// AiChatSubmissionDto: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record AiChatSubmissionDto(
    AiChatMessageDto UserMessage,
    AiChatMessageDto? AssistantMessage,
    AiChatAnswerStatus AnswerStatus,
    IReadOnlyList<ChatRecipeSuggestion> RecipeSuggestions);
