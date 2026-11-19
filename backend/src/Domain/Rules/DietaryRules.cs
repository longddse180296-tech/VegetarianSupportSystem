// BE2-03 (dùng chung) | Đánh giá từng chế độ ăn từ nguồn gốc và thành phần. Vi phạm đã biết ưu tiên hơn dữ liệu chưa rõ.
// Đánh giá độ tương thích với từng chế độ ăn từ nguồn gốc và thành phần nguyên liệu.
using System.Linq.Expressions;
using Domain.Entities;
using Domain.Enums;
using Domain.ValueObjects;

namespace Domain.Rules;

// DietaryRules: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public static class DietaryRules
{
    // Nhãn duy nhất của món theo thành phần, khác với danh sách các chế độ người dùng có thể ăn món đó.
    public static DietaryType? InferRecipeDiet(IEnumerable<Ingredient> ingredients)
    {
        var items = ingredients.ToArray();
        if (items.Length == 0) return null;
        var egg = items.Any(x => x.ContainsEgg);
        var milk = items.Any(x => x.ContainsMilk);
        return egg && milk ? DietaryType.LactoOvoVegetarian : egg ? DietaryType.OvoVegetarian
            : milk ? DietaryType.LactoVegetarian : DietaryType.Vegan;
    }
    // Món thuần chay phù hợp các chế độ chay rộng hơn. Chay trứng và chay sữa là hai nhóm độc lập.
    public static bool SupportsDiet(DietaryType declared, DietaryType requested) =>
        declared == DietaryType.Vegan || declared == requested || requested == DietaryType.LactoOvoVegetarian;

    // Expressions are shared by in-memory classification and SQL filtering.
    // IncompatibleIngredient: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public static Expression<Func<Ingredient, bool>> IncompatibleIngredient(DietaryType diet) => diet switch
    {
        DietaryType.Vegan => ingredient => ingredient.ContainsEgg || ingredient.ContainsMilk || ingredient.ContainsHoney,
        DietaryType.LactoVegetarian => ingredient => ingredient.ContainsEgg,
        DietaryType.OvoVegetarian => ingredient => ingredient.ContainsMilk,
        DietaryType.LactoOvoVegetarian => ingredient => false,
        _ => throw new ArgumentOutOfRangeException(nameof(diet))
    };

    private static readonly IReadOnlyDictionary<DietaryType, Func<Ingredient, bool>> IsIncompatible =
        Enum.GetValues<DietaryType>().ToDictionary(diet => diet, diet => IncompatibleIngredient(diet).Compile());

    // Classify: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public static IReadOnlyList<DietaryAssessment> Classify(IEnumerable<Ingredient> ingredients)
    {
        var items = ingredients.ToArray();
        var hasUnknown = items.Length == 0;

        return Enum.GetValues<DietaryType>()
            .Select(diet => new DietaryAssessment(diet,
                items.Any(IsIncompatible[diet])
                    ? DietaryCompatibility.Incompatible
                    : hasUnknown ? DietaryCompatibility.Unknown : DietaryCompatibility.Compatible))
            .ToArray();
    }
}
