namespace Domain.Entities;

public sealed class AiChatConversation
{
    private AiChatConversation() { }

    private AiChatConversation(Guid id, string userId, DateTimeOffset createdAtUtc)
    {
        Id = id;
        UserId = userId;
        CreatedAtUtc = createdAtUtc;
        UpdatedAtUtc = createdAtUtc;
    }

    public Guid Id { get; private set; }
    public string UserId { get; private set; } = string.Empty;
    public DateTimeOffset CreatedAtUtc { get; private set; }
    public DateTimeOffset UpdatedAtUtc { get; private set; }

    public static AiChatConversation Create(string userId, DateTimeOffset createdAtUtc)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new ArgumentException("A user ID is required.", nameof(userId));
        }

        return new AiChatConversation(Guid.NewGuid(), userId, createdAtUtc);
    }

    public void RecordMessageAt(DateTimeOffset createdAtUtc)
    {
        if (createdAtUtc > UpdatedAtUtc)
        {
            UpdatedAtUtc = createdAtUtc;
        }
    }
}
