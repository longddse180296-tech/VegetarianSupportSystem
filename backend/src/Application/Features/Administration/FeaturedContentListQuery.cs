// Chức năng: quản trị tài khoản và thống kê hệ thống. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
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
