// BE2-06 | Hợp đồng API cho truy vấn, hiển thị hoặc cập nhật nội dung nổi bật.
// Định nghĩa một mục trong danh sách nội dung được Admin ghim nổi bật.
namespace Application.Features.Administration;

// FeaturedContentItem: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record FeaturedContentItem(Guid Id, string ContentType, string Title,
    string? Description, string? ImageUrl, bool IsPinned, string? AuthorName,
    DateTimeOffset? PublishedAt, long? ViewCount, string? Address, IReadOnlyList<string> DietaryTypes);
