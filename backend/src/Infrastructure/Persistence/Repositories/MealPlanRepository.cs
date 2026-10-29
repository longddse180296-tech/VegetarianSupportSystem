// Chức năng: thực đơn bảy ngày và danh sách đi chợ. Tầng Infrastructure thực hiện truy vấn, lưu trữ hoặc giao tiếp dịch vụ ngoài.
using Application.Features.MealPlans;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

// MealPlanRepository: thực hiện truy vấn và lưu dữ liệu của tính năng qua EF Core.
public sealed class MealPlanRepository(AppDbContext db) : IMealPlanRepository
{
    // GetProfileAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public Task<UserProfile?> GetProfileAsync(string userId, CancellationToken ct) =>
        db.UserProfiles.AsNoTracking()
            .Include(profile => profile.Allergies)
            .Include(profile => profile.AvoidedFoods)
            .SingleOrDefaultAsync(profile => profile.UserId == userId, ct);

    // GetActiveRecipesAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<IReadOnlyList<Recipe>> GetActiveRecipesAsync(CancellationToken ct) =>
        await RecipesWithIngredients().AsNoTracking().Where(recipe => recipe.IsActive)
            .OrderBy(recipe => recipe.Name).ToListAsync(ct);

    // GetRecipeImagesAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<IReadOnlyDictionary<Guid, string?>> GetRecipeImagesAsync(
        IReadOnlyCollection<Guid> recipeIds, CancellationToken ct)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (recipeIds.Count == 0) return new Dictionary<Guid, string?>();

        return await db.Recipes.AsNoTracking()
            .Where(recipe => recipeIds.Contains(recipe.Id))
            .Select(recipe => new { recipe.Id, recipe.ImageUrl })
            .ToDictionaryAsync(recipe => recipe.Id, recipe => recipe.ImageUrl, ct);
    }

    // GetPantryAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<IReadOnlyList<PantryItem>> GetPantryAsync(string userId, CancellationToken ct) =>
        await db.PantryItems.AsNoTracking().Where(item => item.UserId == userId).ToListAsync(ct);

    // GetAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public Task<MealPlan?> GetAsync(Guid id, string userId, CancellationToken ct) =>
        db.MealPlans
            .Include(plan => plan.Meals).ThenInclude(meal => meal.Ingredients)
            .Include(plan => plan.ShoppingItems)
            .AsSplitQuery()
            .SingleOrDefaultAsync(plan => plan.Id == id && plan.UserId == userId, ct);

    // ListAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<(IReadOnlyList<MealPlan> Items, int TotalCount)> ListAsync(
        string userId, MealPlanListQuery query, CancellationToken ct)
    {
        var plans = db.MealPlans.AsNoTracking().Where(plan => plan.UserId == userId);
        var total = await plans.CountAsync(ct);
        var items = await plans.Include(plan => plan.Meals)
            .OrderByDescending(plan => plan.WeekStartDate).ThenByDescending(plan => plan.CreatedAt)
            .Skip((query.Page - 1) * query.PageSize).Take(query.PageSize)
            .AsSplitQuery().ToListAsync(ct);
        return (items, total);
    }

    // GetUsableRecipeAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public Task<Recipe?> GetUsableRecipeAsync(Guid id, CancellationToken ct) =>
        RecipesWithIngredients().AsNoTracking()
            .SingleOrDefaultAsync(recipe => recipe.Id == id && recipe.IsActive, ct);

    // Add: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public void Add(MealPlan plan) => db.MealPlans.Add(plan);

    // Remove: Xóa dữ liệu trong phạm vi cho phép và xử lý các liên kết liên quan.
    public void Remove(MealPlan plan) => db.MealPlans.Remove(plan);

    // SaveAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public Task SaveAsync(CancellationToken ct) => db.SaveChangesAsync(ct);

    // RecipesWithIngredients: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private IQueryable<Recipe> RecipesWithIngredients() => db.Recipes
        .Include(recipe => recipe.RecipeIngredients)
        .ThenInclude(recipeIngredient => recipeIngredient.Ingredient)
        .AsSplitQuery();
}
