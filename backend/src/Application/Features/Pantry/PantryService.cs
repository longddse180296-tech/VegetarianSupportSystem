// BE2-08 | Điều phối nghiệp vụ và kiểm tra điều kiện trước khi lưu (tủ bếp cá nhân và gợi ý từ nguyên liệu đang có).
// Quản lý nguyên liệu của người dùng và gợi ý công thức hoặc nguyên liệu thay thế.
using Application.Common.Exceptions;
using Domain.Entities;
using Domain.Rules;
using Application.Features.MealPlans;

namespace Application.Features.Pantry;

// PantryService: điều phối các bước nghiệp vụ và xử lý kết quả cho bên gọi.
public sealed class PantryService(IPantryRepository repository, IMealPlanRepository? mealPlans = null)
{
    // ListAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<IReadOnlyList<PantryItemResponse>> ListAsync(string userId, CancellationToken ct)
    {
        var profile = await repository.GetProfileAsync(userId, ct);
        var items = await repository.ListAsync(userId, ct);
        return items.Select(item => PantryMapping.ToItemResponse(item, profile)).ToArray();
    }

    // GetAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<PantryItemResponse> GetAsync(string userId, Guid id, CancellationToken ct)
    {
        var item = await FindAsync(userId, id, ct);
        return PantryMapping.ToItemResponse(item, await repository.GetProfileAsync(userId, ct));
    }

    // CreateAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public async Task<PantryItemResponse> CreateAsync(string userId, PantryItemRequest request, CancellationToken ct)
    {
        var item = new PantryItem { UserId = userId.Trim() };
        await ApplyAsync(item, request, ct);
        repository.Add(item);
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await repository.SaveAsync(ct);
        return PantryMapping.ToItemResponse(item, await repository.GetProfileAsync(userId, ct));
    }

    // UpdateAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public async Task<PantryItemResponse> UpdateAsync(string userId, Guid id, PantryItemRequest request, CancellationToken ct)
    {
        var item = await FindAsync(userId, id, ct);
        await ApplyAsync(item, request, ct);
        item.UpdatedAt = DateTimeOffset.UtcNow;
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await repository.SaveAsync(ct);
        return PantryMapping.ToItemResponse(item, await repository.GetProfileAsync(userId, ct));
    }

    // DeleteAsync: Xóa dữ liệu trong phạm vi cho phép và xử lý các liên kết liên quan.
    public async Task DeleteAsync(string userId, Guid id, CancellationToken ct)
    {
        repository.Remove(await FindAsync(userId, id, ct));
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await repository.SaveAsync(ct);
    }

    // GetRecipeSuggestionsAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<IReadOnlyList<PantryRecipeSuggestionResponse>> GetRecipeSuggestionsAsync(
        string userId, PantryRecipeSuggestionQuery query, CancellationToken ct)
    {
        PantryValidation.Validate(query);
        var profile = await repository.GetProfileAsync(userId, ct);
        // BE2-08 | Điểm khớp đếm loại nguyên liệu theo ID. Số lượng trong tủ không tham gia xếp hạng.
        var pantryIds = (await repository.ListAsync(userId, ct)).Where(item => item.IngredientId.HasValue)
            .Select(item => item.IngredientId!.Value).ToHashSet();
        var recipes = await repository.GetActiveRecipesAsync(ct);
        var target = profile is null ? null : ProfileNutritionEstimator.Calculate(profile,
            DateOnly.FromDateTime(DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(7)).DateTime)).DailyNutritionTarget;
        var eaten = mealPlans is null ? new Dictionary<Guid, DateOnly>() : await mealPlans.GetRecentCheckInsAsync(userId,
            DateOnly.FromDateTime(DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(7)).DateTime).AddDays(-21), ct);
        return recipes.Select(recipe =>
            {
                var compatible = PantryMapping.IsRecipeUsableForProfile(recipe, profile);
                var incompatibleNames = recipe.RecipeIngredients.Where(x => x.Ingredient is not null && !PantryMapping.IsUsableForProfile(x.Ingredient, profile))
                    .Select(x => x.Ingredient!.Name).ToArray();
                var nutritionWarning = target is not null && (!MealNutritionSelector.HasNutrition(recipe) ||
                    !MealNutritionSelector.IsNearTarget((recipe.CaloriesPerServing ?? 0) * 3, (recipe.ProteinGramPerServing ?? 0) * 3,
                        (recipe.CarbohydrateGramPerServing ?? 0) * 3, (recipe.FatGramPerServing ?? 0) * 3, target))
                    ? "Dinh dưỡng món chưa gần mức tham chiếu cho một bữa. Bạn vẫn có thể chọn và cân đối các bữa còn lại." : null;
                return new { Suggestion = PantryMapping.ToRecipeSuggestion(recipe, pantryIds) with
                    { IsCompatible = compatible, IncompatibilityReason = compatible ? null : incompatibleNames.Length > 0
                        ? "Nguyên liệu chưa phù hợp hồ sơ: " + string.Join(", ", incompatibleNames) + "." : "Chế độ ăn của món chưa phù hợp hồ sơ.",
                      NutritionWarning = nutritionWarning, LastEatenOn = eaten.TryGetValue(recipe.Id, out var date) ? date : null },
                    Distance = target is null ? null : MealNutritionSelector.MealDistance(recipe, target) };
            })
            .Where(item => query.IncludeAll || item.Suggestion.IsCompatible)
            .Where(item => item.Suggestion.AvailableIngredients.Count > 0)
            .OrderByDescending(item => item.Suggestion.IsCompatible)
            .ThenBy(item => item.Suggestion.LastEatenOn.HasValue)
            .ThenByDescending(item => item.Suggestion.MatchPercent)
            .ThenBy(item => item.Distance ?? decimal.MaxValue)
            .ThenBy(item => item.Suggestion.TotalTimeMinutes).ThenBy(item => item.Suggestion.RecipeName)
            .Take(query.IncludeAll ? int.MaxValue : query.Limit).Select(item => item.Suggestion).ToArray();
    }

    // GetSubstitutionCandidatesAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<IReadOnlyList<PantrySubstitutionCandidateResponse>> GetSubstitutionCandidatesAsync(
        string userId, Guid id, CancellationToken ct)
    {
        var item = await FindAsync(userId, id, ct);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (item.Ingredient is null || string.IsNullOrWhiteSpace(item.Ingredient.DefaultUnit))
            return [];

        var profile = await repository.GetProfileAsync(userId, ct);
        // BE2-08 | Ứng viên thay thế từ catalog phải cùng đơn vị mặc định và qua điều kiện hồ sơ.
        var candidates = await repository.GetActiveIngredientsWithUnitAsync(item.Ingredient.DefaultUnit, ct);
        return candidates.Where(candidate => candidate.Id != item.IngredientId &&
                PantryMapping.IsUsableForProfile(candidate, profile))
            .Select(candidate => PantryMapping.ToSubstitutionCandidate(candidate, profile))
            .Take(10).ToArray();
    }

    // FindAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    private async Task<PantryItem> FindAsync(string userId, Guid id, CancellationToken ct) =>
        await repository.GetAsync(id, userId, ct) ?? throw new KeyNotFoundException("Pantry item not found.");

    // ApplyAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private async Task ApplyAsync(PantryItem item, PantryItemRequest request, CancellationToken ct)
    {
        PantryValidation.Validate(request);
        item.Quantity = request.Quantity;
        item.Unit = request.Unit?.Trim();

        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (request.IngredientId is { } ingredientId)
        {
            var ingredient = await repository.GetActiveIngredientAsync(ingredientId, ct) ??
                throw new KeyNotFoundException("Ingredient not found or inactive.");
            if (await repository.HasIngredientAsync(item.UserId, ingredient.Id, item.Id, ct))
                throw new ConflictException("This ingredient is already in the pantry.");
            item.IngredientId = ingredient.Id;
            item.Ingredient = ingredient;
            item.CustomName = null;
            return;
        }

        var name = request.Name!.Trim();
        var matchingIngredient = await repository.FindActiveIngredientByNameOrAliasAsync(name, ct);
        if (matchingIngredient is not null)
        {
            if (await repository.HasIngredientAsync(item.UserId, matchingIngredient.Id, item.Id, ct))
                throw new ConflictException("This ingredient is already in the pantry.");
            item.IngredientId = matchingIngredient.Id;
            item.Ingredient = matchingIngredient;
            item.CustomName = null;
            return;
        }

        if (await repository.HasCustomNameAsync(item.UserId, name, item.Id, ct))
            throw new ConflictException("This unmatched ingredient is already in the pantry.");
        item.IngredientId = null;
        item.Ingredient = null;
        item.CustomName = name;
    }
}
