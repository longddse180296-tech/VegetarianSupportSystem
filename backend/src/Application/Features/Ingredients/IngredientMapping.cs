// Chức năng: danh mục nguyên liệu và dữ liệu dinh dưỡng. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using Domain.Entities;

namespace Application.Features.Ingredients;

// IngredientMapping: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
internal static class IngredientMapping
{
    // ToResponse: Chuyển dữ liệu nội bộ sang cấu trúc trả về cho bên gọi.
    public static IngredientResponse ToResponse(Ingredient entity) => new(
        entity.Id,
        entity.Name,
        entity.Aliases,
        entity.Origin,
        entity.ContainsEgg,
        entity.ContainsMilk,
        entity.ContainsHoney,
        entity.ContainsOtherAnimalProducts,
        entity.Allergens,
        entity.DefaultUnit,
        Per100Gram(entity.Calories, entity),
        Per100Gram(entity.ProteinGram, entity),
        Per100Gram(entity.CarbohydrateGram, entity),
        Per100Gram(entity.FatGram, entity),
        entity.Source,
        entity.IsActive,
        entity.CreatedAt,
        entity.UpdatedAt,
        entity.Calories, entity.ProteinGram, entity.CarbohydrateGram, entity.FatGram,
        entity.NutritionBasisQuantity, entity.NutritionBasisUnit);

    // Per100Gram: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private static decimal? Per100Gram(decimal? value, Ingredient entity) =>
        entity.NutritionBasisUnit is "g" or "kg"
            ? value * 100 / (entity.NutritionBasisQuantity * (entity.NutritionBasisUnit == "kg" ? 1000 : 1))
            : null;
}
