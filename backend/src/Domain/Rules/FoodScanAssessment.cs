// Chức năng: phân tích ảnh món ăn và nhãn thành phần. Tầng Domain mô tả dữ liệu hoặc quy tắc nghiệp vụ, không phụ thuộc HTTP hay cơ sở dữ liệu.
using Domain.Enums;

namespace Domain.Rules;

// FoodScanAssessment: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public static class FoodScanAssessment
{
    // Evaluate: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public static FoodScanAssessmentStatus Evaluate(
        VegetarianDiet diet,
        IReadOnlyCollection<IngredientKind> ingredients,
        bool ingredientsComplete)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (ingredients.Any(kind => IsIncompatible(diet, kind)))
            return FoodScanAssessmentStatus.Incompatible;

        if (!ingredientsComplete || ingredients.Count == 0
            || ingredients.Contains(IngredientKind.Unknown))
            return FoodScanAssessmentStatus.InsufficientInformation;

        return FoodScanAssessmentStatus.SuitableBasedOnProvidedInformation;
    }

    // IsIncompatible: Đánh giá điều kiện nghiệp vụ để quyết định nhánh xử lý.
    private static bool IsIncompatible(VegetarianDiet diet, IngredientKind ingredient) =>
        ingredient == IngredientKind.Animal
        || (ingredient == IngredientKind.Egg && diet is VegetarianDiet.Vegan or VegetarianDiet.Lacto)
        || (ingredient == IngredientKind.Dairy && diet is VegetarianDiet.Vegan or VegetarianDiet.Ovo)
        || (ingredient == IngredientKind.Honey && diet == VegetarianDiet.Vegan);
}
