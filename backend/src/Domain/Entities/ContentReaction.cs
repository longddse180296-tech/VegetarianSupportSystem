// Lưu lượt thích video, bình luận hoặc đánh dấu bài viết hữu ích.
using Domain.Enums;

namespace Domain.Entities;

// ContentReaction: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class ContentReaction
{
    private ContentReaction() { }
    public ContentReaction(string userId, ReactionTargetType targetType, Guid targetId, DateTimeOffset now)
    {
        Id = Guid.NewGuid();
        UserId = userId;
        TargetType = targetType;
        TargetId = targetId;
        CreatedAt = now;
    }
    public Guid Id { get; private set; }
    public string UserId { get; private set; } = string.Empty;
    public ReactionTargetType TargetType { get; private set; }
    public Guid TargetId { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
}
