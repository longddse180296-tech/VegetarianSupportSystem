using Application.Features.AiChat;
using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public sealed class AiChatRepository(AppDbContext dbContext) : IAiChatRepository
{
    public async Task<AiChatConversation> CreateConversationAsync(
        string userId,
        CancellationToken cancellationToken)
    {
        var conversation = AiChatConversation.Create(userId, DateTimeOffset.UtcNow);
        dbContext.Set<AiChatConversation>().Add(conversation);
        await dbContext.SaveChangesAsync(cancellationToken);
        return conversation;
    }

    public Task<AiChatConversation?> GetConversationForUserAsync(
        Guid conversationId,
        string userId,
        CancellationToken cancellationToken) =>
        dbContext.Set<AiChatConversation>()
            .AsNoTracking()
            .FirstOrDefaultAsync(
                conversation => conversation.Id == conversationId &&
                                conversation.UserId == userId,
                cancellationToken);

    public async Task<AiChatPage<AiChatConversation>> ListConversationsForUserAsync(
        string userId,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var query = dbContext.Set<AiChatConversation>()
            .AsNoTracking()
            .Where(conversation => conversation.UserId == userId);
        var totalCount = await query.LongCountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(conversation => conversation.UpdatedAtUtc)
            .ThenByDescending(conversation => conversation.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToArrayAsync(cancellationToken);
        return new AiChatPage<AiChatConversation>(items, page, pageSize, totalCount);
    }

    public async Task<AiChatPage<AiChatMessage>> ListMessagesAsync(
        Guid conversationId,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var query = dbContext.Set<AiChatMessage>()
            .AsNoTracking()
            .Where(message => message.ConversationId == conversationId);
        var totalCount = await query.LongCountAsync(cancellationToken);
        var items = await query
            .OrderBy(message => message.CreatedAtUtc)
            .ThenBy(message => message.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToArrayAsync(cancellationToken);
        return new AiChatPage<AiChatMessage>(items, page, pageSize, totalCount);
    }

    public async Task<IReadOnlyList<AiChatMessage>> GetRecentMessagesAsync(
        Guid conversationId,
        int limit,
        CancellationToken cancellationToken)
    {
        var messages = await dbContext.Set<AiChatMessage>()
            .AsNoTracking()
            .Where(message => message.ConversationId == conversationId)
            .OrderByDescending(message => message.CreatedAtUtc)
            .ThenByDescending(message => message.Id)
            .Take(limit)
            .ToArrayAsync(cancellationToken);
        Array.Reverse(messages);
        return messages;
    }

    public async Task<AiChatMessage> AddMessageAsync(
        Guid conversationId,
        AiChatMessageRole role,
        string content,
        CancellationToken cancellationToken)
    {
        var conversation = await dbContext.Set<AiChatConversation>()
            .SingleAsync(conversation => conversation.Id == conversationId, cancellationToken);
        var createdAtUtc = DateTimeOffset.UtcNow;
        var message = AiChatMessage.Create(conversationId, role, content, createdAtUtc);
        dbContext.Set<AiChatMessage>().Add(message);
        conversation.RecordMessageAt(createdAtUtc);
        await dbContext.SaveChangesAsync(cancellationToken);
        return message;
    }
}
