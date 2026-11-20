// Kiểm thử cách tính lượng cần mua từ thực đơn và tủ bếp.
// BE2-09 | Kiểm tra cách tổng hợp và phân bổ lượng nguyên liệu cần mua theo thực đơn.
using System.ComponentModel.DataAnnotations;
using Application.Features.MealPlans;
using Domain.Entities;
using Domain.Enums;

namespace Domain.Tests;

public sealed class MealPlanShoppingListTests
{
    [Fact]
    public async Task NewWeeksUseUnseenRecipesBeforeRepeatingAndStillRespectTheProfile()
    {
        var profile = UserProfile.Create("user", DateTimeOffset.UtcNow);
        profile.SetDiet(VegetarianDiet.Vegan, DateTimeOffset.UtcNow);
        var plant = new Ingredient {  };
        var egg = new Ingredient { ContainsEgg = true };
        var catalog = Enumerable.Range(1, 100).Select(index => RecipeFor("Món " + index, plant)).ToArray();
        var repository = new MemoryMealPlans(new MealPlan { UserId = "user" })
        {
            Profile = profile,
            Catalog = catalog.Append(RecipeFor("Trứng", egg)).ToArray()
        };
        var service = new MealPlanService(repository, new FixedClock());
        var used = new HashSet<Guid>();
        for (var week = 0; week < 5; week++)
        {
            var result = await service.GenerateAsync("user", new MealPlanGenerateRequest
            {
                Name = "Tuần " + week, WeekStartDate = new DateOnly(2026, 11, 23).AddDays(week * 7)
            }, default);
            var selected = result.Meals.Select(meal => meal.RecipeId).ToHashSet();
            Assert.Equal(21, result.Meals.Count);
            Assert.Equal(21, selected.Count);
            Assert.All(selected, id => Assert.Contains(catalog, recipe => recipe.Id == id));
            Assert.Equal(week < 4 ? 21 : 16, selected.Except(used).Count());
            used.UnionWith(selected);
        }
        Assert.Equal(100, used.Count);
    }

    [Fact]
    public async Task SmallCatalogUsesEverySuitableRecipeBeforeRepeating()
    {
        var profile = UserProfile.Create("user", DateTimeOffset.UtcNow);
        profile.SetDiet(VegetarianDiet.Vegan, DateTimeOffset.UtcNow);
        var ingredient = new Ingredient {  };
        var repository = new MemoryMealPlans(new MealPlan { UserId = "user" })
        {
            Profile = profile,
            Catalog = Enumerable.Range(1, 10).Select(index => RecipeFor("Món " + index, ingredient)).ToArray()
        };
        var result = await new MealPlanService(repository, new FixedClock()).GenerateAsync("user",
            new MealPlanGenerateRequest { Name = "Tuần", WeekStartDate = new DateOnly(2026, 11, 23) }, default);
        var counts = result.Meals.GroupBy(meal => meal.RecipeId).Select(group => group.Count()).ToArray();
        Assert.Equal(21, result.Meals.Count);
        Assert.Equal(10, counts.Length);
        Assert.InRange(counts.Max() - counts.Min(), 0, 1);
    }

    [Fact]
    public async Task SavedMealWarningsTrackIngredientChangesAndReplacement()
    {
        var profile = UserProfile.Create("user", DateTimeOffset.UtcNow);
        profile.SetDiet(VegetarianDiet.Vegan, DateTimeOffset.UtcNow);
        var ingredient = new Ingredient {  };
        var original = RecipeFor("Original", ingredient);
        original.DeclaredDietaryType = DietaryType.Vegan;
        var replacement = RecipeFor("Replacement", new Ingredient {  });
        var plan = new MealPlan
        {
            UserId = "user", ProfileDiet = VegetarianDiet.Vegan, WeekStartDate = new DateOnly(2026, 11, 23),
            Meals = [new MealPlanMeal { DayNumber = 1, Slot = MealSlot.Breakfast,
                RecipeId = original.Id, RecipeName = original.Name, Servings = 1 }]
        };
        var service = new MealPlanService(new MemoryMealPlans(plan) { Profile = profile, Catalog = [original, replacement] }, new FixedClock());
        Assert.Null(Assert.Single((await service.GetAsync("user", plan.Id, default)).Meals).AvailabilityWarning);
        ingredient.ContainsEgg = true;
        Assert.Null(Assert.Single((await service.GetAsync("user", plan.Id, default)).Meals).AvailabilityWarning);
        original.DeclaredDietaryType = DietaryType.OvoVegetarian;
        Assert.NotNull(Assert.Single((await service.GetAsync("user", plan.Id, default)).Meals).AvailabilityWarning);
        var result = await service.ReplaceMealAsync("user", plan.Id, 1, MealSlot.Breakfast,
            new MealReplacementRequest { RecipeId = replacement.Id }, default);
        Assert.Null(Assert.Single(result.Meals).AvailabilityWarning);
        Assert.Equal(replacement.Id, Assert.Single(result.Meals).RecipeId);
    }

    private static Recipe RecipeFor(string name, Ingredient ingredient) => new()
    {
        Servings = 1,
        Name = name,
        RecipeIngredients = [new RecipeIngredient { IngredientId = ingredient.Id, Ingredient = ingredient, Quantity = 100, Unit = "g" }]
    };

    [Fact]
    public async Task CreatingAndCopyingRejectPastDatesUsingVietnamCalendar()
    {
        var plan = new MealPlan { UserId = "user" };
        // 17:30 UTC ngày 19 là 00:30 ngày 20 tại Việt Nam.
        var service = new MealPlanService(new MemoryMealPlans(plan), new FixedClock());
        var yesterday = new DateOnly(2026, 11, 19);
        var today = new DateOnly(2026, 11, 20);
        await Assert.ThrowsAsync<ValidationException>(() => service.GenerateAsync("user",
            new MealPlanGenerateRequest { Name = "Past", WeekStartDate = yesterday }, default));
        await Assert.ThrowsAsync<ValidationException>(() => service.CopyToWeekAsync("user", plan.Id,
            new MealPlanCopyToWeekRequest { WeekStartDate = yesterday }, default));
        var current = await service.CopyToWeekAsync("user", plan.Id,
            new MealPlanCopyToWeekRequest { WeekStartDate = today }, default);
        Assert.Equal(today, current.WeekStartDate);
        var future = await service.CopyToWeekAsync("user", plan.Id,
            new MealPlanCopyToWeekRequest { WeekStartDate = today.AddDays(7) }, default);
        Assert.Equal(today.AddDays(7), future.WeekStartDate);
    }

    private sealed class FixedClock : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => new(2026, 11, 19, 17, 30, 0, TimeSpan.Zero);
    }

    [Theory]
    [InlineData(0, 60)]
    [InlineData(20, 40)]
    [InlineData(60, 0)]
    public async Task EnteringAvailableQuantityCalculatesShortfallForSelectedDay(decimal available, decimal toBuy)
    {
        var ingredientId = Guid.NewGuid();
        var item = new MealPlanShoppingItem
        {
            IngredientId = ingredientId, IngredientName = "Đậu hũ", Unit = "g",
            RequiredQuantity = 140, QuantityToBuy = 140
        };
        var plan = new MealPlan
        {
            UserId = "user", ShoppingItems = [item],
            Meals = [Meal(1, ingredientId, 60), Meal(2, ingredientId, 80)]
        };
        var service = new MealPlanService(new MemoryMealPlans(plan));
        await service.UpdatePurchaseAsync("user", plan.Id, item.Id,
            new ShoppingPurchaseRequest { Day = 1, PantryQuantity = available }, default);
        var selected = Assert.Single(await service.GetShoppingListAsync("user", plan.Id, 1, default));
        var other = Assert.Single(await service.GetShoppingListAsync("user", plan.Id, 2, default));
        Assert.Equal((available, toBuy), (selected.PantryQuantity, selected.QuantityToBuy));
        Assert.Equal((0m, 80m), (other.PantryQuantity, other.QuantityToBuy));
        await service.UpdatePurchaseAsync("user", plan.Id, item.Id,
            new ShoppingPurchaseRequest { PantryQuantity = 100 }, default);
        var week = Assert.Single(await service.GetShoppingListAsync("user", plan.Id, null, default));
        Assert.Equal((100m, 40m), (week.PantryQuantity, week.QuantityToBuy));
    }

    [Fact]
    public async Task DailyReconciliationAndPurchaseAffectOnlySelectedDayAndPersistInWeeklyTotals()
    {
        var ingredientId = Guid.NewGuid();
        var item = new MealPlanShoppingItem
        {
            IngredientId = ingredientId, IngredientName = "Đậu hũ", Unit = "g",
            RequiredQuantity = 140, PantryQuantity = 0, QuantityToBuy = 140
        };
        var plan = new MealPlan
        {
            UserId = "user", ShoppingItems = [item],
            Meals = [Meal(1, ingredientId, 60), Meal(2, ingredientId, 80)]
        };
        var repository = new MemoryMealPlans(plan);
        var service = new MealPlanService(repository);
        await service.UpdatePurchaseAsync("user", plan.Id, item.Id,
            new ShoppingPurchaseRequest { Day = 1, QuantityToBuy = 20 }, default);
        await service.UpdatePurchaseAsync("user", plan.Id, item.Id,
            new ShoppingPurchaseRequest { Day = 1, IsPurchased = true }, default);

        // Đọc lại qua service mới để kiểm tra dữ liệu ngày đã được lưu trên entity.
        service = new MealPlanService(repository);
        var first = Assert.Single(await service.GetShoppingListAsync("user", plan.Id, 1, default));
        var second = Assert.Single(await service.GetShoppingListAsync("user", plan.Id, 2, default));
        var week = Assert.Single(await service.GetShoppingListAsync("user", plan.Id, null, default));
        Assert.Equal((60m, 40m, 20m, true), (first.RequiredQuantity, first.PantryQuantity, first.QuantityToBuy, first.IsPurchased));
        Assert.Equal((80m, 0m, 80m, false), (second.RequiredQuantity, second.PantryQuantity, second.QuantityToBuy, second.IsPurchased));
        Assert.Equal((140m, 40m, 100m, false), (week.RequiredQuantity, week.PantryQuantity, week.QuantityToBuy, week.IsPurchased));

        await Assert.ThrowsAsync<ValidationException>(() => service.UpdatePurchaseAsync("user", plan.Id, item.Id,
            new ShoppingPurchaseRequest { Day = 1, QuantityToBuy = 61 }, default));
        await Assert.ThrowsAsync<ValidationException>(() => service.UpdatePurchaseAsync("user", plan.Id, item.Id,
            new ShoppingPurchaseRequest { Day = 3, QuantityToBuy = 1 }, default));
        await Assert.ThrowsAsync<ValidationException>(() => service.UpdatePurchaseAsync("user", plan.Id, item.Id,
            new ShoppingPurchaseRequest { Day = 8, IsPurchased = true }, default));
        await service.UpdatePurchaseAsync("user", plan.Id, item.Id,
            new ShoppingPurchaseRequest { Day = 2, IsPurchased = true }, default);
        Assert.True(Assert.Single(await service.GetShoppingListAsync("user", plan.Id, null, default)).IsPurchased);

        await service.UpdatePurchaseAsync("user", plan.Id, item.Id,
            new ShoppingPurchaseRequest { IsPurchased = false }, default);
        Assert.False(Assert.Single(await service.GetShoppingListAsync("user", plan.Id, 1, default)).IsPurchased);
        await service.UpdatePurchaseAsync("user", plan.Id, item.Id,
            new ShoppingPurchaseRequest { QuantityToBuy = 70 }, default);
        Assert.Equal(0m, Assert.Single(await service.GetShoppingListAsync("user", plan.Id, 1, default)).QuantityToBuy);
        Assert.Equal(70m, Assert.Single(await service.GetShoppingListAsync("user", plan.Id, 2, default)).QuantityToBuy);
    }

    [Fact]
    public async Task ReconciliationSavesShortfallWithoutCheckingPurchasedAndAllocatesPantryAcrossDays()
    {
        var ingredientId = Guid.NewGuid();
        var item = new MealPlanShoppingItem
        {
            IngredientId = ingredientId, IngredientName = "Đậu hũ", Unit = "g",
            RequiredQuantity = 140, PantryQuantity = 0, QuantityToBuy = 140, IsPurchased = true
        };
        var plan = new MealPlan
        {
            UserId = "user", ShoppingItems = [item],
            Meals = [Meal(1, ingredientId, 60), Meal(2, ingredientId, 80)]
        };
        var service = new MealPlanService(new MemoryMealPlans(plan));

        var updated = Assert.Single(await service.UpdatePurchaseAsync("user", plan.Id, item.Id,
            new ShoppingPurchaseRequest { QuantityToBuy = 50 }, default));
        Assert.Equal((90m, 50m, false), (updated.PantryQuantity, updated.QuantityToBuy, updated.IsPurchased));
        var first = Assert.Single(await service.GetShoppingListAsync("user", plan.Id, 1, default));
        var second = Assert.Single(await service.GetShoppingListAsync("user", plan.Id, 2, default));
        Assert.Equal((60m, 0m), (first.PantryQuantity, first.QuantityToBuy));
        Assert.Equal((30m, 50m), (second.PantryQuantity, second.QuantityToBuy));

        var purchased = Assert.Single(await service.UpdatePurchaseAsync("user", plan.Id, item.Id,
            new ShoppingPurchaseRequest { IsPurchased = true }, default));
        Assert.Equal((90m, 50m, true), (purchased.PantryQuantity, purchased.QuantityToBuy, purchased.IsPurchased));
        var enough = Assert.Single(await service.UpdatePurchaseAsync("user", plan.Id, item.Id,
            new ShoppingPurchaseRequest { QuantityToBuy = 0 }, default));
        Assert.Equal((140m, 0m, false), (enough.PantryQuantity, enough.QuantityToBuy, enough.IsPurchased));
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(141)]
    [InlineData(0.0001)]
    public async Task ReconciliationRejectsInvalidAmountsWithoutChangingSavedQuantities(decimal quantity)
    {
        var item = new MealPlanShoppingItem { RequiredQuantity = 140, PantryQuantity = 40, QuantityToBuy = 100 };
        var plan = new MealPlan { UserId = "owner", ShoppingItems = [item] };
        var service = new MealPlanService(new MemoryMealPlans(plan));
        await Assert.ThrowsAsync<ValidationException>(() => service.UpdatePurchaseAsync("owner", plan.Id, item.Id,
            new ShoppingPurchaseRequest { QuantityToBuy = quantity }, default));
        Assert.Equal((40m, 100m), (item.PantryQuantity, item.QuantityToBuy));
        await Assert.ThrowsAsync<KeyNotFoundException>(() => service.UpdatePurchaseAsync("other", plan.Id, item.Id,
            new ShoppingPurchaseRequest { QuantityToBuy = 0 }, default));
    }

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

    [Fact]
    public async Task ExportsExcludePastAndCompletedMealsAndRestoreAfterUndo()
    {
        var ingredientId = Guid.NewGuid();
        var item = new MealPlanShoppingItem { IngredientId = ingredientId, IngredientName = "Đậu hũ", Unit = "g", RequiredQuantity = 100, PantryQuantity = 15, QuantityToBuy = 85 };
        var past = Meal(1, ingredientId, 10);
        var completed = Meal(2, ingredientId, 20); completed.CheckedInAt = DateTimeOffset.UtcNow;
        var pending = Meal(2, ingredientId, 30); pending.Slot = MealSlot.Lunch; pending.CaloriesPerServing = 300;
        var future = Meal(3, ingredientId, 40); future.CaloriesPerServing = 400;
        var plan = new MealPlan { UserId = "user", ProfileDiet = VegetarianDiet.Vegan, WeekStartDate = new DateOnly(2026, 11, 19),
            Meals = [past, completed, pending, future], ShoppingItems = [item] };
        var service = new MealPlanService(new MemoryMealPlans(plan), new FixedClock());
        Assert.Empty(await service.GetShoppingListAsync("user", plan.Id, 1, default));
        var week = Assert.Single(await service.GetShoppingListAsync("user", plan.Id, null, default));
        Assert.Equal((70m, 0m, 70m), (week.RequiredQuantity, week.PantryQuantity, week.QuantityToBuy));
        var export = await service.GetExportAsync("user", plan.Id, null, default);
        Assert.Equal(new[] { pending.Id, future.Id }, export.Meals.Select(x => x.Id));
        Assert.Equal(700m, export.Nutrition.Calories);
        Assert.Single((await service.GetExportAsync("user", plan.Id, 2, default)).Meals);
        await Assert.ThrowsAsync<ValidationException>(() => service.GetExportAsync("user", plan.Id, 1, default));
        await service.UpdatePurchaseAsync("user", plan.Id, item.Id, new ShoppingPurchaseRequest { PantryQuantity = 35 }, default);
        Assert.Equal(35m, Assert.Single(await service.GetShoppingListAsync("user", plan.Id, null, default)).QuantityToBuy);
        completed.CheckedInAt = null;
        Assert.Equal(90m, Assert.Single(await service.GetShoppingListAsync("user", plan.Id, null, default)).RequiredQuantity);
        Assert.Equal(3, (await service.GetExportAsync("user", plan.Id, null, default)).Meals.Count);
        past.CheckedInAt = null; plan.WeekStartDate = new DateOnly(2026, 10, 1);
        Assert.Empty(await service.GetShoppingListAsync("user", plan.Id, null, default));
        await Assert.ThrowsAsync<ValidationException>(() => service.GetExportAsync("user", plan.Id, null, default));
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
        public UserProfile? Profile { get; init; }
        public IReadOnlyList<Recipe> Catalog { get; init; } = [];
        private readonly Dictionary<Guid, DateOnly> usage = new();
        public bool Deleted { get; private set; }
        public Task<MealPlan?> GetAsync(Guid id, string userId, CancellationToken ct) =>
            Task.FromResult<MealPlan?>(!Deleted && id == plan.Id && userId == plan.UserId ? WithDate(plan) : null);
        private static MealPlan WithDate(MealPlan value)
        {
            if (value.WeekStartDate == default) value.WeekStartDate = DateOnly.FromDateTime(DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(7)).DateTime);
            return value;
        }
        public Task<UserProfile?> GetProfileAsync(string userId, CancellationToken ct) => Task.FromResult(Profile);
        public Task<IReadOnlyList<Recipe>> GetActiveRecipesAsync(CancellationToken ct) => Task.FromResult(Catalog);
        public Task<IReadOnlyDictionary<Guid, DateOnly>> GetRecipeUsageAsync(string userId, DateOnly beforeDate, CancellationToken ct) =>
            Task.FromResult<IReadOnlyDictionary<Guid, DateOnly>>(usage.Where(pair => pair.Value < beforeDate).ToDictionary());
        public Task<IReadOnlyDictionary<Guid, string?>> GetRecipeImagesAsync(IReadOnlyCollection<Guid> recipeIds, CancellationToken ct) => Task.FromResult<IReadOnlyDictionary<Guid, string?>>(new Dictionary<Guid, string?>());
        public Task<IReadOnlyList<PantryItem>> GetPantryAsync(string userId, CancellationToken ct) => Task.FromResult<IReadOnlyList<PantryItem>>([]);
        public Task<(IReadOnlyList<MealPlan> Items, int TotalCount)> ListAsync(string userId, MealPlanListQuery query, CancellationToken ct) => Task.FromResult<(IReadOnlyList<MealPlan>, int)>(([], 0));
        public Task<Recipe?> GetUsableRecipeAsync(Guid id, CancellationToken ct) =>
            Task.FromResult(Catalog.SingleOrDefault(recipe => recipe.Id == id && recipe.IsActive));
        public Task SaveNewAsync(MealPlan added, CancellationToken ct)
        {
            foreach (var meal in added.Meals) usage[meal.RecipeId] = added.WeekStartDate;
            return Task.CompletedTask;
        }
        public void Remove(MealPlan removed) => Deleted = removed.Id == plan.Id;
        public Task SaveAsync(CancellationToken ct) => Task.CompletedTask;
    }
}
