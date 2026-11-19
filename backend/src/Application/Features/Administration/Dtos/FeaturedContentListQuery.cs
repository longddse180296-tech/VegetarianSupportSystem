// BE2-06 | Hợp đồng API cho truy vấn, hiển thị hoặc cập nhật nội dung nổi bật.
// Nhận bộ lọc và phân trang cho danh sách nội dung được Admin ghim nổi bật.
using System.ComponentModel.DataAnnotations;

namespace Application.Features.Administration;

// FeaturedContentListQuery: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class FeaturedContentListQuery
{
    [Required]
    public string ContentType { get; init; } = string.Empty;
    [StringLength(120)]
    public string? Search { get; init; }
    [Range(1, int.MaxValue)]
    public int Page { get; init; } = 1;
    [Range(1, 100)]
    public int PageSize { get; init; } = 6;
}
