// BE2-01/04 | Điều phối nghiệp vụ và kiểm tra điều kiện trước khi lưu (công thức: bộ lọc public, định lượng và dinh dưỡng theo khẩu phần).
// Kiểm tra danh mục Công thức, nguyên liệu, chế độ ăn và tính dinh dưỡng trước khi lưu công thức.
using Application.Common.Exceptions;
using Application.Common.Validation;
using Domain.Entities;
using Application.Features.Categories;
using Application.Features.Ingredients;
using Domain.Enums;
using Domain.Rules;

namespace Application.Features.Recipes;

// RecipeService: điều phối các bước nghiệp vụ và xử lý kết quả cho bên gọi.
public sealed class RecipeService(
    IRecipeRepository repository,
    ICategoryRepository categories,
    IIngredientRepository ingredients)
{
    public Task<int> CountRequiringReviewAsync(CancellationToken ct) => repository.CountRequiringReviewAsync(ct);
    // ListAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<RecipePage> ListAsync(RecipeListQuery query, bool includeInactive, CancellationToken ct)
    {
        RequestValidation.Validate(query);
        var (items, count) = await repository.ListAsync(query, includeInactive, ct);
        return new(items.Select(RecipeMapping.ToSummary).ToArray(), query.PageNumber, query.PageSize, count);
    }

    // GetAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<RecipeResponse> GetAsync(Guid id, bool includeInactive, CancellationToken ct)
    {
        var entity = await FindAsync(id, ct);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (!includeInactive && !entity.IsActive)
        {
            throw new KeyNotFoundException("Không tìm thấy công thức hoặc công thức không còn khả dụng.");
        }
        return RecipeMapping.ToResponse(entity);
    }

    // CreateAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public async Task<RecipeResponse> CreateAsync(RecipeRequest request, CancellationToken ct)
    {
        var entity = new Recipe();
        await ApplyAsync(entity, request, ct);
        repository.Add(entity);
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await repository.SaveAsync(ct);
        return RecipeMapping.ToResponse(entity);
    }

    // UpdateAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public async Task<RecipeResponse> UpdateAsync(Guid id, RecipeRequest request, CancellationToken ct)
    {
        var entity = await FindAsync(id, ct);
        await ApplyAsync(entity, request, ct);
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await repository.SaveAsync(ct);
        return RecipeMapping.ToResponse(entity);
    }

    // BE2-04 | Kích hoạt lại giữ nguyên nội dung, ảnh và định lượng; gọi lặp khi đang hoạt động vẫn thành công.
    public async Task ActivateAsync(Guid id, CancellationToken ct)
    {
        var entity = await FindAsync(id, ct);
        if (entity.IsActive) return;
        entity.IsActive = true;
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        await repository.SaveAsync(ct);
    }

    // Đánh dấu công thức ngừng sử dụng và ghi lại thời điểm cập nhật.
    public async Task DeactivateAsync(Guid id, CancellationToken ct)
    {
        var entity = await FindAsync(id, ct);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (!entity.IsActive)
        {
            return;
        }
        entity.IsActive = false;
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await repository.SaveAsync(ct);
    }

    // FindAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    private async Task<Recipe> FindAsync(Guid id, CancellationToken ct) =>
        await repository.GetAsync(id, ct) ?? throw new KeyNotFoundException("Không tìm thấy công thức hoặc công thức không còn khả dụng.");

    // Kiểm tra thông tin, loại danh mục và nguyên liệu trước khi cập nhật công thức cùng các dòng định lượng.
    private async Task ApplyAsync(Recipe entity, RecipeRequest request, CancellationToken ct)
    {
        RecipeValidation.Validate(request);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (await repository.NameExistsAsync(request.Name.Trim(), entity.Id, ct))
        {
            throw new ConflictException("Tên công thức đã tồn tại. Vui lòng kiểm tra cả công thức đã ngừng sử dụng.");
        }

        var category = await categories.GetAsync(request.CategoryId, ct);
        if (category is null || category.Kind != CategoryKind.Recipe || (!category.IsActive && entity.CategoryId != category.Id))
        {
            RecipeValidation.Fail(nameof(request.CategoryId), "Vui lòng chọn danh mục đang được sử dụng.");
        }
        var ids = request.Ingredients.Select(x => x.IngredientId).ToArray();
        var selected = await ingredients.GetManyAsync(ids, ct);
        var existingIds = entity.RecipeIngredients.Select(x => x.IngredientId).ToHashSet();
        if (selected.Count != ids.Length || selected.Any(x => !x.IsActive && !existingIds.Contains(x.Id)))
        {
            RecipeValidation.Fail(nameof(request.Ingredients), "Một số nguyên liệu không tồn tại hoặc đã ngừng sử dụng. Vui lòng chọn lại.");
        }
        var declaredDietaryType = request.DeclaredDietaryType!.Value;
        var inferredDiet = DietaryRules.InferRecipeDiet(selected);
        if (declaredDietaryType != inferredDiet)
        {
            var expected = inferredDiet switch
            {
                DietaryType.Vegan => "Thuần chay",
                DietaryType.OvoVegetarian => "Chay có trứng",
                DietaryType.LactoVegetarian => "Chay có sữa",
                DietaryType.LactoOvoVegetarian => "Chay có trứng và sữa",
                _ => "Chưa xác định"
            };
            RecipeValidation.Fail(nameof(request.DeclaredDietaryType), $"Nguyên liệu hiện tại thuộc loại {expected}. Vui lòng chọn đúng loại ăn chay của công thức.");
        }
        var assessment = DietaryRules.Classify(selected).Single(item => item.DietaryType == declaredDietaryType);
        if (assessment.Status != DietaryCompatibility.Compatible)
        {
            RecipeValidation.Fail(
                nameof(request.DeclaredDietaryType),
                "Chế độ ăn đã chọn chưa phù hợp với toàn bộ nguyên liệu trong công thức. Vui lòng kiểm tra thành phần hoặc chọn lại chế độ ăn.");
        }
        entity.Category = category;
        var nutrition = RecipeNutritionService.Calculate(new RecipeNutritionRequest
        {
            Servings = request.Servings!.Value,
            Ingredients = request.Ingredients
        }, selected);
        if (!nutrition.IsComplete)
            RecipeValidation.Fail(nameof(request.Ingredients), string.Join(" ", nutrition.Issues.Select(x => x.Message)));
        UpdateIngredients(entity, request.Ingredients, selected);

        entity.CategoryId = request.CategoryId;
        entity.Name = request.Name.Trim();
        entity.Description = request.Description?.Trim();
        entity.Servings = request.Servings!.Value;
        entity.Instructions = request.Instructions.Trim();
        entity.PrepTimeMinutes = request.PrepTimeMinutes!.Value;
        entity.CookTimeMinutes = request.CookTimeMinutes!.Value;
        entity.ImageUrl = request.ImageUrl?.Trim();
        entity.CaloriesPerServing = nutrition.CaloriesPerServing;
        entity.ProteinGramPerServing = nutrition.ProteinGramPerServing;
        entity.CarbohydrateGramPerServing = nutrition.CarbohydrateGramPerServing;
        entity.FatGramPerServing = nutrition.FatGramPerServing;
        entity.DeclaredDietaryType = declaredDietaryType;
    }

    // UpdateIngredients: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    private static void UpdateIngredients(
        Recipe entity,
        IReadOnlyList<RecipeIngredientRequest> rows,
        IReadOnlyList<Ingredient> selected)
    {
        var ids = rows.Select(row => row.IngredientId).ToHashSet();
        // Update retained rows in place to avoid tracking two instances of the same composite key.
        foreach (var removed in entity.RecipeIngredients.Where(x => !ids.Contains(x.IngredientId)).ToArray())
        {
            entity.RecipeIngredients.Remove(removed);
        }
        foreach (var row in rows)
        {
            var link = entity.RecipeIngredients.SingleOrDefault(x => x.IngredientId == row.IngredientId);
            if (link is null)
            {
                link = new RecipeIngredient { RecipeId = entity.Id, IngredientId = row.IngredientId };
                entity.RecipeIngredients.Add(link);
            }
            link.Ingredient = selected.Single(x => x.Id == row.IngredientId);
            link.Quantity = row.Quantity;
            link.Unit = row.Unit.Trim();
            link.Note = row.Note?.Trim();
        }
    }
}
