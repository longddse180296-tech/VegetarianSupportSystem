using Domain.Enums;

namespace Domain.Entities;

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

    public static AiChatMessage Create(
        Guid conversationId,
        AiChatMessageRole role,
        string content,
        DateTimeOffset createdAtUtc)
    {
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
