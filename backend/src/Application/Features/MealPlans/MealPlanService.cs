// Chức năng: thực đơn bảy ngày và danh sách đi chợ. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using Application.Common.Exceptions;
using Application.Common.Validation;
using Domain.Entities;
using Domain.Enums;
using Domain.Rules;

namespace Application.Features.MealPlans;
// MealPlanService: điều phối các bước nghiệp vụ và xử lý kết quả cho bên gọi.
public sealed class MealPlanService(IMealPlanRepository repository)
{
    // GenerateAsync: Tạo kết quả dựa trên đầu vào và các ràng buộc đang áp dụng.
    public async Task<MealPlanResponse> GenerateAsync(string userId, MealPlanGenerateRequest request, CancellationToken ct)
    {
        RequestValidation.Validate(request);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (string.IsNullOrWhiteSpace(request.Name) || request.WeekStartDate == default) throw new ValidationException("Vui lòng nhập tên thực đơn và chọn ngày bắt đầu.");
        var profile = await repository.GetProfileAsync(userId, ct) ?? throw new ConflictException("Vui lòng lưu chế độ ăn trong hồ sơ trước khi tạo thực đơn.");
        if (profile.Diet is null) throw new ConflictException("Vui lòng lưu chế độ ăn trong hồ sơ trước khi tạo thực đơn.");
        var snapshot = ProfileSnapshot.From(profile);
        var recipes = (await repository.GetActiveRecipesAsync(ct)).Where(r => IsUsable(r, snapshot)).OrderBy(r => r.Name).ToArray();
        if (recipes.Length == 0) throw new ConflictException("Chưa có công thức phù hợp với chế độ ăn, dị ứng và thực phẩm cần tránh trong hồ sơ. Bạn có thể kiểm tra lại thông tin đã khai báo hoặc thử khi kho công thức được bổ sung.");
        var plan = new MealPlan { UserId = userId, Name = request.Name.Trim(), WeekStartDate = request.WeekStartDate, ProfileDiet = snapshot.Diet, ProfileSnapshot = JsonSerializer.Serialize(snapshot) };
        var slots = Enum.GetValues<MealSlot>(); var index = 0;
        for (var day = 1; day <= 7; day++) foreach (var slot in slots) plan.Meals.Add(Snapshot(recipes[index++ % recipes.Length], day, slot, 1));
        await RebuildShoppingAsync(plan, userId, ct); repository.Add(plan); await repository.SaveAsync(ct); return Map(plan);
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
        await RefreshRecipeImagesAsync(plan, ct);
        return Map(plan);
    }
    // DeleteAsync: Xóa dữ liệu trong phạm vi cho phép và xử lý các liên kết liên quan.
    public async Task DeleteAsync(string userId, Guid id, CancellationToken ct)
    {
        var plan = await FindAsync(userId, id, ct);
        repository.Remove(plan);
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await repository.SaveAsync(ct);
    }
    // ReplaceMealAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public async Task<MealPlanResponse> ReplaceMealAsync(string userId, Guid id, int day, MealSlot slot, MealReplacementRequest request, CancellationToken ct)
    {
        RequestValidation.Validate(request); if (day is < 1 or > 7 || !Enum.IsDefined(slot) || request.RecipeId == Guid.Empty) throw new ValidationException("Bữa ăn hoặc công thức đã chọn chưa hợp lệ. Vui lòng tải lại thực đơn và chọn lại.");
        var plan = await FindAsync(userId,id,ct); var recipe = await repository.GetUsableRecipeAsync(request.RecipeId,ct) ?? throw new KeyNotFoundException("Công thức không còn khả dụng. Vui lòng chọn món khác.");
        if (!IsUsable(recipe, ReadSnapshot(plan))) throw new ConflictException("Món này chưa phù hợp với chế độ ăn, dị ứng hoặc thực phẩm cần tránh đã lưu cùng thực đơn. Vui lòng chọn món khác.");
        var old = plan.Meals.SingleOrDefault(x=>x.DayNumber==day&&x.Slot==slot) ?? throw new KeyNotFoundException("Không tìm thấy bữa ăn. Vui lòng tải lại thực đơn."); plan.Meals.Remove(old); plan.Meals.Add(Snapshot(recipe,day,slot,request.Servings, old.SwapCount + 1)); plan.UpdatedAt=DateTimeOffset.UtcNow; await RebuildShoppingAsync(plan,userId,ct); await repository.SaveAsync(ct); return Map(plan);
    }
    // RegenerateAsync: Tạo kết quả dựa trên đầu vào và các ràng buộc đang áp dụng.
    public async Task<MealPlanResponse> RegenerateAsync(string userId, Guid id, CancellationToken ct)
    {
        var plan = await FindAsync(userId, id, ct);
        var snapshot = ReadSnapshot(plan);
        var recipes = (await repository.GetActiveRecipesAsync(ct)).Where(recipe => IsUsable(recipe, snapshot)).OrderBy(recipe => recipe.Name).ToArray();
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (recipes.Length == 0) throw new ConflictException("Chưa có công thức phù hợp với các điều kiện đã lưu cùng thực đơn này. Vui lòng thử lại khi kho công thức được bổ sung.");
        plan.Meals.Clear();
        var index = 0;
        for (var day = 1; day <= 7; day++) foreach (var slot in Enum.GetValues<MealSlot>()) plan.Meals.Add(Snapshot(recipes[index++ % recipes.Length], day, slot, 1));
        plan.UpdatedAt = DateTimeOffset.UtcNow;
        await RebuildShoppingAsync(plan, userId, ct);
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await repository.SaveAsync(ct);
        return Map(plan);
    }
    // CopyToWeekAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public async Task<MealPlanResponse> CopyToWeekAsync(string userId, Guid id, MealPlanCopyToWeekRequest request, CancellationToken ct)
    {
        RequestValidation.Validate(request);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (request.WeekStartDate == default) throw new ValidationException("Vui lòng chọn ngày bắt đầu thực đơn.");
        var source = await FindAsync(userId, id, ct);
        await RefreshRecipeImagesAsync(source, ct);
        var copy = new MealPlan
        {
            UserId = userId,
            Name = string.IsNullOrWhiteSpace(request.Name) ? source.Name : request.Name.Trim(),
            WeekStartDate = request.WeekStartDate,
            ProfileDiet = source.ProfileDiet,
            ProfileSnapshot = source.ProfileSnapshot,
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
        await RebuildShoppingAsync(copy, userId, ct);
        repository.Add(copy);
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await repository.SaveAsync(ct);
        return Map(copy);
    }
    // UpdatePurchaseAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public async Task<IReadOnlyList<ShoppingItemResponse>> UpdatePurchaseAsync(string userId, Guid planId, Guid itemId, ShoppingPurchaseRequest request, CancellationToken ct)
    { var plan=await FindAsync(userId,planId,ct); var item=plan.ShoppingItems.SingleOrDefault(x=>x.Id==itemId)??throw new KeyNotFoundException("Không tìm thấy mục cần mua. Vui lòng tải lại danh sách đi chợ."); item.IsPurchased=request.IsPurchased; plan.UpdatedAt=DateTimeOffset.UtcNow; await repository.SaveAsync(ct); return plan.ShoppingItems.Select(Map).ToArray(); }
    // GetShoppingListAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<IReadOnlyList<ShoppingItemResponse>> GetShoppingListAsync(string userId, Guid planId, int? day, CancellationToken ct)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (day is < 1 or > 7) throw new ValidationException("Vui lòng chọn ngày từ 1 đến 7 trong thực đơn.");
        var plan = await FindAsync(userId, planId, ct);
        if (day is null) return plan.ShoppingItems.OrderBy(x => x.IngredientName).Select(Map).ToArray();

        // Use the saved meal snapshots. Allocate pantry stock to earlier days first,
        // so daily quantities add up to the saved weekly shopping list.
        var requirements = plan.Meals
            .SelectMany(meal => meal.Ingredients.Select(ingredient => new
            {
                meal.DayNumber, ingredient.IngredientId, ingredient.IngredientName,
                ingredient.Unit, ingredient.Quantity
            }))
            .GroupBy(x => new { x.DayNumber, x.IngredientId, x.IngredientName, x.Unit })
            .ToDictionary(x => x.Key, x => x.Sum(ingredient => ingredient.Quantity));

        var result = new List<ShoppingItemResponse>();
        foreach (var item in plan.ShoppingItems.OrderBy(x => x.IngredientName))
        {
            var pantryRemaining = item.PantryQuantity;
            for (var currentDay = 1; currentDay <= day.Value; currentDay++)
            {
                requirements.TryGetValue(new { DayNumber = currentDay, item.IngredientId, item.IngredientName, item.Unit }, out var required);
                var pantryUsed = Math.Min(required, Math.Max(0, pantryRemaining));
                pantryRemaining -= pantryUsed;
                if (currentDay == day.Value && required > 0)
                    result.Add(new ShoppingItemResponse(item.Id, item.IngredientId, item.IngredientName,
                        required, pantryUsed, required - pantryUsed, item.Unit, item.IsPurchased));
            }
        }
        return result;
    }
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
    private async Task RebuildShoppingAsync(MealPlan plan,string user,CancellationToken ct) { plan.ShoppingItems.Clear(); var pantry=(await repository.GetPantryAsync(user,ct)).Where(x=>x.IngredientId.HasValue&&x.Quantity.HasValue).GroupBy(x=>new{x.IngredientId,x.Unit}).ToDictionary(x=>x.Key,x=>x.Sum(y=>y.Quantity!.Value)); foreach(var g in plan.Meals.SelectMany(x=>x.Ingredients).GroupBy(x=>new{x.IngredientId,x.IngredientName,x.Unit})) { pantry.TryGetValue(new { IngredientId=(Guid?)g.Key.IngredientId, Unit=(string?)g.Key.Unit },out var have); var need=g.Sum(x=>x.Quantity); plan.ShoppingItems.Add(new MealPlanShoppingItem{IngredientId=g.Key.IngredientId,IngredientName=g.Key.IngredientName,Unit=g.Key.Unit,RequiredQuantity=need,PantryQuantity=have,QuantityToBuy=Math.Max(0,need-have)}); } }
    // Snapshot: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private static MealPlanMeal Snapshot(Recipe r,int day,MealSlot slot,int servings,int swapCount = 0)=>new(){DayNumber=day,Slot=slot,RecipeId=r.Id,RecipeName=r.Name,ImageUrl=r.ImageUrl,Servings=servings,SwapCount=swapCount,TotalTimeMinutes=r.PrepTimeMinutes+r.CookTimeMinutes,CaloriesPerServing=r.CaloriesPerServing,ProteinGramPerServing=r.ProteinGramPerServing,CarbohydrateGramPerServing=r.CarbohydrateGramPerServing,FatGramPerServing=r.FatGramPerServing,Ingredients=r.RecipeIngredients.Select(x=>new MealPlanMealIngredient{IngredientId=x.IngredientId,IngredientName=x.Ingredient!.Name,Quantity=x.Quantity*servings,Unit=x.Unit}).ToList()};
    // IsUsable: Đối chiếu công thức với chế độ ăn, dị ứng và thực phẩm cần tránh.
    private static bool IsUsable(Recipe recipe, ProfileSnapshot profile) => recipe.RecipeIngredients.All(ingredient => ingredient.Ingredient is not null &&
        DietaryRules.Classify([ingredient.Ingredient]).Single(assessment => assessment.DietaryType == ToDiet(profile.Diet)).Status == DietaryCompatibility.Compatible &&
        !profile.Allergies.Any(allergy => Terms(ingredient.Ingredient.Allergens, allergy)) &&
        !profile.AvoidedFoods.Any(avoided => Terms(ingredient.Ingredient.Name, avoided) || Terms(ingredient.Ingredient.Aliases, avoided)));
    // ToDiet: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private static DietaryType ToDiet(VegetarianDiet d)=>d switch {VegetarianDiet.Vegan=>DietaryType.Vegan,VegetarianDiet.Lacto=>DietaryType.LactoVegetarian,VegetarianDiet.Ovo=>DietaryType.OvoVegetarian,_=>DietaryType.LactoOvoVegetarian};
    // Terms: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private static bool Terms(string? s,string term)=>!string.IsNullOrWhiteSpace(s)&&s.Split([',',';','|'],StringSplitOptions.TrimEntries|StringSplitOptions.RemoveEmptyEntries).Any(x=>string.Equals(x,term,StringComparison.OrdinalIgnoreCase));
    // ReadSnapshot: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    private static ProfileSnapshot ReadSnapshot(MealPlan plan)
    {
        var snapshot = JsonSerializer.Deserialize<ProfileSnapshot>(plan.ProfileSnapshot);
        return snapshot is { Diet: var diet } && Enum.IsDefined(diet) ? snapshot : new ProfileSnapshot(plan.ProfileDiet, [], []);
    }
    // Map: Chuyển dữ liệu nội bộ sang cấu trúc trả về cho bên gọi.
    private static MealPlanResponse Map(MealPlan p)
    {
        var meals = p.Meals.OrderBy(x => x.DayNumber).ThenBy(x => x.Slot).Select(x => new MealPlanMealResponse(x.Id, x.DayNumber, x.Slot, x.RecipeId, x.RecipeName, x.Servings, x.SwapCount, x.TotalTimeMinutes, x.CaloriesPerServing, x.ProteinGramPerServing, x.CarbohydrateGramPerServing, x.FatGramPerServing, x.ImageUrl, x.Ingredients.OrderBy(ingredient => ingredient.IngredientName).Select(ingredient => ingredient.IngredientName).ToArray())).ToArray();
        return new MealPlanResponse(p.Id, p.Name, p.WeekStartDate, p.ProfileDiet, meals, p.ShoppingItems.OrderBy(x => x.IngredientName).Select(Map).ToArray(), new MealPlanNutritionSummary(meals.Sum(x => (x.CaloriesPerServing ?? 0) * x.Servings), meals.Sum(x => (x.ProteinGramPerServing ?? 0) * x.Servings), meals.Sum(x => (x.CarbohydrateGramPerServing ?? 0) * x.Servings), meals.Sum(x => (x.FatGramPerServing ?? 0) * x.Servings)), p.CreatedAt, p.UpdatedAt);
    }
    // Map: Chuyển dữ liệu nội bộ sang cấu trúc trả về cho bên gọi.
    private static ShoppingItemResponse Map(MealPlanShoppingItem x)=>new(x.Id,x.IngredientId,x.IngredientName,x.RequiredQuantity,x.PantryQuantity,x.QuantityToBuy,x.Unit,x.IsPurchased);
    // ProfileSnapshot: định nghĩa dữ liệu trao đổi của tính năng.
    private sealed record ProfileSnapshot(VegetarianDiet Diet, IReadOnlyList<string> Allergies, IReadOnlyList<string> AvoidedFoods)
    {
        // From: Chuyển dữ liệu nội bộ sang cấu trúc trả về cho bên gọi.
        public static ProfileSnapshot From(UserProfile profile) => new(profile.Diet!.Value, profile.Allergies.Select(x => x.NormalizedName).ToArray(), profile.AvoidedFoods.Select(x => x.NormalizedName).ToArray());
    }
}
