using Domain.Entities;

namespace Application.Features.Categories;

public interface ICategoryRepository
{
    Task<(IReadOnlyList<Category> Items, int TotalCount)> ListAsync(CategoryListQuery query, bool includeInactive, CancellationToken ct);
    Task<Category?> GetAsync(Guid id, CancellationToken ct);
    Task<bool> NameExistsAsync(string name, Guid? exceptId, CancellationToken ct);
    void Add(Category entity);
    Task SaveAsync(CancellationToken ct);
}
