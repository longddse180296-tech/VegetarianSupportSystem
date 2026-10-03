using Application.Common.Exceptions;
using Application.Features.Categories;
using Domain.Entities;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public sealed class CategoryRepository(AppDbContext db) : ICategoryRepository
{
    public async Task<(IReadOnlyList<Category> Items, int TotalCount)> ListAsync(CategoryListQuery request, bool includeInactive, CancellationToken ct)
    {
        var query = db.Categories.AsNoTracking();
        if (!includeInactive)
        {
            query = query.Where(x => x.IsActive);
        }
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            query = query.Where(x => x.Name.Contains(search));
        }

        var count = await query.CountAsync(ct);
        var offset = ((long)request.PageNumber - 1) * request.PageSize;
        if (offset >= count)
        {
            return (Array.Empty<Category>(), count);
        }
        var items = await query.OrderBy(x => x.Name).ThenBy(x => x.Id)
            .Skip((int)offset).Take(request.PageSize).ToListAsync(ct);
        return (items, count);
    }

    public Task<Category?> GetAsync(Guid id, CancellationToken ct) =>
        db.Categories.SingleOrDefaultAsync(x => x.Id == id, ct);

    public Task<bool> NameExistsAsync(string name, Guid? exceptId, CancellationToken ct) =>
        db.Categories.AnyAsync(x => x.Name == name && x.Id != exceptId, ct);

    public void Add(Category entity) => db.Categories.Add(entity);

    public async Task SaveAsync(CancellationToken ct)
    {
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException { Number: 2601 or 2627 })
        {
            throw new ConflictException("Category name already exists.");
        }
    }
}
