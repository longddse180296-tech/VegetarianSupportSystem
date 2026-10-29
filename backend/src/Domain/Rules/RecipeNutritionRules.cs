// Chức năng: công thức và định lượng nguyên liệu. Tầng Domain mô tả dữ liệu hoặc quy tắc nghiệp vụ, không phụ thuộc HTTP hay cơ sở dữ liệu.
using Domain.Entities;

namespace Domain.Rules;

// RecipeNutritionRules: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public static class RecipeNutritionRules
{
    // QuantityUnit: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public static string QuantityUnit(Ingredient ingredient) =>
        ingredient.DefaultUnit?.Trim().ToLowerInvariant() is "g" or "kg" or "ml" or "đơn vị" ?
            ingredient.DefaultUnit.Trim().ToLowerInvariant() : ingredient.NutritionBasisUnit;

    // BasisRatio: Quy đổi lượng nguyên liệu theo mốc dinh dưỡng; không suy đoán đổi ml hoặc số lượng sang gram.
    public static decimal? BasisRatio(Ingredient ingredient, decimal quantity, string unit)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (quantity <= 0 || ingredient.NutritionBasisQuantity <= 0) return null;
        var basisUnit = ingredient.NutritionBasisUnit;
        if (unit is "g" or "kg" && basisUnit is "g" or "kg")
            return quantity * (unit == "kg" ? 1000 : 1) /
                (ingredient.NutritionBasisQuantity * (basisUnit == "kg" ? 1000 : 1));
        return unit == basisUnit ? quantity / ingredient.NutritionBasisQuantity : null;
    }
}
