using Application.Common.Exceptions;
using Application.Features.Ingredients;
using Domain.Entities;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public sealed class IngredientRepository(AppDbContext db) : IIngredientRepository
{
    public async Task<(IReadOnlyList<Ingredient> Items, int TotalCount)> ListAsync(IngredientListQuery request, bool includeInactive, CancellationToken ct)
    {
        var query = db.Ingredients.AsNoTracking();
        if (!includeInactive)
        {
            query = query.Where(x => x.IsActive);
        }
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            query = query.Where(x => x.Name.Contains(search) || (x.Aliases != null && x.Aliases.Contains(search)));
        }

        var count = await query.CountAsync(ct);
        var offset = ((long)request.PageNumber - 1) * request.PageSize;
        if (offset >= count)
        {
            return (Array.Empty<Ingredient>(), count);
        }
        var items = await query.OrderBy(x => x.Name).ThenBy(x => x.Id)
            .Skip((int)offset).Take(request.PageSize).ToListAsync(ct);
        return (items, count);
    }

    public Task<Ingredient?> GetAsync(Guid id, CancellationToken ct) =>
        db.Ingredients.SingleOrDefaultAsync(x => x.Id == id, ct);

    public Task<bool> NameExistsAsync(string name, Guid? exceptId, CancellationToken ct) =>
        db.Ingredients.AnyAsync(x => x.Name == name && x.Id != exceptId, ct);

    public void Add(Ingredient entity) => db.Ingredients.Add(entity);

    public async Task SaveAsync(CancellationToken ct)
    {
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException { Number: 2601 or 2627 })
        {
            throw new ConflictException("Ingredient name already exists.");
        }
    }

    public async Task<IReadOnlyList<Ingredient>> GetManyAsync(IReadOnlyCollection<Guid> ids, CancellationToken ct) =>
        await db.Ingredients.Where(x => ids.Contains(x.Id)).ToListAsync(ct);
}
