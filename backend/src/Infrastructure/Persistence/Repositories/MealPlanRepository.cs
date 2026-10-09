using Application.Features.MealPlans;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public sealed class MealPlanRepository(AppDbContext db) : IMealPlanRepository
{
    public Task<UserProfile?> GetProfileAsync(string userId, CancellationToken ct) =>
        db.UserProfiles.AsNoTracking()
            .Include(profile => profile.Allergies)
            .Include(profile => profile.AvoidedFoods)
            .SingleOrDefaultAsync(profile => profile.UserId == userId, ct);

    public async Task<IReadOnlyList<Recipe>> GetActiveRecipesAsync(CancellationToken ct) =>
        await RecipesWithIngredients().AsNoTracking().Where(recipe => recipe.IsActive)
            .OrderBy(recipe => recipe.Name).ToListAsync(ct);

    public async Task<IReadOnlyList<PantryItem>> GetPantryAsync(string userId, CancellationToken ct) =>
        await db.PantryItems.AsNoTracking().Where(item => item.UserId == userId).ToListAsync(ct);

    public Task<MealPlan?> GetAsync(Guid id, string userId, CancellationToken ct) =>
        db.MealPlans
            .Include(plan => plan.Meals).ThenInclude(meal => meal.Ingredients)
            .Include(plan => plan.ShoppingItems)
            .AsSplitQuery()
            .SingleOrDefaultAsync(plan => plan.Id == id && plan.UserId == userId, ct);

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

    public Task<Recipe?> GetUsableRecipeAsync(Guid id, CancellationToken ct) =>
        RecipesWithIngredients().AsNoTracking()
            .SingleOrDefaultAsync(recipe => recipe.Id == id && recipe.IsActive, ct);

    public void Add(MealPlan plan) => db.MealPlans.Add(plan);

    public Task SaveAsync(CancellationToken ct) => db.SaveChangesAsync(ct);

    private IQueryable<Recipe> RecipesWithIngredients() => db.Recipes
        .Include(recipe => recipe.RecipeIngredients)
        .ThenInclude(recipeIngredient => recipeIngredient.Ingredient)
        .AsSplitQuery();
}
