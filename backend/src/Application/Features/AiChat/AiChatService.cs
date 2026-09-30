using Domain.Entities;
using Domain.Enums;

namespace Application.Features.AiChat;

public sealed class AiChatService(
    IAiChatRepository repository,
    IAiChatAnswerService answerService)
{
    private const int HistoryLimit = 20;

    public async Task<AiChatConversationDto> CreateConversationAsync(
        string userId,
        CancellationToken cancellationToken)
    {
        var conversation = await repository.CreateConversationAsync(userId, cancellationToken);
        return ToDto(conversation);
    }

    public async Task<AiChatConversationDto?> GetConversationAsync(
        Guid conversationId,
        string userId,
        CancellationToken cancellationToken)
    {
        var conversation = await repository.GetConversationForUserAsync(
            conversationId, userId, cancellationToken);
        return conversation is null ? null : ToDto(conversation);
    }

    public async Task<AiChatPage<AiChatConversationDto>> ListConversationsAsync(
        string userId,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var result = await repository.ListConversationsForUserAsync(
            userId, page, pageSize, cancellationToken);
        return new AiChatPage<AiChatConversationDto>(
            result.Items.Select(ToDto).ToArray(),
            result.Page,
            result.PageSize,
            result.TotalCount);
    }

    public async Task<AiChatPage<AiChatMessageDto>?> ListMessagesAsync(
        Guid conversationId,
        string userId,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        if (await repository.GetConversationForUserAsync(
                conversationId, userId, cancellationToken) is null)
        {
            return null;
        }

        var result = await repository.ListMessagesAsync(
            conversationId, page, pageSize, cancellationToken);
        return new AiChatPage<AiChatMessageDto>(
            result.Items.Select(ToDto).ToArray(),
            result.Page,
            result.PageSize,
            result.TotalCount);
    }

    public async Task<AiChatSubmissionDto?> SubmitMessageAsync(
        Guid conversationId,
        string userId,
        string content,
        CancellationToken cancellationToken)
    {
        if (await repository.GetConversationForUserAsync(
                conversationId, userId, cancellationToken) is null)
        {
            return null;
        }

        var history = await repository.GetRecentMessagesAsync(
            conversationId, HistoryLimit, cancellationToken);
        var userMessage = await repository.AddMessageAsync(
            conversationId, AiChatMessageRole.User, content, cancellationToken);

        var turns = history
            .Select(message => new AiChatTurn(message.Role, message.Content))
            .ToArray();
        var answer = await answerService.GenerateAsync(content, turns, cancellationToken);

        if (!answer.IsAvailable || string.IsNullOrWhiteSpace(answer.Answer))
        {
            return new AiChatSubmissionDto(
                ToDto(userMessage), null, AiChatAnswerStatus.Unavailable);
        }

        var assistantMessage = await repository.AddMessageAsync(
            conversationId,
            AiChatMessageRole.Assistant,
            answer.Answer.Trim(),
            cancellationToken);

        return new AiChatSubmissionDto(
            ToDto(userMessage), ToDto(assistantMessage), AiChatAnswerStatus.Answered);
    }

    private static AiChatConversationDto ToDto(AiChatConversation conversation) =>
        new(conversation.Id, conversation.CreatedAtUtc, conversation.UpdatedAtUtc);

    private static AiChatMessageDto ToDto(AiChatMessage message) =>
        new(message.Id, message.ConversationId, message.Role, message.Content, message.CreatedAtUtc);
}
