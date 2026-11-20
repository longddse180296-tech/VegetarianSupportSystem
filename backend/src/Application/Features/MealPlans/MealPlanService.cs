// BE2-09 | Điều phối nghiệp vụ và kiểm tra điều kiện trước khi lưu (thực đơn tuần, dinh dưỡng, danh sách mua và PDF).
// Sinh và chỉnh sửa thực đơn theo hồ sơ, ghi lại món theo từng bữa và tính lượng nguyên liệu cần mua.
using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using Application.Common.Exceptions;
using Application.Common.Validation;
using Domain.Entities;
using Domain.Enums;
using Domain.Rules;

namespace Application.Features.MealPlans;
// MealPlanService: điều phối các bước nghiệp vụ và xử lý kết quả cho bên gọi.
public sealed partial class MealPlanService(IMealPlanRepository repository, TimeProvider? clock = null)
{
    // Chỉ chủ thực đơn được đọc lại công thức đã có trong lịch, kể cả khi món đang ngừng sử dụng.
    public async Task RequireSavedRecipeAsync(string userId, Guid planId, Guid recipeId, CancellationToken ct)
    {
        var plan = await FindAsync(userId, planId, ct);
        if (!plan.Meals.Any(meal => meal.RecipeId == recipeId))
            throw new KeyNotFoundException("Công thức không có trong thực đơn này.");
    }
    // Lấy hồ sơ và công thức phù hợp, xếp món theo ngày và bữa rồi lưu thực đơn cùng danh sách mua sắm.
    public async Task<MealPlanResponse> GenerateAsync(string userId, MealPlanGenerateRequest request, CancellationToken ct)
    {
        RequestValidation.Validate(request);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (string.IsNullOrWhiteSpace(request.Name) || request.WeekStartDate == default) throw new ValidationException("Vui lòng nhập tên thực đơn và chọn ngày bắt đầu.");
        ValidateStartDate(request.WeekStartDate);
        var profile = await repository.GetProfileAsync(userId, ct) ?? throw new ConflictException("Vui lòng lưu chế độ ăn trong hồ sơ trước khi tạo thực đơn.");
        if (profile.Diet is null) throw new ConflictException("Vui lòng lưu chế độ ăn trong hồ sơ trước khi tạo thực đơn.");
        // BE2-09 | Lưu điều kiện hồ sơ. Ưu tiên món chưa ăn hoặc đã lâu chưa ăn, xáo trộn giữa các món cùng mức ưu tiên.
        var snapshot = ProfileSnapshot.From(profile);
        var recipes = await SelectRecipesAsync(userId, request.WeekStartDate, snapshot, ct);
        if (recipes.Length == 0) throw new ConflictException("Chưa có công thức phù hợp với chế độ ăn, dị ứng và thực phẩm cần tránh trong hồ sơ. Bạn có thể kiểm tra lại thông tin đã khai báo hoặc thử khi kho công thức được bổ sung.");
        var plan = new MealPlan { UserId = userId, Name = request.Name.Trim(), WeekStartDate = request.WeekStartDate, ProfileDiet = snapshot.Diet, ProfileSnapshot = JsonSerializer.Serialize(snapshot) };
        PopulateMeals(plan, recipes, snapshot.DailyNutritionTarget);
        await RebuildShoppingAsync(plan, userId, ct);
        await repository.SaveNewAsync(plan, ct);
        return await MapWithAvailabilityAsync(plan, ct);
    }
    // ListAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<MealPlanPage> ListAsync(string userId, MealPlanListQuery query, CancellationToken ct)
    {
        RequestValidation.Validate(query);
        var result = await repository.ListAsync(userId, query, ct);
        return new MealPlanPage(result.Items.Select(x => new MealPlanSummary(x.Id, x.Name, x.WeekStartDate, x.Meals.Count, x.CreatedAt)).ToArray(), query.Page, query.PageSize, result.TotalCount);
    }
    // GetAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<MealPlanResponse> GetAsync(string userId, Guid id, CancellationToken ct)
    {
        var plan = await FindAsync(userId, id, ct);
        return await MapWithAvailabilityAsync(plan, ct);
    }
    // DeleteAsync: Xóa dữ liệu trong phạm vi cho phép và xử lý các liên kết liên quan.
    public async Task DeleteAsync(string userId, Guid id, CancellationToken ct)
    {
        var plan = await FindAsync(userId, id, ct);
        repository.Remove(plan);
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await repository.SaveAsync(ct);
    }
    // Thay một món trong ngày và bữa được chọn, tăng số lần đổi món rồi tính lại nguyên liệu cần mua.
    public async Task<MealPlanResponse> ReplaceMealAsync(string userId, Guid id, int day, MealSlot slot, MealReplacementRequest request, CancellationToken ct)
    {
        RequestValidation.Validate(request); if (day is < 1 or > 7 || !Enum.IsDefined(slot) || request.RecipeId == Guid.Empty) throw new ValidationException("Bữa ăn hoặc công thức đã chọn chưa hợp lệ. Vui lòng tải lại thực đơn và chọn lại.");
        var plan = await FindAsync(userId,id,ct); var recipe = await repository.GetUsableRecipeAsync(request.RecipeId,ct) ?? throw new KeyNotFoundException("Công thức không còn khả dụng. Vui lòng chọn món khác.");

        var currentProfile = await repository.GetProfileAsync(userId, ct);
        if (!IsUsable(recipe, currentProfile is not null ? ProfileSnapshot.From(currentProfile, ReadSnapshot(plan).Diet) : ReadSnapshot(plan)))
            throw new ConflictException("Món này chưa phù hợp với hồ sơ hiện tại của bạn. Vui lòng chọn món khác.");
        var old = plan.Meals.SingleOrDefault(x=>x.DayNumber==day&&x.Slot==slot) ?? throw new KeyNotFoundException("Không tìm thấy bữa ăn. Vui lòng tải lại thực đơn."); EnsureEditable(plan, old); plan.Meals.Remove(old); plan.Meals.Add(Snapshot(recipe,day,slot,request.Servings, old.SwapCount + 1)); plan.UpdatedAt=DateTimeOffset.UtcNow; await RebuildShoppingAsync(plan,userId,ct); await repository.SaveAsync(ct); return await MapWithAvailabilityAsync(plan, ct);
    }
    // Sinh lại các bữa dựa trên hồ sơ đã lưu cùng thực đơn và tính lại danh sách mua sắm.
    public async Task<MealPlanResponse> RegenerateAsync(string userId, Guid id, CancellationToken ct)
    {
        var plan = await FindAsync(userId, id, ct);
        if (plan.Meals.Any(x => x.CheckedInAt.HasValue) || plan.WeekStartDate < Today()) return await ApplyCurrentProfileAsync(userId, id, ct, refreshAll: true);
        // Tạo lại là thao tác chủ động áp dụng hồ sơ và mục tiêu hiện tại cho lịch.
        var currentProfile = await repository.GetProfileAsync(userId, ct);
        var snapshot = currentProfile is not null ? ProfileSnapshot.From(currentProfile, ReadSnapshot(plan).Diet) : ReadSnapshot(plan);
        var recipes = await SelectRecipesAsync(userId, plan.WeekStartDate, snapshot, ct);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (recipes.Length == 0) throw new ConflictException("Chưa có công thức phù hợp với các điều kiện đã lưu cùng thực đơn này. Vui lòng thử lại khi kho công thức được bổ sung.");
        plan.ProfileDiet = snapshot.Diet;
        plan.ProfileSnapshot = JsonSerializer.Serialize(snapshot);
        plan.Meals.Clear();
        PopulateMeals(plan, recipes, snapshot.DailyNutritionTarget);
        plan.UpdatedAt = DateTimeOffset.UtcNow;
        await RebuildShoppingAsync(plan, userId, ct);
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await repository.SaveAsync(ct);
        return await MapWithAvailabilityAsync(plan, ct);
    }
    // Tạo kế hoạch cho tuần đích từ các bữa của thực đơn nguồn, sau đó tính lại danh sách mua sắm.
    public async Task<MealPlanResponse> CopyToWeekAsync(string userId, Guid id, MealPlanCopyToWeekRequest request, CancellationToken ct)
    {
        RequestValidation.Validate(request);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (request.WeekStartDate == default) throw new ValidationException("Vui lòng chọn ngày bắt đầu thực đơn.");
        ValidateStartDate(request.WeekStartDate);
        var source = await FindAsync(userId, id, ct);
        await RefreshRecipeImagesAsync(source, ct);
        var previousProfile = ReadSnapshot(source);
        var profile = await repository.GetProfileAsync(userId, ct);
        var currentProfile = profile is not null ? ProfileSnapshot.From(profile, previousProfile.Diet) : previousProfile;
        var nutritionChanged = previousProfile.DailyNutritionTarget != currentProfile.DailyNutritionTarget ||
            (previousProfile.NutritionProfileKey is not null && previousProfile.NutritionProfileKey != currentProfile.NutritionProfileKey);
        var requiresRefresh = nutritionChanged || previousProfile.Diet != currentProfile.Diet ||
            !previousProfile.Allergies.ToHashSet(StringComparer.OrdinalIgnoreCase).SetEquals(currentProfile.Allergies) ||
            !previousProfile.AvoidedFoods.ToHashSet(StringComparer.OrdinalIgnoreCase).SetEquals(currentProfile.AvoidedFoods);
        var requiresConfirmation = requiresRefresh;
        var recentlyEaten = await repository.GetRecentCheckInsAsync(userId, request.WeekStartDate.AddDays(-21), ct);
        foreach (var recipeId in source.Meals.Select(m => m.RecipeId).Distinct())
        {
            var recipe = await repository.GetUsableRecipeAsync(recipeId, ct);
            if (recipe is null || !IsUsable(recipe, currentProfile) || !IsUsable(recipe, previousProfile, useDeclaredDiet: true) ||
                source.Meals.Any(meal => meal.RecipeId == recipeId && NutritionChanged(meal, recipe)) || recentlyEaten.ContainsKey(recipeId))
            {
                requiresRefresh = true;
                requiresConfirmation = true;
            }
        }
        if (requiresConfirmation && !request.AcceptRecipeChanges)
            throw new ConflictException("Xác nhận thay đổi món: một số công thức đang được cập nhật hoặc không còn phù hợp với thực đơn. Hệ thống có thể đổi sang món khác khi áp dụng sang tuần mới.");
        var copy = new MealPlan
        {
            UserId = userId,
            Name = string.IsNullOrWhiteSpace(request.Name) ? source.Name : request.Name.Trim(),
            WeekStartDate = request.WeekStartDate,
            ProfileDiet = currentProfile.Diet,
            ProfileSnapshot = JsonSerializer.Serialize(currentProfile),
            Meals = source.Meals.Select(meal => new MealPlanMeal
            {
                DayNumber = meal.DayNumber, Slot = meal.Slot, RecipeId = meal.RecipeId, RecipeName = meal.RecipeName,
                ImageUrl = meal.ImageUrl, Servings = meal.Servings, SwapCount = meal.SwapCount, TotalTimeMinutes = meal.TotalTimeMinutes,
                CaloriesPerServing = meal.CaloriesPerServing, ProteinGramPerServing = meal.ProteinGramPerServing,
                CarbohydrateGramPerServing = meal.CarbohydrateGramPerServing, FatGramPerServing = meal.FatGramPerServing,
                Ingredients = meal.Ingredients.Select(ingredient => new MealPlanMealIngredient
                {
                    IngredientId = ingredient.IngredientId, IngredientName = ingredient.IngredientName,
                    Quantity = ingredient.Quantity, Unit = ingredient.Unit
                }).ToList()
            }).ToList()
        };
        if (requiresRefresh)
        {
            var recipes = await SelectRecipesAsync(userId, request.WeekStartDate, currentProfile, ct);
            if (recipes.Length == 0) throw new ConflictException("Chưa có món phù hợp với hồ sơ hiện tại để tạo tuần mới. Vui lòng kiểm tra chế độ ăn, dị ứng và thực phẩm cần tránh.");
            copy.Meals.Clear();
            PopulateMeals(copy, recipes, currentProfile.DailyNutritionTarget);
        }
        await RebuildShoppingAsync(copy, userId, ct);
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await repository.SaveNewAsync(copy, ct);
        var result = await MapWithAvailabilityAsync(copy, ct);
        var mealsChanged = copy.Meals.Any(meal => source.Meals.FirstOrDefault(old => old.DayNumber == meal.DayNumber && old.Slot == meal.Slot)?.RecipeId != meal.RecipeId);
        return result with { NutritionAdjustmentMessage = !nutritionChanged ? null : mealsChanged
            ? "Một vài món đã được cập nhật cho đúng với chỉ số dinh dưỡng của bạn."
            : "Mục tiêu dinh dưỡng đã được cập nhật theo chỉ số mới của bạn. Các món hiện tại đã được đối chiếu và giữ lại." };
    }
    // UpdatePurchaseAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public async Task<IReadOnlyList<ShoppingItemResponse>> UpdatePurchaseAsync(string userId, Guid planId, Guid itemId, ShoppingPurchaseRequest request, CancellationToken ct)
    {
        RequestValidation.Validate(request);
        var plan = await FindAsync(userId, planId, ct);
        var item = plan.ShoppingItems.SingleOrDefault(x => x.Id == itemId)
            ?? throw new KeyNotFoundException("Không tìm thấy mục cần mua. Vui lòng tải lại danh sách đi chợ.");
        if (request.IsPurchased is null && request.QuantityToBuy is null && request.PantryQuantity is null)
            throw new ValidationException("Vui lòng nhập số lượng đã có.");
        if (request.QuantityToBuy.HasValue && request.PantryQuantity.HasValue)
            throw new ValidationException("Chỉ nhập một loại số lượng để đối soát.");

        var pending = RemainingShoppingDays(plan, item).Where(row => request.Day is null || row.Day == request.Day).ToArray();
        if (pending.Length == 0) throw new ValidationException("Không còn bữa chưa thực hiện cần nguyên liệu này.");
        var required = pending.Sum(row => row.RequiredQuantity);
        ValidateShoppingQuantity(request.PantryQuantity, required);
        ValidateShoppingQuantity(request.QuantityToBuy, required);
        var changed = request.PantryQuantity.HasValue || request.QuantityToBuy.HasValue;
        var availableRemaining = request.PantryQuantity ?? (request.QuantityToBuy.HasValue ? required - request.QuantityToBuy.Value : 0);
        var days = DailyShopping(plan, item);
        foreach (var row in pending)
        {
            var index = days.FindIndex(old => old.Day == row.Day);
            var old = days[index];
            var available = changed ? Math.Min(row.RequiredQuantity, availableRemaining) : row.PantryQuantity;
            availableRemaining -= changed ? available : 0;
            // Giữ phân bổ cho bữa đã ăn để có thể hủy đánh dấu mà không mất đối soát.
            var excluded = Math.Max(0, old.RequiredQuantity - row.RequiredQuantity);
            var consumed = ConsumedPantry(old, excluded);
            days[index] = old with { PantryQuantity = consumed + available,
                QuantityToBuy = old.RequiredQuantity - consumed - available,
                ExcludedQuantityAtReconciliation = excluded, ConsumedPantryAtReconciliation = consumed,
                IsPurchased = request.IsPurchased ?? (changed ? false : old.IsPurchased) };
        }
        item.DailyShoppingJson = JsonSerializer.Serialize(days);
        item.PantryQuantity = days.Sum(row => row.PantryQuantity);
        item.QuantityToBuy = days.Sum(row => row.QuantityToBuy);
        item.IsPurchased = days.Any(row => row.QuantityToBuy > 0) && days.Where(row => row.QuantityToBuy > 0).All(row => row.IsPurchased);
        plan.UpdatedAt = DateTimeOffset.UtcNow;
        await repository.SaveAsync(ct);
        return RemainingShopping(plan, null);
    }
    // Trả toàn bộ danh sách mua sắm hoặc tính lượng cần theo ngày được chọn.
    public async Task<IReadOnlyList<ShoppingItemResponse>> GetShoppingListAsync(string userId, Guid planId, int? day, CancellationToken ct)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (day is < 1 or > 7) throw new ValidationException("Vui lòng chọn ngày từ 1 đến 7 trong thực đơn.");
        var plan = await FindAsync(userId, planId, ct);
        return RemainingShopping(plan, day);
    }

    // Chỉ xuất những bữa chưa thực hiện từ hôm nay; lịch sử vẫn giữ nguyên trên màn hình.
    public async Task<MealPlanResponse> GetExportAsync(string userId, Guid planId, int? day, CancellationToken ct)
    {
        if (day is < 1 or > 7) throw new ValidationException("Vui lòng chọn ngày từ 1 đến 7.");
        var plan = await FindAsync(userId, planId, ct);
        var response = await MapWithAvailabilityAsync(plan, ct);
        var ids = plan.Meals.Where(meal => IsPending(plan, meal) && (day is null || meal.DayNumber == day)).Select(meal => meal.Id).ToHashSet();
        var meals = response.Meals.Where(meal => ids.Contains(meal.Id)).ToArray();
        if (meals.Length == 0) throw new ValidationException("Không còn bữa ăn chưa thực hiện trong phạm vi này để xuất PDF.");
        return response with { Meals = meals, ShoppingItems = RemainingShopping(plan, day),
            Nutrition = new MealPlanNutritionSummary(meals.Sum(x => (x.CaloriesPerServing ?? 0) * x.Servings),
                meals.Sum(x => (x.ProteinGramPerServing ?? 0) * x.Servings),
                meals.Sum(x => (x.CarbohydrateGramPerServing ?? 0) * x.Servings),
                meals.Sum(x => (x.FatGramPerServing ?? 0) * x.Servings)) };
    }

    private List<DailyShoppingEntry> RemainingShoppingDays(MealPlan plan, MealPlanShoppingItem item)
    {
        var original = DailyShopping(plan, item).ToDictionary(row => row.Day);
        return plan.Meals.Where(meal => IsPending(plan, meal))
            .SelectMany(meal => meal.Ingredients.Where(i => i.IngredientId == item.IngredientId && i.Unit == item.Unit)
                .Select(i => new { Day = meal.DayNumber, i.Quantity }))
            .GroupBy(row => row.Day).OrderBy(group => group.Key).Select(group =>
            {
                var required = group.Sum(row => row.Quantity);
                var old = original.GetValueOrDefault(group.Key);
                // Lượng đã có dành cho bữa đã ăn được tiêu thụ trước, không trừ lại cho bữa còn lại.
                var excluded = Math.Max(0, (old?.RequiredQuantity ?? required) - required);
                var available = Math.Clamp((old?.PantryQuantity ?? 0) - (old is null ? 0 : ConsumedPantry(old, excluded)), 0, required);
                return new DailyShoppingEntry(group.Key, required, available, required - available, old?.IsPurchased ?? false);
            }).ToList();
    }

    private ShoppingItemResponse[] RemainingShopping(MealPlan plan, int? day) => plan.ShoppingItems.OrderBy(item => item.IngredientName)
        .Select(item => new { Item = item, Days = RemainingShoppingDays(plan, item).Where(row => day is null || row.Day == day).ToArray() })
        .Where(row => row.Days.Length > 0).Select(row => new ShoppingItemResponse(row.Item.Id, row.Item.IngredientId,
            row.Item.IngredientName, row.Days.Sum(d => d.RequiredQuantity), row.Days.Sum(d => d.PantryQuantity),
            row.Days.Sum(d => d.QuantityToBuy), row.Item.Unit,
            row.Days.Any(d => d.QuantityToBuy > 0) && row.Days.Where(d => d.QuantityToBuy > 0).All(d => d.IsPurchased))).ToArray();

    private async Task<Recipe[]> SelectRecipesAsync(string userId, DateOnly start, ProfileSnapshot profile, CancellationToken ct)
    {
        var recipes = (await repository.GetActiveRecipesAsync(ct)).Where(recipe => IsUsable(recipe, profile)).ToArray();
        var usage = await repository.GetRecipeUsageAsync(userId, start, ct);
        var eaten = await repository.GetRecentCheckInsAsync(userId, start.AddDays(-21), ct);
        // Ưu tiên những món chưa check-in trong 3 tuần. Chỉ cho lặp khi kho món còn lại quá ít.
        var notRecentlyEaten = recipes.Where(recipe => !eaten.ContainsKey(recipe.Id)).ToArray();
        if (notRecentlyEaten.Length >= 3) recipes = notRecentlyEaten;
        Random.Shared.Shuffle(recipes);
        return recipes.OrderBy(recipe => usage.GetValueOrDefault(recipe.Id, DateOnly.MinValue)).ToArray();
    }

    private void ValidateStartDate(DateOnly start)
    {
        var today = DateOnly.FromDateTime((clock ?? TimeProvider.System).GetUtcNow().ToOffset(TimeSpan.FromHours(7)).DateTime);
        if (start < today)
            throw new ValidationException(new ValidationResult(
                "Ngày bắt đầu phải từ hôm nay trở đi.", [nameof(MealPlanGenerateRequest.WeekStartDate)]), null, start);
    }

    private static void ValidateShoppingQuantity(decimal? quantity, decimal required)
    {
        if (quantity is { } value && (value < 0 || value > required || decimal.Round(value, 3) != value))
            throw new ValidationException("Lượng cần mua phải từ 0 đến lượng cần trong phạm vi đã chọn, tối đa 3 chữ số thập phân.");
    }

    private static List<DailyShoppingEntry> DailyShopping(MealPlan plan, MealPlanShoppingItem item)
    {
        if (item.DailyShoppingJson is not null)
            return JsonSerializer.Deserialize<List<DailyShoppingEntry>>(item.DailyShoppingJson)!;
        var result = new List<DailyShoppingEntry>();
        var pantryRemaining = item.PantryQuantity;
        var requirements = plan.Meals
            .SelectMany(meal => meal.Ingredients
                .Where(ingredient => ingredient.IngredientId == item.IngredientId && ingredient.Unit == item.Unit)
                .Select(ingredient => new { Day = meal.DayNumber, ingredient.Quantity }))
            .GroupBy(row => row.Day).OrderBy(group => group.Key);
        foreach (var group in requirements)
        {
            var required = group.Sum(row => row.Quantity);
            var available = Math.Min(required, Math.Max(0, pantryRemaining));
            pantryRemaining -= available;
            result.Add(new DailyShoppingEntry(group.Key, required, available, required - available, item.IsPurchased));
        }
        return result;
    }

    private static decimal ConsumedPantry(DailyShoppingEntry row, decimal excluded) => Math.Min(row.PantryQuantity,
        row.ExcludedQuantityAtReconciliation is { } baseline
            ? Math.Clamp((row.ConsumedPantryAtReconciliation ?? 0) + excluded - baseline, 0, excluded)
            : Math.Min(row.PantryQuantity, excluded));

    private sealed record DailyShoppingEntry(int Day, decimal RequiredQuantity, decimal PantryQuantity,
        decimal QuantityToBuy, bool IsPurchased, decimal? ExcludedQuantityAtReconciliation = null, decimal? ConsumedPantryAtReconciliation = null);
    // FindAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    private async Task<MealPlan> FindAsync(string u,Guid id,CancellationToken ct)=>await repository.GetAsync(id,u,ct)??throw new KeyNotFoundException("Không tìm thấy thực đơn hoặc bạn không có quyền truy cập thực đơn này.");
    // RefreshRecipeImagesAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private async Task RefreshRecipeImagesAsync(MealPlan plan, CancellationToken ct)
    {
        var recipeIds = plan.Meals.Select(meal => meal.RecipeId).Distinct().ToArray();
        var images = await repository.GetRecipeImagesAsync(recipeIds, ct);
        foreach (var meal in plan.Meals)
        {
            if (images.TryGetValue(meal.RecipeId, out var imageUrl))
            {
                meal.ImageUrl = imageUrl;
            }
        }
    }
    // RebuildShoppingAsync: Tổng hợp nguyên liệu của thực đơn và trừ lượng tủ bếp có thể đối chiếu.
    // BE2-09 | Cộng lượng cần theo nguyên liệu và đơn vị, trừ lượng có trong tủ, giữ số cần mua tối thiểu bằng 0.
    // Gom nguyên liệu theo mã và đơn vị, lấy lượng cần cho các bữa trừ đi lượng đang có trong tủ bếp.
    private async Task RebuildShoppingAsync(MealPlan plan,string user,CancellationToken ct) { plan.ShoppingItems.Clear(); var pantry=(await repository.GetPantryAsync(user,ct)).Where(x=>x.IngredientId.HasValue&&x.Quantity.HasValue).GroupBy(x=>new{x.IngredientId,x.Unit}).ToDictionary(x=>x.Key,x=>x.Sum(y=>y.Quantity!.Value)); foreach(var g in plan.Meals.SelectMany(x=>x.Ingredients).GroupBy(x=>new{x.IngredientId,x.IngredientName,x.Unit})) { pantry.TryGetValue(new { IngredientId=(Guid?)g.Key.IngredientId, Unit=(string?)g.Key.Unit },out var have); var need=g.Sum(x=>x.Quantity); plan.ShoppingItems.Add(new MealPlanShoppingItem{IngredientId=g.Key.IngredientId,IngredientName=g.Key.IngredientName,Unit=g.Key.Unit,RequiredQuantity=need,PantryQuantity=have,QuantityToBuy=Math.Max(0,need-have)}); } }
    // Chụp lại tên, ảnh, thời gian, dinh dưỡng và định lượng theo khẩu phần để lưu vào bữa của thực đơn.
    private static MealPlanMeal Snapshot(Recipe r,int day,MealSlot slot,int servings,int swapCount = 0)=>new(){DayNumber=day,Slot=slot,RecipeId=r.Id,RecipeName=r.Name,ImageUrl=r.ImageUrl,Servings=servings,SwapCount=swapCount,TotalTimeMinutes=r.PrepTimeMinutes+r.CookTimeMinutes,CaloriesPerServing=r.CaloriesPerServing,ProteinGramPerServing=r.ProteinGramPerServing,CarbohydrateGramPerServing=r.CarbohydrateGramPerServing,FatGramPerServing=r.FatGramPerServing,Ingredients=r.RecipeIngredients.Select(x=>new MealPlanMealIngredient{IngredientId=x.IngredientId,IngredientName=x.Ingredient!.Name,Quantity=decimal.Round(x.Quantity / r.Servings * servings, 3, MidpointRounding.AwayFromZero),Unit=x.Unit}).ToList()};
    // IsUsable: Đối chiếu công thức với chế độ ăn, dị ứng và thực phẩm cần tránh.
    private static bool IsUsable(Recipe recipe, ProfileSnapshot profile, bool useDeclaredDiet = false)
    {
        if (!recipe.IsActive || recipe.RecipeIngredients.Count == 0 ||
            recipe.RecipeIngredients.Any(row => row.Ingredient is null || !row.Ingredient.IsActive))
            return false;
        var diet = ToDiet(profile.Diet);
        if (recipe.DeclaredDietaryType is { } declared && !DietaryRules.SupportsDiet(declared, diet))
            return false;
        var ingredients = recipe.RecipeIngredients.Select(row => row.Ingredient!).ToArray();
        // Lịch cũ dùng loại Admin đã lưu. Tạo lịch hoặc đổi món vẫn kiểm tra bằng chứng nguyên liệu hiện tại.
        if (!useDeclaredDiet || recipe.DeclaredDietaryType is null)
        {
            var assessments = DietaryRules.Classify(ingredients);
            if (assessments.Single(item => item.DietaryType == diet).Status != DietaryCompatibility.Compatible ||
                (recipe.DeclaredDietaryType is { } selected &&
                    assessments.Single(item => item.DietaryType == selected).Status != DietaryCompatibility.Compatible))
                return false;
        }
        return ingredients.All(ingredient =>
            !profile.Allergies.Any(allergy => IngredientRestrictionRules.MatchesAllergy(ingredient, allergy)) &&
            !profile.AvoidedFoods.Any(avoided => IngredientRestrictionRules.MatchesNameOrAlias(ingredient, avoided)));
    }
    // ToDiet: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private static DietaryType ToDiet(VegetarianDiet d)=>d switch {VegetarianDiet.Vegan=>DietaryType.Vegan,VegetarianDiet.Lacto=>DietaryType.LactoVegetarian,VegetarianDiet.Ovo=>DietaryType.OvoVegetarian,_=>DietaryType.LactoOvoVegetarian};
    // ReadSnapshot: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    private static ProfileSnapshot ReadSnapshot(MealPlan plan)
    {
        if (string.IsNullOrWhiteSpace(plan.ProfileSnapshot))
            return new ProfileSnapshot(plan.ProfileDiet, [], []);
        var snapshot = JsonSerializer.Deserialize<ProfileSnapshot>(plan.ProfileSnapshot);
        return snapshot is { Diet: var diet } && Enum.IsDefined(diet) ? snapshot : new ProfileSnapshot(plan.ProfileDiet, [], []);
    }
    // Đối chiếu món đã lưu với công thức hiện tại, giữ cảnh báo trên mọi ngày có cùng món.
    private async Task<MealPlanResponse> MapWithAvailabilityAsync(MealPlan plan, CancellationToken ct)
    {
        await RefreshRecipeImagesAsync(plan, ct);
        var state = await AssessCurrentAsync(plan, ct, updateCompatible: true);
        var response = Map(plan);
        return response with
        {
            Meals = response.Meals.Select(meal => meal with
            {
                AvailabilityWarning = state.Warnings.GetValueOrDefault(meal.Id),
                DeclaredDietaryType = state.Recipes.GetValueOrDefault(meal.RecipeId)?.DeclaredDietaryType
            }).ToArray(),
            RequiresReview = plan.Meals.Any(meal => IsPending(plan, meal) && state.Warnings.ContainsKey(meal.Id)),
            ReviewMessage = "Một số công thức đang được cập nhật hoặc không còn phù hợp với thực đơn. Hệ thống sẽ tự động đổi món để phù hợp với hồ sơ của bạn sau khi xác nhận.",
            CurrentDailyNutritionTarget = state.Profile.DailyNutritionTarget
        };
    }
    private static void PopulateMeals(MealPlan plan, Recipe[] recipes, DailyNutritionTarget? target)
    {
        var usage = new Dictionary<Guid, int>();
        var slots = Enum.GetValues<MealSlot>();
        var index = 0;
        for (var day = 1; day <= 7; day++)
        {
            var selected = target is null ? [] : MealNutritionSelector.SelectDay(recipes, target, usage);
            for (var slot = 0; slot < slots.Length; slot++)
            {
                var recipe = selected.Length == 3 ? selected[slot] : recipes[index++ % recipes.Length];
                plan.Meals.Add(Snapshot(recipe, day, slots[slot], 1));
                usage[recipe.Id] = usage.GetValueOrDefault(recipe.Id) + 1;
            }
        }
    }

    // Map: Chuyển dữ liệu nội bộ sang cấu trúc trả về cho bên gọi.
    private MealPlanResponse Map(MealPlan p)
    {
        var meals = p.Meals.OrderBy(x => x.DayNumber).ThenBy(x => x.Slot).Select(x => new MealPlanMealResponse(x.Id, x.DayNumber, x.Slot, x.RecipeId, x.RecipeName, x.Servings, x.SwapCount, x.TotalTimeMinutes, x.CaloriesPerServing, x.ProteinGramPerServing, x.CarbohydrateGramPerServing, x.FatGramPerServing, x.ImageUrl, x.Ingredients.OrderBy(ingredient => ingredient.IngredientName).Select(ingredient => ingredient.IngredientName).ToArray(), CheckedInAt: x.CheckedInAt)).ToArray();
        return new MealPlanResponse(p.Id, p.Name, p.WeekStartDate, p.ProfileDiet, meals, RemainingShopping(p, null), new MealPlanNutritionSummary(meals.Sum(x => (x.CaloriesPerServing ?? 0) * x.Servings), meals.Sum(x => (x.ProteinGramPerServing ?? 0) * x.Servings), meals.Sum(x => (x.CarbohydrateGramPerServing ?? 0) * x.Servings), meals.Sum(x => (x.FatGramPerServing ?? 0) * x.Servings)), p.CreatedAt, p.UpdatedAt, ReadSnapshot(p).DailyNutritionTarget);
    }
    // Map: Chuyển dữ liệu nội bộ sang cấu trúc trả về cho bên gọi.
    private static ShoppingItemResponse Map(MealPlanShoppingItem x)=>new(x.Id,x.IngredientId,x.IngredientName,x.RequiredQuantity,x.PantryQuantity,x.QuantityToBuy,x.Unit,x.IsPurchased);
    // ProfileSnapshot: định nghĩa dữ liệu trao đổi của tính năng.
    private sealed record ProfileSnapshot(VegetarianDiet Diet, IReadOnlyList<string> Allergies, IReadOnlyList<string> AvoidedFoods, DailyNutritionTarget? DailyNutritionTarget = null, string? NutritionProfileKey = null)
    {
        // From: Chuyển dữ liệu nội bộ sang cấu trúc trả về cho bên gọi.
        public static ProfileSnapshot From(UserProfile profile, VegetarianDiet? fallbackDiet = null) => new(profile.Diet ?? fallbackDiet ?? throw new ValidationException("Vui lòng chọn chế độ ăn."), profile.Allergies.Select(x => x.NormalizedName).ToArray(), profile.AvoidedFoods.Select(x => x.NormalizedName).ToArray(), ProfileNutritionEstimator.Calculate(profile, DateOnly.FromDateTime(DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(7)).DateTime)).DailyNutritionTarget,
            JsonSerializer.Serialize(new { profile.BirthDate, profile.SexForEnergyEstimate, profile.HeightCm, profile.WeightKg,
                Activity = profile.ActivityLevel switch { ActivityLevel.LightlyActive => ActivityLevel.ModeratelyActive, ActivityLevel.ExtraActive => ActivityLevel.VeryActive, _ => profile.ActivityLevel }, profile.WeightGoal }));
    }
}
