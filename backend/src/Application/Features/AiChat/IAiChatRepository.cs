// Chức năng: hội thoại hỗ trợ ăn chay. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using Domain.Entities;

namespace Application.Features.AiChat;

// IAiChatRepository: định nghĩa hợp đồng xử lý giữa các tầng.
public interface IAiChatRepository
{
    // CreateConversationAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    Task<AiChatConversation> CreateConversationAsync(
        string userId,
        CancellationToken cancellationToken);

    // GetConversationForUserAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<AiChatConversation?> GetConversationForUserAsync(
        Guid conversationId,
        string userId,
        CancellationToken cancellationToken);

    // ListConversationsForUserAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<AiChatPage<AiChatConversation>> ListConversationsForUserAsync(
        string userId,
        int page,
        int pageSize,
        CancellationToken cancellationToken);

    // ListMessagesAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<AiChatPage<AiChatMessage>> ListMessagesAsync(
        Guid conversationId,
        int page,
        int pageSize,
        CancellationToken cancellationToken);

    // GetRecentMessagesAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<IReadOnlyList<AiChatMessage>> GetRecentMessagesAsync(
        Guid conversationId,
        int limit,
        CancellationToken cancellationToken);

    // AddMessageAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    Task<AiChatMessage> AddMessageAsync(
        Guid conversationId,
        Domain.Enums.AiChatMessageRole role,
        string content,
        CancellationToken cancellationToken);
}
