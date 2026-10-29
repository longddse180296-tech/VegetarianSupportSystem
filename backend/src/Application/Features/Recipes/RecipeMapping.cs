// Chức năng: công thức và định lượng nguyên liệu. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using Domain.Entities;
using Domain.Rules;

namespace Application.Features.Recipes;

// RecipeMapping: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
internal static class RecipeMapping
{
    // ToResponse: Chuyển dữ liệu nội bộ sang cấu trúc trả về cho bên gọi.
    public static RecipeResponse ToResponse(Recipe entity) => new(
        entity.Id,
        entity.CategoryId,
        entity.Name,
        entity.Description,
        entity.Servings,
        entity.Instructions,
        entity.PrepTimeMinutes,
        entity.CookTimeMinutes,
        entity.ImageUrl,
        entity.CaloriesPerServing,
        entity.ProteinGramPerServing,
        entity.CarbohydrateGramPerServing,
        entity.FatGramPerServing,
        entity.DeclaredDietaryType,
        entity.IsActive,
        entity.CreatedAt,
        entity.UpdatedAt,
        entity.Category!.Name,
        entity.RecipeIngredients
            .OrderBy(row => row.Ingredient!.Name)
            .ThenBy(row => row.IngredientId)
            .Select(ToIngredientResponse)
            .ToArray(),
        DietaryRules.Classify(entity.RecipeIngredients.Select(row => row.Ingredient!)));

    // ToSummary: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public static RecipeSummary ToSummary(Recipe entity) => new(
        entity.Id,
        entity.Name,
        entity.CategoryId,
        entity.Category!.Name,
        entity.Servings,
        entity.PrepTimeMinutes,
        entity.CookTimeMinutes,
        entity.ImageUrl,
        entity.CaloriesPerServing,
        entity.DeclaredDietaryType,
        entity.IsActive,
        DietaryRules.Classify(entity.RecipeIngredients.Select(x => x.Ingredient!)),
        entity.ProteinGramPerServing,
        entity.CarbohydrateGramPerServing,
        entity.FatGramPerServing,
        entity.RecipeIngredients
            .OrderBy(x => x.Ingredient!.Name)
            .Select(x => x.Ingredient!.Name)
            .ToArray(),
        // Danh sách dùng cùng mô tả đã lưu với trang chi tiết, không tự tạo nội dung thay thế.
        entity.Description);

    // ToIngredientResponse: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private static RecipeIngredientResponse ToIngredientResponse(RecipeIngredient row) => new(
        row.IngredientId,
        row.Ingredient!.Name,
        row.Ingredient.IsActive,
        row.Quantity,
        row.Unit,
        row.Note);
}
