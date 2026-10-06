using System.ComponentModel.DataAnnotations;

namespace Application.Features.Categories;

public sealed class CategoryRequest
{
    [Required, StringLength(120)]
    public string Name { get; init; } = string.Empty;
    [StringLength(500)]
    public string? Description { get; init; }
}
