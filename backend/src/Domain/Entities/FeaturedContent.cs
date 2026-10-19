using Domain.Enums;

namespace Domain.Entities;

public sealed class FeaturedContent
{
    private FeaturedContent() { }

    public FeaturedContent(FeaturedContentType contentType, Guid contentId, string pinnedByUserId, DateTimeOffset pinnedAt)
    {
        if (!Enum.IsDefined(contentType) || contentId == Guid.Empty ||
            string.IsNullOrWhiteSpace(pinnedByUserId) || pinnedByUserId.Length > 450)
            throw new ArgumentException("Invalid featured content pin.");
        ContentType = contentType;
        ContentId = contentId;
        PinnedByUserId = pinnedByUserId;
        PinnedAt = pinnedAt;
    }

    public FeaturedContentType ContentType { get; private set; }
    public Guid ContentId { get; private set; }
    public string PinnedByUserId { get; private set; } = string.Empty;
    public DateTimeOffset PinnedAt { get; private set; }
}
