using Domain.Rules;
using Application.Common.Exceptions;
using Application.Features.Recipes;
using Domain.Entities;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public sealed class RecipeRepository(AppDbContext db) : IRecipeRepository
{
    public async Task<(IReadOnlyList<Recipe> Items, int TotalCount)> ListAsync(RecipeListQuery request, bool includeInactive, CancellationToken ct)
    {
        var query = db.Recipes.AsNoTracking().AsQueryable();
        if (!includeInactive)
        {
            query = query.Where(x => x.IsActive);
        }
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            query = query.Where(x => x.Name.Contains(search) ||
                x.RecipeIngredients.Any(row => row.Ingredient!.Name.Contains(search) ||
                    (row.Ingredient.Aliases != null && row.Ingredient.Aliases.Contains(search))));
        }
        if (request.CategoryId.HasValue)
        {
            query = query.Where(x => x.CategoryId == request.CategoryId.Value);
        }
        if (request.MaxCookTimeMinutes.HasValue)
        {
            query = query.Where(recipe => recipe.CookTimeMinutes <= request.MaxCookTimeMinutes.Value);
        }
        if (request.MaxCaloriesPerServing.HasValue)
        {
            query = query.Where(recipe => recipe.CaloriesPerServing.HasValue &&
                recipe.CaloriesPerServing.Value <= request.MaxCaloriesPerServing.Value);
        }
        if (request.DietaryType.HasValue)
        {
            var incompatibleIds = db.Ingredients
                .Where(DietaryRules.IncompatibleIngredient(request.DietaryType.Value)).Select(ingredient => ingredient.Id);
            var unknownIds = db.Ingredients
                .Where(DietaryRules.UnknownIngredient).Select(ingredient => ingredient.Id);

            query = query.Where(recipe => recipe.RecipeIngredients.Any() &&
                !recipe.RecipeIngredients.Any(row => incompatibleIds.Contains(row.IngredientId) ||
                    unknownIds.Contains(row.IngredientId)));
        }

        var count = await query.CountAsync(ct);
        var offset = ((long)request.PageNumber - 1) * request.PageSize;
        if (offset >= count)
        {
            return (Array.Empty<Recipe>(), count);
        }
        var items = await query.OrderBy(x => x.Name).ThenBy(x => x.Id)
            .Skip((int)offset).Take(request.PageSize)
            .Include(x => x.Category)
            .Include(x => x.RecipeIngredients).ThenInclude(x => x.Ingredient)
            .AsSplitQuery()
            .ToListAsync(ct);
        return (items, count);
    }

    public Task<Recipe?> GetAsync(Guid id, CancellationToken ct) =>
        db.Recipes.Include(x => x.Category).Include(x => x.RecipeIngredients).ThenInclude(x => x.Ingredient).SingleOrDefaultAsync(x => x.Id == id, ct);

    public Task<bool> NameExistsAsync(string name, Guid? exceptId, CancellationToken ct) =>
        db.Recipes.AnyAsync(x => x.Name == name && x.Id != exceptId, ct);

    public void Add(Recipe entity) => db.Recipes.Add(entity);

    public async Task SaveAsync(CancellationToken ct)
    {
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException { Number: 2601 or 2627 })
        {
            throw new ConflictException("Recipe name already exists.");
        }
    }
}
