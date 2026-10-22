using System.ComponentModel.DataAnnotations;
using Application.Features.MealPlans;
using Domain.Entities;

namespace Domain.Tests;

public sealed class MealPlanShoppingListTests
{
    [Fact]
    public async Task DailyShoppingAllocatesPantryOnceAcrossDays()
    {
        var ingredientId = Guid.NewGuid();
        var item = new MealPlanShoppingItem
        {
            IngredientId = ingredientId, IngredientName = "Đậu hũ", Unit = "g",
            RequiredQuantity = 140, PantryQuantity = 70, QuantityToBuy = 70, IsPurchased = true
        };
        var plan = new MealPlan
        {
            UserId = "user",
            ShoppingItems = new List<MealPlanShoppingItem> { item },
            Meals = new List<MealPlanMeal>
            {
                Meal(1, ingredientId, 60),
                Meal(2, ingredientId, 80)
            }
        };
        var service = new MealPlanService(new MemoryMealPlans(plan));

        var first = Assert.Single(await service.GetShoppingListAsync("user", plan.Id, 1, default));
        var second = Assert.Single(await service.GetShoppingListAsync("user", plan.Id, 2, default));
        var week = Assert.Single(await service.GetShoppingListAsync("user", plan.Id, null, default));

        Assert.Equal((60m, 60m, 0m), (first.RequiredQuantity, first.PantryQuantity, first.QuantityToBuy));
        Assert.Equal((80m, 10m, 70m), (second.RequiredQuantity, second.PantryQuantity, second.QuantityToBuy));
        Assert.Equal(week.QuantityToBuy, first.QuantityToBuy + second.QuantityToBuy);
        Assert.Equal(item.Id, second.Id);
        Assert.True(second.IsPurchased);
        Assert.Empty(await service.GetShoppingListAsync("user", plan.Id, 3, default));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(8)]
    public async Task ShoppingListRejectsDayOutsidePlan(int day)
    {
        var plan = new MealPlan { UserId = "user" };
        var service = new MealPlanService(new MemoryMealPlans(plan));

        await Assert.ThrowsAsync<ValidationException>(() => service.GetShoppingListAsync("user", plan.Id, day, default));
    }

    [Fact]
    public async Task DeleteOnlyRemovesTheCallersPlan()
    {
        var plan = new MealPlan { UserId = "owner" };
        var repository = new MemoryMealPlans(plan);
        var service = new MealPlanService(repository);

        await Assert.ThrowsAsync<KeyNotFoundException>(() => service.DeleteAsync("other", plan.Id, default));
        Assert.False(repository.Deleted);

        await service.DeleteAsync("owner", plan.Id, default);

        Assert.True(repository.Deleted);
        Assert.Null(await repository.GetAsync(plan.Id, "owner", default));
    }

    private static MealPlanMeal Meal(int day, Guid ingredientId, decimal quantity) => new()
    {
        DayNumber = day,
        Ingredients = new List<MealPlanMealIngredient>
        {
            new() { IngredientId = ingredientId, IngredientName = "Đậu hũ", Unit = "g", Quantity = quantity }
        }
    };

    private sealed class MemoryMealPlans(MealPlan plan) : IMealPlanRepository
    {
        public bool Deleted { get; private set; }
        public Task<MealPlan?> GetAsync(Guid id, string userId, CancellationToken ct) =>
            Task.FromResult<MealPlan?>(!Deleted && id == plan.Id && userId == plan.UserId ? plan : null);
        public Task<UserProfile?> GetProfileAsync(string userId, CancellationToken ct) => Task.FromResult<UserProfile?>(null);
        public Task<IReadOnlyList<Recipe>> GetActiveRecipesAsync(CancellationToken ct) => Task.FromResult<IReadOnlyList<Recipe>>([]);
        public Task<IReadOnlyDictionary<Guid, string?>> GetRecipeImagesAsync(IReadOnlyCollection<Guid> recipeIds, CancellationToken ct) => Task.FromResult<IReadOnlyDictionary<Guid, string?>>(new Dictionary<Guid, string?>());
        public Task<IReadOnlyList<PantryItem>> GetPantryAsync(string userId, CancellationToken ct) => Task.FromResult<IReadOnlyList<PantryItem>>([]);
        public Task<(IReadOnlyList<MealPlan> Items, int TotalCount)> ListAsync(string userId, MealPlanListQuery query, CancellationToken ct) => Task.FromResult<(IReadOnlyList<MealPlan>, int)>(([], 0));
        public Task<Recipe?> GetUsableRecipeAsync(Guid id, CancellationToken ct) => Task.FromResult<Recipe?>(null);
        public void Add(MealPlan added) { }
        public void Remove(MealPlan removed) => Deleted = removed.Id == plan.Id;
        public Task SaveAsync(CancellationToken ct) => Task.CompletedTask;
    }
}
