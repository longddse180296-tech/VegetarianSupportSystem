// Chức năng: tủ bếp và nguyên liệu sẵn có. Tầng Infrastructure thực hiện truy vấn, lưu trữ hoặc giao tiếp dịch vụ ngoài.
using Application.Common.Exceptions;
using Application.Features.Pantry;
using Domain.Entities;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

// PantryRepository: thực hiện truy vấn và lưu dữ liệu của tính năng qua EF Core.
public sealed class PantryRepository(AppDbContext db) : IPantryRepository
{
    // ListAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<IReadOnlyList<PantryItem>> ListAsync(string userId, CancellationToken ct) =>
        await db.PantryItems.AsNoTracking().Where(item => item.UserId == userId)
            .Include(item => item.Ingredient).OrderBy(item => item.Ingredient != null ? item.Ingredient.Name : item.CustomName)
            .ThenBy(item => item.Id).ToListAsync(ct);

    // GetAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public Task<PantryItem?> GetAsync(Guid id, string userId, CancellationToken ct) =>
        db.PantryItems.Include(item => item.Ingredient)
            .SingleOrDefaultAsync(item => item.Id == id && item.UserId == userId, ct);

    // GetActiveIngredientAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public Task<Ingredient?> GetActiveIngredientAsync(Guid id, CancellationToken ct) =>
        db.Ingredients.SingleOrDefaultAsync(ingredient => ingredient.Id == id && ingredient.IsActive, ct);

    // FindActiveIngredientByNameOrAliasAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<Ingredient?> FindActiveIngredientByNameOrAliasAsync(string name, CancellationToken ct)
    {
        var candidates = await db.Ingredients.AsNoTracking().Where(ingredient => ingredient.IsActive &&
                (ingredient.Name == name || (ingredient.Aliases != null && ingredient.Aliases.Contains(name))))
            .ToListAsync(ct);
        return candidates.SingleOrDefault(ingredient => string.Equals(ingredient.Name, name, StringComparison.OrdinalIgnoreCase) ||
            ingredient.Aliases!.Split([',', ';', '|'], StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
                .Any(alias => string.Equals(alias, name, StringComparison.OrdinalIgnoreCase)));
    }

    // HasIngredientAsync: Đánh giá điều kiện nghiệp vụ để quyết định nhánh xử lý.
    public Task<bool> HasIngredientAsync(string userId, Guid ingredientId, Guid? exceptId, CancellationToken ct) =>
        db.PantryItems.AnyAsync(item => item.UserId == userId && item.IngredientId == ingredientId && item.Id != exceptId, ct);

    // HasCustomNameAsync: Đánh giá điều kiện nghiệp vụ để quyết định nhánh xử lý.
    public Task<bool> HasCustomNameAsync(string userId, string name, Guid? exceptId, CancellationToken ct) =>
        db.PantryItems.AnyAsync(item => item.UserId == userId && item.IngredientId == null && item.CustomName == name && item.Id != exceptId, ct);

    // GetProfileAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public Task<UserProfile?> GetProfileAsync(string userId, CancellationToken ct) =>
        db.UserProfiles.AsNoTracking().Include(profile => profile.Allergies).Include(profile => profile.AvoidedFoods)
            .SingleOrDefaultAsync(profile => profile.UserId == userId, ct);

    // GetActiveRecipesAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<IReadOnlyList<Recipe>> GetActiveRecipesAsync(CancellationToken ct) =>
        await db.Recipes.AsNoTracking().Where(recipe => recipe.IsActive)
            .Include(recipe => recipe.RecipeIngredients).ThenInclude(row => row.Ingredient)
            .AsSplitQuery().ToListAsync(ct);

    // GetActiveIngredientsWithUnitAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<IReadOnlyList<Ingredient>> GetActiveIngredientsWithUnitAsync(string unit, CancellationToken ct) =>
        await db.Ingredients.AsNoTracking().Where(ingredient => ingredient.IsActive && ingredient.DefaultUnit == unit)
            .OrderBy(ingredient => ingredient.Name).ThenBy(ingredient => ingredient.Id).ToListAsync(ct);

    // Add: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public void Add(PantryItem item) => db.PantryItems.Add(item);

    // Remove: Xóa dữ liệu trong phạm vi cho phép và xử lý các liên kết liên quan.
    public void Remove(PantryItem item) => db.PantryItems.Remove(item);

    // SaveAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
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
