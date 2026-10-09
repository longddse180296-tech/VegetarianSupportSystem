using Application.Common.Exceptions;
using Application.Features.Pantry;
using Domain.Entities;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public sealed class PantryRepository(AppDbContext db) : IPantryRepository
{
    public async Task<IReadOnlyList<PantryItem>> ListAsync(string userId, CancellationToken ct) =>
        await db.PantryItems.AsNoTracking().Where(item => item.UserId == userId)
            .Include(item => item.Ingredient).OrderBy(item => item.Ingredient != null ? item.Ingredient.Name : item.CustomName)
            .ThenBy(item => item.Id).ToListAsync(ct);

    public Task<PantryItem?> GetAsync(Guid id, string userId, CancellationToken ct) =>
        db.PantryItems.Include(item => item.Ingredient)
            .SingleOrDefaultAsync(item => item.Id == id && item.UserId == userId, ct);

    public Task<Ingredient?> GetActiveIngredientAsync(Guid id, CancellationToken ct) =>
        db.Ingredients.SingleOrDefaultAsync(ingredient => ingredient.Id == id && ingredient.IsActive, ct);

    public async Task<Ingredient?> FindActiveIngredientByNameOrAliasAsync(string name, CancellationToken ct)
    {
        var candidates = await db.Ingredients.AsNoTracking().Where(ingredient => ingredient.IsActive &&
                (ingredient.Name == name || (ingredient.Aliases != null && ingredient.Aliases.Contains(name))))
            .ToListAsync(ct);
        return candidates.SingleOrDefault(ingredient => string.Equals(ingredient.Name, name, StringComparison.OrdinalIgnoreCase) ||
            ingredient.Aliases!.Split([',', ';', '|'], StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
                .Any(alias => string.Equals(alias, name, StringComparison.OrdinalIgnoreCase)));
    }

    public Task<bool> HasIngredientAsync(string userId, Guid ingredientId, Guid? exceptId, CancellationToken ct) =>
        db.PantryItems.AnyAsync(item => item.UserId == userId && item.IngredientId == ingredientId && item.Id != exceptId, ct);

    public Task<bool> HasCustomNameAsync(string userId, string name, Guid? exceptId, CancellationToken ct) =>
        db.PantryItems.AnyAsync(item => item.UserId == userId && item.IngredientId == null && item.CustomName == name && item.Id != exceptId, ct);

    public Task<UserProfile?> GetProfileAsync(string userId, CancellationToken ct) =>
        db.UserProfiles.AsNoTracking().Include(profile => profile.Allergies).Include(profile => profile.AvoidedFoods)
            .SingleOrDefaultAsync(profile => profile.UserId == userId, ct);

    public async Task<IReadOnlyList<Recipe>> GetActiveRecipesAsync(CancellationToken ct) =>
        await db.Recipes.AsNoTracking().Where(recipe => recipe.IsActive)
            .Include(recipe => recipe.RecipeIngredients).ThenInclude(row => row.Ingredient)
            .AsSplitQuery().ToListAsync(ct);

    public async Task<IReadOnlyList<Ingredient>> GetActiveIngredientsWithUnitAsync(string unit, CancellationToken ct) =>
        await db.Ingredients.AsNoTracking().Where(ingredient => ingredient.IsActive && ingredient.DefaultUnit == unit)
            .OrderBy(ingredient => ingredient.Name).ThenBy(ingredient => ingredient.Id).ToListAsync(ct);

    public void Add(PantryItem item) => db.PantryItems.Add(item);

    public void Remove(PantryItem item) => db.PantryItems.Remove(item);

    public async Task SaveAsync(CancellationToken ct)
    {
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException { Number: 2601 or 2627 })
        {
            throw new ConflictException("This pantry item already exists.");
        }
    }
}
