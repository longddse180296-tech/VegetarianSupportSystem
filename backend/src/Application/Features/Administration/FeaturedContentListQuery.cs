using System.ComponentModel.DataAnnotations;

namespace Application.Features.Administration;

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
