// BE2-01/04 | Triển khai truy vấn và lưu dữ liệu EF Core cho thông tin món, số khẩu phần và dinh dưỡng mỗi khẩu phần.
// Đọc và ghi công thức, số khẩu phần, nguyên liệu và hướng dẫn nấu bằng EF Core.
using Domain.Rules;
using Application.Common.Exceptions;
using Application.Features.Recipes;
using Domain.Entities;
using Domain.Enums;
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
        if (request.CompatibleDeclaredDietaryType.HasValue)
        {
            var requestedDiet = request.CompatibleDeclaredDietaryType.Value;
            query = query.Where(recipe => !recipe.DeclaredDietaryType.HasValue ||
                recipe.DeclaredDietaryType == Domain.Enums.DietaryType.Vegan || recipe.DeclaredDietaryType == requestedDiet ||
                requestedDiet == Domain.Enums.DietaryType.LactoOvoVegetarian);
        }
        if (request.DietaryType.HasValue)
        {
            var incompatibleIds = db.Ingredients
                .Where(DietaryRules.IncompatibleIngredient(request.DietaryType.Value)).Select(ingredient => ingredient.Id);

            query = query.Where(recipe => recipe.RecipeIngredients.Any() &&
                !recipe.RecipeIngredients.Any(row => incompatibleIds.Contains(row.IngredientId)));
        }

        var count = await query.CountAsync(ct);
        var offset = ((long)request.PageNumber - 1) * request.PageSize;
        if (offset >= count)
        {
            return (Array.Empty<Recipe>(), count);
        }
        // Ưu tiên cảnh báo trên toàn bộ danh sách Admin trước khi sắp xếp phụ và phân trang.
        var nonVeganIds = db.Ingredients.Where(DietaryRules.IncompatibleIngredient(DietaryType.Vegan)).Select(x => x.Id);
        var nonLactoIds = db.Ingredients.Where(DietaryRules.IncompatibleIngredient(DietaryType.LactoVegetarian)).Select(x => x.Id);
        var nonOvoIds = db.Ingredients.Where(DietaryRules.IncompatibleIngredient(DietaryType.OvoVegetarian)).Select(x => x.Id);
        var nonLactoOvoIds = db.Ingredients.Where(DietaryRules.IncompatibleIngredient(DietaryType.LactoOvoVegetarian)).Select(x => x.Id);
        var prioritized = query.OrderByDescending(recipe => includeInactive && recipe.DeclaredDietaryType.HasValue &&
            (!recipe.RecipeIngredients.Any() ||
             (recipe.DeclaredDietaryType == DietaryType.Vegan &&
              recipe.RecipeIngredients.Any(row => nonVeganIds.Contains(row.IngredientId))) ||
             (recipe.DeclaredDietaryType == DietaryType.LactoVegetarian &&
              recipe.RecipeIngredients.Any(row => nonLactoIds.Contains(row.IngredientId))) ||
             (recipe.DeclaredDietaryType == DietaryType.OvoVegetarian &&
              recipe.RecipeIngredients.Any(row => nonOvoIds.Contains(row.IngredientId))) ||
             (recipe.DeclaredDietaryType == DietaryType.LactoOvoVegetarian &&
              recipe.RecipeIngredients.Any(row => nonLactoOvoIds.Contains(row.IngredientId)))));
        var ordered = request.CalorieSort switch
        {
            "asc" => prioritized.ThenBy(x => !x.CaloriesPerServing.HasValue)
                .ThenBy(x => x.CaloriesPerServing).ThenBy(x => x.Name).ThenBy(x => x.Id),
            "desc" => prioritized.ThenBy(x => !x.CaloriesPerServing.HasValue)
                .ThenByDescending(x => x.CaloriesPerServing).ThenBy(x => x.Name).ThenBy(x => x.Id),
            _ => prioritized.ThenBy(x => x.Name).ThenBy(x => x.Id)
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
