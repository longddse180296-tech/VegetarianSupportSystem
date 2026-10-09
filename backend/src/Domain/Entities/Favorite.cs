using Domain.Enums;

namespace Domain.Entities;

public sealed class Favorite
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserId { get; set; } = string.Empty;
    public FavoriteTargetType TargetType { get; set; }
    public Guid TargetId { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
