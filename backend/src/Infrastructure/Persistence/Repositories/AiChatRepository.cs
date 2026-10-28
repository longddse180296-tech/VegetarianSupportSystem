// Chức năng: hội thoại hỗ trợ ăn chay. Tầng Infrastructure thực hiện truy vấn, lưu trữ hoặc giao tiếp dịch vụ ngoài.
using Application.Features.AiChat;
using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

// AiChatRepository: thực hiện truy vấn và lưu dữ liệu của tính năng qua EF Core.
public sealed class AiChatRepository(AppDbContext dbContext) : IAiChatRepository
{
    // CreateConversationAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public async Task<AiChatConversation> CreateConversationAsync(
        string userId,
        CancellationToken cancellationToken)
    {
        var conversation = AiChatConversation.Create(userId, DateTimeOffset.UtcNow);
        dbContext.Set<AiChatConversation>().Add(conversation);
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await dbContext.SaveChangesAsync(cancellationToken);
        return conversation;
    }

    // GetConversationForUserAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
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

    // ListConversationsForUserAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
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

    // ListMessagesAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
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

    // GetRecentMessagesAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
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

    // AddMessageAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
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
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await dbContext.SaveChangesAsync(cancellationToken);
        return message;
    }
}
