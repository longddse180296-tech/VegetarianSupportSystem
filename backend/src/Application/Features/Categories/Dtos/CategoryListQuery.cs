using System.ComponentModel.DataAnnotations;

namespace Application.Features.Categories;

public sealed class CategoryListQuery
{
    [Range(1, int.MaxValue)]
    public int PageNumber { get; init; } = 1;
    [Range(1, 100)]
    public int PageSize { get; init; } = 20;
    [StringLength(120)]
    public string? Search { get; init; }
}
