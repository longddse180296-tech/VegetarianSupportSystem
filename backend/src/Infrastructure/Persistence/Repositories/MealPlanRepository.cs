// BE2-09 | Triển khai truy vấn và lưu dữ liệu EF Core cho lịch tuần và bản chụp món, nguyên liệu, số lượng mua.
// Đọc và ghi thực đơn theo ngày và bữa cùng danh sách mua sắm bằng EF Core.
using Application.Features.MealPlans;
using Application.Common.Exceptions;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

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

    public async Task<IReadOnlyDictionary<Guid, DateOnly>> GetRecipeUsageAsync(string userId, DateOnly beforeDate, CancellationToken ct) =>
        await db.MealPlans.AsNoTracking()
            .Where(plan => plan.UserId == userId && plan.WeekStartDate < beforeDate)
            .SelectMany(plan => plan.Meals.Select(meal => new { meal.RecipeId, plan.WeekStartDate }))
            .GroupBy(row => row.RecipeId)
            .Select(group => new { RecipeId = group.Key, LastUsed = group.Max(row => row.WeekStartDate) })
            .ToDictionaryAsync(row => row.RecipeId, row => row.LastUsed, ct);

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
    public async Task SaveNewAsync(MealPlan plan, CancellationToken ct)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        // Cùng một tài khoản chỉ có một yêu cầu tạo lịch được kiểm tra và lưu tại một thời điểm.
        var resource = "MealPlanSchedule:" + Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(plan.UserId)));
        await db.Database.ExecuteSqlInterpolatedAsync($@"
            DECLARE @result int;
            EXEC @result = sp_getapplock @Resource={resource}, @LockMode='Exclusive',
                @LockOwner='Transaction', @LockTimeout=10000;
            IF @result < 0 THROW 51000, 'Cannot lock meal plan schedule. Please retry.', 1;", ct);
        var earliest = plan.WeekStartDate.AddDays(-6);
        var lastDay = plan.WeekStartDate.AddDays(6);
        var overlapping = await db.MealPlans.AsNoTracking()
            .Where(existing => existing.UserId == plan.UserId &&
                existing.WeekStartDate >= earliest && existing.WeekStartDate <= lastDay)
            .OrderBy(existing => existing.WeekStartDate)
            .FirstOrDefaultAsync(ct);
        if (overlapping is not null)
            throw new ConflictException($"Bạn đã có thực đơn từ {overlapping.WeekStartDate:dd/MM/yyyy} đến {overlapping.WeekStartDate.AddDays(6):dd/MM/yyyy}. Vui lòng chọn 7 ngày không trùng với lịch đã lưu.");
        db.MealPlans.Add(plan);
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
    }

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
