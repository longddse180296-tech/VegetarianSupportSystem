using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using Application.Common.Exceptions;
using Application.Common.Validation;
using Domain.Entities;
using Domain.Enums;
using Domain.Rules;

namespace Application.Features.MealPlans;

public sealed partial class MealPlanService
{
    private DateOnly Today() => DateOnly.FromDateTime((clock ?? TimeProvider.System).GetUtcNow().ToOffset(TimeSpan.FromHours(7)).DateTime);
    private bool IsPending(MealPlan plan, MealPlanMeal meal) => !meal.CheckedInAt.HasValue && plan.WeekStartDate.AddDays(meal.DayNumber - 1) >= Today();
    private void EnsureEditable(MealPlan plan, MealPlanMeal meal)
    {
        if (!IsPending(plan, meal)) throw new ConflictException("Bữa đã thực hiện hoặc đã qua ngày không thể đổi món.");
    }

    // Chỉ so ngày dự kiến với mục tiêu một lần; không cộng thêm phần tăng/giảm cân ở FE.
    private static (decimal Calories, decimal Protein, decimal Carbs, decimal Fat) Sum(IEnumerable<MealPlanMeal> meals) =>
        (meals.Sum(x => (x.CaloriesPerServing ?? 0) * x.Servings), meals.Sum(x => (x.ProteinGramPerServing ?? 0) * x.Servings),
         meals.Sum(x => (x.CarbohydrateGramPerServing ?? 0) * x.Servings), meals.Sum(x => (x.FatGramPerServing ?? 0) * x.Servings));
    private static bool Near(IEnumerable<MealPlanMeal> meals, DailyNutritionTarget target)
    {
        var total = Sum(meals);
        return MealNutritionSelector.IsNearTarget(total.Calories, total.Protein, total.Carbs, total.Fat, target);
    }
    private static bool NutritionChanged(MealPlanMeal meal, Recipe recipe) =>
        meal.CaloriesPerServing != recipe.CaloriesPerServing || meal.ProteinGramPerServing != recipe.ProteinGramPerServing ||
        meal.CarbohydrateGramPerServing != recipe.CarbohydrateGramPerServing || meal.FatGramPerServing != recipe.FatGramPerServing;
    private static string IngredientKey(MealPlanMeal meal) => string.Join("|", meal.Ingredients.OrderBy(x => x.IngredientId)
        .Select(x => $"{x.IngredientId}:{x.Quantity}:{x.Unit}:{x.IngredientName}"));
    private static void UpdateSnapshot(MealPlanMeal meal, Recipe recipe)
    {
        var fresh = Snapshot(recipe, meal.DayNumber, meal.Slot, 1, meal.SwapCount);
        meal.RecipeName = fresh.RecipeName; meal.ImageUrl = fresh.ImageUrl; meal.TotalTimeMinutes = fresh.TotalTimeMinutes;
        meal.CaloriesPerServing = fresh.CaloriesPerServing; meal.ProteinGramPerServing = fresh.ProteinGramPerServing;
        meal.CarbohydrateGramPerServing = fresh.CarbohydrateGramPerServing; meal.FatGramPerServing = fresh.FatGramPerServing;
        // Giữ nguyên dòng định lượng nếu không thay đổi, tránh tạo lại khóa và dữ liệu mua sắm không cần thiết.
        if (IngredientKey(meal) != IngredientKey(fresh)) { meal.Ingredients.Clear(); foreach (var row in fresh.Ingredients) meal.Ingredients.Add(row); }
    }

    private sealed record ReviewState(ProfileSnapshot Profile, Dictionary<Guid, string> Warnings, IReadOnlyDictionary<Guid, Recipe> Recipes);
    private async Task<ReviewState> AssessCurrentAsync(MealPlan plan, CancellationToken ct, bool updateCompatible)
    {
        var saved = ReadSnapshot(plan);
        var profile = await repository.GetProfileAsync(plan.UserId, ct);
        var current = profile is not null ? ProfileSnapshot.From(profile, saved.Diet) : saved;
        var recipes = (await repository.GetActiveRecipesAsync(ct)).ToDictionary(x => x.Id);
        var warnings = new Dictionary<Guid, string>();
        var active = plan.WeekStartDate.AddDays(6) >= Today();
        foreach (var meal in plan.Meals.Where(x => !x.CheckedInAt.HasValue))
            if (!recipes.TryGetValue(meal.RecipeId, out var recipe) || !IsUsable(recipe, current, useDeclaredDiet: true))
                warnings[meal.Id] = "Công thức đang được cập nhật hoặc không còn phù hợp với hồ sơ. Vui lòng đổi món.";

        if (active)
        {
            foreach (var day in plan.Meals.GroupBy(x => x.DayNumber))
            {
                var pending = day.Where(x => IsPending(plan, x)).ToArray();
                var changed = saved.DailyNutritionTarget != current.DailyNutritionTarget ||
                    pending.Any(x => recipes.TryGetValue(x.RecipeId, out var r) && NutritionChanged(x, r));
                if (!changed || current.DailyNutritionTarget is not { } target) continue;
                var projected = day.Select(x => IsPending(plan, x) && recipes.TryGetValue(x.RecipeId, out var r)
                    ? Snapshot(r, x.DayNumber, x.Slot, 1) : x).ToArray();
                if (!Near(projected, target))
                    foreach (var meal in pending)
                        warnings.TryAdd(meal.Id, "Dinh dưỡng ngày này không còn gần mục tiêu hiện tại. Cần cập nhật các bữa chưa ăn.");
            }
        }
        var updated = false;
        if (updateCompatible && active)
        {
            foreach (var meal in plan.Meals.Where(x => IsPending(plan, x) && !warnings.ContainsKey(x.Id)))
            {
                if (!recipes.TryGetValue(meal.RecipeId, out var recipe)) continue;
                var fresh = Snapshot(recipe, meal.DayNumber, meal.Slot, 1);
                if (NutritionChanged(meal, recipe) || IngredientKey(meal) != IngredientKey(fresh) ||
                    meal.RecipeName != recipe.Name || meal.ImageUrl != recipe.ImageUrl || meal.TotalTimeMinutes != fresh.TotalTimeMinutes)
                { UpdateSnapshot(meal, recipe); updated = true; }
            }
            if (!plan.Meals.Any(x => IsPending(plan, x) && warnings.ContainsKey(x.Id)) &&
                (saved != current && plan.ProfileSnapshot != JsonSerializer.Serialize(current)))
            { plan.ProfileDiet = current.Diet; plan.ProfileSnapshot = JsonSerializer.Serialize(current); updated = true; }
            if (updated)
            {
                plan.UpdatedAt = (clock ?? TimeProvider.System).GetUtcNow();
                await RebuildPreservingShoppingAsync(plan, ct);
                await repository.SaveAsync(ct);
            }
        }
        return new(current, warnings, recipes);
    }

    public async Task<MealPlanResponse> CheckInAsync(string userId, Guid id, int day, MealSlot slot, CancellationToken ct)
    {
        var plan = await FindAsync(userId, id, ct);
        var meal = plan.Meals.SingleOrDefault(x => x.DayNumber == day && x.Slot == slot)
            ?? throw new KeyNotFoundException("Không tìm thấy bữa ăn.");
        if (meal.CheckedInAt.HasValue) return await MapWithAvailabilityAsync(plan, ct);
        if (plan.WeekStartDate.AddDays(day - 1) != Today()) throw new ConflictException("Chỉ đánh dấu thực hiện các bữa của hôm nay.");
        var state = await AssessCurrentAsync(plan, ct, updateCompatible: true);
        if (state.Warnings.ContainsKey(meal.Id)) throw new ConflictException("Bữa ăn cần được cập nhật trước khi đánh dấu thực hiện.");
        var now = (clock ?? TimeProvider.System).GetUtcNow();
        meal.CheckedInAt = now;
        repository.AddCheckIn(new MealCheckIn { UserId = userId, MealId = meal.Id, RecipeId = meal.RecipeId, EatenOn = Today(), CheckedInAt = now });
        plan.UpdatedAt = now;
        await repository.SaveAsync(ct);
        return await MapWithAvailabilityAsync(plan, ct);
    }

    // Hủy đánh dấu nhầm: xóa đúng nhật ký của bữa này, không ảnh hưởng những lần ăn khác cùng món.
    public async Task<MealPlanResponse> UndoCheckInAsync(string userId, Guid id, int day, MealSlot slot, CancellationToken ct)
    {
        var plan = await FindAsync(userId, id, ct);
        var meal = plan.Meals.SingleOrDefault(x => x.DayNumber == day && x.Slot == slot)
            ?? throw new KeyNotFoundException("Không tìm thấy bữa ăn.");
        if (meal.CheckedInAt.HasValue)
        {
            meal.CheckedInAt = null;
            await repository.RemoveCheckInAsync(userId, meal.Id, ct);
            plan.UpdatedAt = (clock ?? TimeProvider.System).GetUtcNow();
            await repository.SaveAsync(ct);
        }
        return await MapWithAvailabilityAsync(plan, ct);
    }

    public async Task<MealChoicePage> GetChoicesAsync(string userId, Guid id, int day, MealSlot slot, MealChoiceQuery query, CancellationToken ct)
    {
        RequestValidation.Validate(query);
        var plan = await FindAsync(userId, id, ct);
        var meal = plan.Meals.SingleOrDefault(x => x.DayNumber == day && x.Slot == slot)
            ?? throw new KeyNotFoundException("Không tìm thấy bữa ăn.");
        EnsureEditable(plan, meal);
        var profile = await repository.GetProfileAsync(userId, ct);
        var current = profile is not null ? ProfileSnapshot.From(profile, ReadSnapshot(plan).Diet) : ReadSnapshot(plan);
        var eaten = await repository.GetRecentCheckInsAsync(userId, Today().AddDays(-21), ct);
        var recipes = await repository.GetActiveRecipesAsync(ct);
        var byId = recipes.ToDictionary(x => x.Id);
        var others = plan.Meals.Where(x => x.DayNumber == day && x.Id != meal.Id)
            .Select(x => IsPending(plan, x) && byId.TryGetValue(x.RecipeId, out var currentRecipe)
                ? Snapshot(currentRecipe, x.DayNumber, x.Slot, 1) : x).ToArray();
        var search = query.Search?.Trim();
        var options = recipes.Where(x => x.Id != meal.RecipeId && (string.IsNullOrWhiteSpace(search) ||
            x.Name.Contains(search, StringComparison.OrdinalIgnoreCase) || x.RecipeIngredients.Any(r => r.Ingredient!.Name.Contains(search, StringComparison.OrdinalIgnoreCase))))
            .Select(recipe =>
            {
                var compatible = IsUsable(recipe, current);
                var projected = others.Append(Snapshot(recipe, day, slot, 1)).ToArray();
                var total = Sum(projected);
                var score = current.DailyNutritionTarget is { } t ? MealNutritionSelector.Score(total.Calories, total.Protein, total.Carbs, total.Fat, t) : 0;
                var warning = current.DailyNutritionTarget is { } target && !Near(projected, target)
                    ? "Nếu chọn món này, tổng dinh dưỡng cả ngày sẽ thấp hơn hoặc vượt mục tiêu của bạn." : null;
                return new { Score = score, Item = new MealChoiceResponse(recipe.Id, recipe.Name, recipe.ImageUrl,
                    recipe.CaloriesPerServing, recipe.ProteinGramPerServing, recipe.CarbohydrateGramPerServing, recipe.FatGramPerServing,
                    compatible, compatible ? null : IncompatibleReason(recipe, current), warning,
                    eaten.TryGetValue(recipe.Id, out var last) ? (DateOnly?)last : null) };
            }).Where(x => query.IncludeAll || x.Item.IsCompatible)
            .OrderByDescending(x => x.Item.IsCompatible).ThenBy(x => x.Item.LastEatenOn.HasValue)
            .ThenBy(x => x.Score).ThenBy(x => x.Item.Name).ToArray();
        var offset = (long)(query.Page - 1) * query.PageSize;
        return new(offset >= options.Length ? [] : options.Skip((int)offset).Take(query.PageSize).Select(x => x.Item).ToArray(),
            options.Length, query.Page, query.PageSize, current.DailyNutritionTarget);
    }

    private static string IncompatibleReason(Recipe recipe, ProfileSnapshot profile)
    {
        var ingredients = recipe.RecipeIngredients.Select(x => x.Ingredient).Where(x => x is not null).ToArray();
        if (ingredients.Any(x => !x!.IsActive)) return "Có nguyên liệu ngừng sử dụng.";
        var allergies = profile.Allergies.Where(a => ingredients.Any(x => IngredientRestrictionRules.MatchesAllergy(x!, a))).ToArray();
        if (allergies.Length > 0) return "Có dị nguyên: " + string.Join(", ", allergies) + ".";
        var avoided = profile.AvoidedFoods.Where(a => ingredients.Any(x => IngredientRestrictionRules.MatchesNameOrAlias(x!, a))).ToArray();
        if (avoided.Length > 0) return "Có thực phẩm cần tránh: " + string.Join(", ", avoided) + ".";
        return "Chưa phù hợp chế độ ăn hoặc thành phần đang cần kiểm tra.";
    }

    // Xác nhận chỉ thay các bữa chưa ăn, không viết lại bữa đã check-in hoặc lịch sử ngày trước.
    public async Task<MealPlanResponse> ApplyCurrentProfileAsync(string userId, Guid id, CancellationToken ct, bool refreshAll = false)
    {
        var plan = await FindAsync(userId, id, ct);
        if (plan.WeekStartDate.AddDays(6) < Today()) throw new ConflictException("Thực đơn đã kết thúc. Hãy áp dụng sang tuần mới.");
        var state = await AssessCurrentAsync(plan, ct, updateCompatible: false);
        var recipes = (await SelectRecipesAsync(userId, Today(), state.Profile, ct)).Where(MealNutritionSelector.HasNutrition).ToArray();
        var pendingChanges = new List<(MealPlanMeal Meal, Recipe Recipe)>();
        var usage = plan.Meals.GroupBy(x => x.RecipeId).ToDictionary(g => g.Key, g => g.Count());
        foreach (var day in plan.Meals.GroupBy(x => x.DayNumber).OrderBy(x => x.Key))
        {
            var mutable = day.Where(x => IsPending(plan, x) && (refreshAll || state.Warnings.ContainsKey(x.Id))).OrderBy(x => x.Slot).ToArray();
            if (mutable.Length == 0) continue;
            if (recipes.Length == 0) throw new ConflictException("Chưa có món phù hợp để thay thế. Các bữa đã lưu được giữ nguyên; hãy bổ sung công thức hoặc kiểm tra hồ sơ.");
            var fixedMeals = day.Where(x => !mutable.Contains(x)).Select(x =>
                IsPending(plan, x) && state.Recipes.TryGetValue(x.RecipeId, out var r) ? Snapshot(r, x.DayNumber, x.Slot, 1) : x).ToArray();
            var selected = ChooseRemaining(recipes, mutable.Length, fixedMeals, state.Profile.DailyNutritionTarget, usage);
            for (var i = 0; i < mutable.Length; i++)
            { pendingChanges.Add((mutable[i], selected[i])); usage[selected[i].Id] = usage.GetValueOrDefault(selected[i].Id) + 1; }
        }
        foreach (var (meal, recipe) in pendingChanges)
        { meal.RecipeId = recipe.Id; meal.SwapCount++; UpdateSnapshot(meal, recipe); }
        foreach (var meal in plan.Meals.Where(x => IsPending(plan, x) && !pendingChanges.Any(y => y.Meal.Id == x.Id)))
            if (state.Recipes.TryGetValue(meal.RecipeId, out var recipe) && IsUsable(recipe, state.Profile)) UpdateSnapshot(meal, recipe);
        plan.ProfileDiet = state.Profile.Diet; plan.ProfileSnapshot = JsonSerializer.Serialize(state.Profile);
        plan.UpdatedAt = (clock ?? TimeProvider.System).GetUtcNow();
        await RebuildPreservingShoppingAsync(plan, ct);
        await repository.SaveAsync(ct);
        var message = pendingChanges.Count > 0
            ? $"Đã cập nhật {pendingChanges.Count} bữa chưa ăn theo hồ sơ hiện tại. Các bữa đã thực hiện được giữ nguyên."
            : "Đã cập nhật mục tiêu và dinh dưỡng theo hồ sơ hiện tại.";
        if (state.Profile.DailyNutritionTarget is { } target && plan.Meals.GroupBy(x => x.DayNumber)
            .Any(day => day.Any(x => IsPending(plan, x)) && !Near(day, target)))
            message += " Kho món hiện tại chưa đủ để mọi ngày sát mục tiêu; hệ thống đã chọn tổ hợp gần nhất có thể.";
        return (await MapWithAvailabilityAsync(plan, ct)) with { NutritionAdjustmentMessage = message };
    }

    private static Recipe[] ChooseRemaining(Recipe[] recipes, int count, MealPlanMeal[] fixedMeals, DailyNutritionTarget? target, Dictionary<Guid, int> usage)
    {
        var pool = recipes.OrderBy(x => usage.GetValueOrDefault(x.Id) * 0.025m +
            (target is null ? 0 : MealNutritionSelector.MealDistance(x, target) ?? 100)).Take(24).ToArray();
        var fixedTotals = Sum(fixedMeals);
        var fixedIds = fixedMeals.Select(x => x.RecipeId).ToHashSet();
        var chosen = new List<Recipe>(); Recipe[] best = []; var bestScore = decimal.MaxValue;
        void Search()
        {
            if (chosen.Count == count)
            {
                var score = (target is null ? 0 : MealNutritionSelector.Score(fixedTotals.Calories + chosen.Sum(x => x.CaloriesPerServing!.Value),
                    fixedTotals.Protein + chosen.Sum(x => x.ProteinGramPerServing!.Value), fixedTotals.Carbs + chosen.Sum(x => x.CarbohydrateGramPerServing!.Value),
                    fixedTotals.Fat + chosen.Sum(x => x.FatGramPerServing!.Value), target)) + chosen.Sum(x => usage.GetValueOrDefault(x.Id)) * 0.025m;
                if (score < bestScore) { bestScore = score; best = chosen.ToArray(); } return;
            }
            foreach (var recipe in pool)
            {
                if (pool.Count(x => !fixedIds.Contains(x.Id)) >= count && (fixedIds.Contains(recipe.Id) || chosen.Any(x => x.Id == recipe.Id))) continue;
                chosen.Add(recipe); Search(); chosen.RemoveAt(chosen.Count - 1);
            }
        }
        Search(); return best;
    }

    private async Task RebuildPreservingShoppingAsync(MealPlan plan, CancellationToken ct)
    {
        var previous = plan.ShoppingItems.ToDictionary(x => (x.IngredientId, x.Unit), x => (x.IsPurchased, x.DailyShoppingJson, x.RequiredQuantity));
        await RebuildShoppingAsync(plan, plan.UserId, ct);
        foreach (var item in plan.ShoppingItems)
            if (previous.TryGetValue((item.IngredientId, item.Unit), out var old) && old.RequiredQuantity == item.RequiredQuantity)
            {
                item.IsPurchased = old.IsPurchased;
                if (old.DailyShoppingJson is null) continue;
                var previousDays = JsonSerializer.Deserialize<List<DailyShoppingEntry>>(old.DailyShoppingJson)!;
                var currentDays = DailyShopping(plan, item);
                if (previousDays.Count == currentDays.Count && previousDays.All(previous =>
                    currentDays.Any(current => current.Day == previous.Day && current.RequiredQuantity == previous.RequiredQuantity)))
                    item.DailyShoppingJson = old.DailyShoppingJson;
            }
    }
}
