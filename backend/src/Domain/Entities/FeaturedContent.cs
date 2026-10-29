// Chức năng: hạ tầng và quy tắc dùng chung. Tầng Domain mô tả dữ liệu hoặc quy tắc nghiệp vụ, không phụ thuộc HTTP hay cơ sở dữ liệu.
using Domain.Enums;

namespace Domain.Entities;

// FeaturedContent: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class FeaturedContent
{
    private FeaturedContent() { }

    public FeaturedContent(FeaturedContentType contentType, Guid contentId, string pinnedByUserId, DateTimeOffset pinnedAt)
    {
        if (!Enum.IsDefined(contentType) || contentId == Guid.Empty ||
            string.IsNullOrWhiteSpace(pinnedByUserId) || pinnedByUserId.Length > 450)
            throw new ArgumentException("Thông tin ghim nội dung nổi bật chưa hợp lệ.");
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
