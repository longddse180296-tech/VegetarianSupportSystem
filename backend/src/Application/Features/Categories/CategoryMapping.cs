using Domain.Entities;

namespace Application.Features.Categories;

internal static class CategoryMapping
{
    public static CategoryResponse ToResponse(Category entity) => new(
        entity.Id,
        entity.Name,
        entity.Description,
        entity.IsActive,
        entity.CreatedAt,
        entity.UpdatedAt);
}
