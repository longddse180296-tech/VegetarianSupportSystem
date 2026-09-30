using Domain.Entities;

namespace Application.Features.AiChat;

public interface IAiChatRepository
{
    Task<AiChatConversation> CreateConversationAsync(
        string userId,
        CancellationToken cancellationToken);

    Task<AiChatConversation?> GetConversationForUserAsync(
        Guid conversationId,
        string userId,
        CancellationToken cancellationToken);

    Task<AiChatPage<AiChatConversation>> ListConversationsForUserAsync(
        string userId,
        int page,
        int pageSize,
        CancellationToken cancellationToken);

    Task<AiChatPage<AiChatMessage>> ListMessagesAsync(
        Guid conversationId,
        int page,
        int pageSize,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<AiChatMessage>> GetRecentMessagesAsync(
        Guid conversationId,
        int limit,
        CancellationToken cancellationToken);

    Task<AiChatMessage> AddMessageAsync(
        Guid conversationId,
        Domain.Enums.AiChatMessageRole role,
        string content,
        CancellationToken cancellationToken);
}
