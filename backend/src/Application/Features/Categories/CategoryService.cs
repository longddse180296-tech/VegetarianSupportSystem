using System.ComponentModel.DataAnnotations;
using Application.Common.Exceptions;
using Application.Common.Validation;
using Domain.Entities;

namespace Application.Features.Categories;

public sealed class CategoryService(ICategoryRepository repository)
{
    public async Task<CategoryPage> ListAsync(CategoryListQuery query, bool includeInactive, CancellationToken ct)
    {
        RequestValidation.Validate(query);
        var (items, count) = await repository.ListAsync(query, includeInactive, ct);
        return new(items.Select(CategoryMapping.ToResponse).ToArray(), query.PageNumber, query.PageSize, count);
    }

    public async Task<CategoryResponse> GetAsync(Guid id, bool includeInactive, CancellationToken ct)
    {
        var entity = await FindAsync(id, ct);
        if (!includeInactive && !entity.IsActive)
        {
            throw new KeyNotFoundException("Category not found.");
        }
        return CategoryMapping.ToResponse(entity);
    }

    public async Task<CategoryResponse> CreateAsync(CategoryRequest request, CancellationToken ct)
    {
        var entity = new Category();
        await ApplyAsync(entity, request, ct);
        repository.Add(entity);
        await repository.SaveAsync(ct);
        return CategoryMapping.ToResponse(entity);
    }

    public async Task<CategoryResponse> UpdateAsync(Guid id, CategoryRequest request, CancellationToken ct)
    {
        var entity = await FindAsync(id, ct);
        await ApplyAsync(entity, request, ct);
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        await repository.SaveAsync(ct);
        return CategoryMapping.ToResponse(entity);
    }

    public async Task DeactivateAsync(Guid id, CancellationToken ct)
    {
        var entity = await FindAsync(id, ct);
        if (!entity.IsActive)
        {
            return;
        }
        entity.IsActive = false;
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        await repository.SaveAsync(ct);
    }

    private async Task<Category> FindAsync(Guid id, CancellationToken ct) =>
        await repository.GetAsync(id, ct) ?? throw new KeyNotFoundException("Category not found.");

    private async Task ApplyAsync(Category entity, CategoryRequest request, CancellationToken ct)
    {
        RequestValidation.Validate(request);

        if (await repository.NameExistsAsync(request.Name.Trim(), entity.Id, ct))
        {
            throw new ConflictException("Category name already exists.");
        }

        entity.Name = request.Name.Trim();
        entity.Description = request.Description?.Trim();
    }
}
