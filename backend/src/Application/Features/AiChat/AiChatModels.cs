using Domain.Enums;

namespace Application.Features.AiChat;

public sealed record AiChatPage<T>(
    IReadOnlyList<T> Items,
    int Page,
    int PageSize,
    long TotalCount);

public sealed record AiChatConversationDto(
    Guid Id,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc);

public sealed record AiChatMessageDto(
    Guid Id,
    Guid ConversationId,
    AiChatMessageRole Role,
    string Content,
    DateTimeOffset CreatedAtUtc);

public enum AiChatAnswerStatus
{
    Answered,
    Unavailable
}

public sealed record AiChatSubmissionDto(
    AiChatMessageDto UserMessage,
    AiChatMessageDto? AssistantMessage,
    AiChatAnswerStatus AnswerStatus);
