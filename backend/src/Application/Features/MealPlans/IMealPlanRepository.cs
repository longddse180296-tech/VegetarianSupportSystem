using Domain.Entities;

namespace Application.Features.MealPlans;
public interface IMealPlanRepository
{
    Task<UserProfile?> GetProfileAsync(string userId, CancellationToken ct);
    Task<IReadOnlyList<Recipe>> GetActiveRecipesAsync(CancellationToken ct);
    Task<IReadOnlyList<PantryItem>> GetPantryAsync(string userId, CancellationToken ct);
    Task<MealPlan?> GetAsync(Guid id, string userId, CancellationToken ct);
    Task<(IReadOnlyList<MealPlan> Items, int TotalCount)> ListAsync(string userId, MealPlanListQuery query, CancellationToken ct);
    Task<Recipe?> GetUsableRecipeAsync(Guid id, CancellationToken ct);
    void Add(MealPlan plan); Task SaveAsync(CancellationToken ct);
}
