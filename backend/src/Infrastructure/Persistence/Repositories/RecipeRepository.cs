// Chức năng: công thức và định lượng nguyên liệu. Tầng Infrastructure thực hiện truy vấn, lưu trữ hoặc giao tiếp dịch vụ ngoài.
using Domain.Rules;
using Application.Common.Exceptions;
using Application.Features.Recipes;
using Domain.Entities;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

// RecipeRepository: thực hiện truy vấn và lưu dữ liệu của tính năng qua EF Core.
public sealed class RecipeRepository(AppDbContext db) : IRecipeRepository
{
    // ListAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<(IReadOnlyList<Recipe> Items, int TotalCount)> ListAsync(RecipeListQuery request, bool includeInactive, CancellationToken ct)
    {
        var query = db.Recipes.AsNoTracking().AsQueryable();
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
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
        if (request.DeclaredDietaryType.HasValue)
        {
            query = query.Where(x => x.DeclaredDietaryType == request.DeclaredDietaryType.Value);
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
        var ordered = request.CalorieSort switch
        {
            "asc" => query.OrderBy(x => !x.CaloriesPerServing.HasValue)
                .ThenBy(x => x.CaloriesPerServing).ThenBy(x => x.Name).ThenBy(x => x.Id),
            "desc" => query.OrderBy(x => !x.CaloriesPerServing.HasValue)
                .ThenByDescending(x => x.CaloriesPerServing).ThenBy(x => x.Name).ThenBy(x => x.Id),
            _ => query.OrderBy(x => x.Name).ThenBy(x => x.Id)
        };
        var items = await ordered
            .Skip((int)offset).Take(request.PageSize)
            .Include(x => x.Category)
            .Include(x => x.RecipeIngredients).ThenInclude(x => x.Ingredient)
            .AsSplitQuery()
            .ToListAsync(ct);
        return (items, count);
    }

    // GetAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public Task<Recipe?> GetAsync(Guid id, CancellationToken ct) =>
        db.Recipes.Include(x => x.Category).Include(x => x.RecipeIngredients).ThenInclude(x => x.Ingredient).SingleOrDefaultAsync(x => x.Id == id, ct);

    // NameExistsAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public Task<bool> NameExistsAsync(string name, Guid? exceptId, CancellationToken ct) =>
        db.Recipes.AnyAsync(x => x.Name == name && x.Id != exceptId, ct);

    // Add: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public void Add(Recipe entity) => db.Recipes.Add(entity);

    // SaveAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public async Task SaveAsync(CancellationToken ct)
    {
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException { Number: 2601 or 2627 })
        {
            throw new ConflictException("Tên công thức đã tồn tại. Vui lòng kiểm tra cả công thức đã ngừng sử dụng.");
        }
    }
}
