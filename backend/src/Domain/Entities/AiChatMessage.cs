// Chức năng: hội thoại hỗ trợ ăn chay. Tầng Domain mô tả dữ liệu hoặc quy tắc nghiệp vụ, không phụ thuộc HTTP hay cơ sở dữ liệu.
using Domain.Enums;

namespace Domain.Entities;

// AiChatMessage: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class AiChatMessage
{
    private AiChatMessage() { }

    private AiChatMessage(
        Guid id,
        Guid conversationId,
        AiChatMessageRole role,
        string content,
        DateTimeOffset createdAtUtc)
    {
        Id = id;
        ConversationId = conversationId;
        Role = role;
        Content = content;
        CreatedAtUtc = createdAtUtc;
    }

    public Guid Id { get; private set; }
    public Guid ConversationId { get; private set; }
    public AiChatMessageRole Role { get; private set; }
    public string Content { get; private set; } = string.Empty;
    public DateTimeOffset CreatedAtUtc { get; private set; }

    // Create: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public static AiChatMessage Create(
        Guid conversationId,
        AiChatMessageRole role,
        string content,
        DateTimeOffset createdAtUtc)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (conversationId == Guid.Empty)
        {
            throw new ArgumentException("A conversation ID is required.", nameof(conversationId));
        }

        if (string.IsNullOrWhiteSpace(content))
        {
            throw new ArgumentException("Message content is required.", nameof(content));
        }

        return new AiChatMessage(Guid.NewGuid(), conversationId, role, content, createdAtUtc);
    }
}
