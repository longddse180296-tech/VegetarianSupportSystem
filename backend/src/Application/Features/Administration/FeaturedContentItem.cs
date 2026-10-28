// Chức năng: quản trị tài khoản và thống kê hệ thống. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
namespace Application.Features.Administration;

// FeaturedContentItem: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record FeaturedContentItem(Guid Id, string ContentType, string Title,
    string? Description, string? ImageUrl, bool IsPinned, string? AuthorName,
    DateTimeOffset? PublishedAt, long? ViewCount, string? Address, IReadOnlyList<string> DietaryTypes);
