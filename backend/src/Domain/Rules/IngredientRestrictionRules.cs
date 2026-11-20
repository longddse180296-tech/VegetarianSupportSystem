using System.Text;
using System.Text.RegularExpressions;
using Domain.Entities;

namespace Domain.Rules;

// Dùng chung cho thực đơn và tủ bếp: dị ứng có thể là tên nguyên liệu, tên gọi khác hoặc nhóm dị nguyên.
public static class IngredientRestrictionRules
{
    public static bool MatchesAllergy(Ingredient ingredient, string term) =>
        MatchesNameOrAlias(ingredient, term) || ContainsTerm(ingredient.Allergens, term);

    public static bool MatchesNameOrAlias(Ingredient ingredient, string term) =>
        ContainsTerm(ingredient.Name, term) || ContainsTerm(ingredient.Aliases, term);

    public static bool ContainsTerm(string? source, string term)
    {
        if (string.IsNullOrWhiteSpace(source) || string.IsNullOrWhiteSpace(term)) return false;
        var normalized = Normalize(term);
        return source.Split([',', ';', '|'], StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
            .Any(value => string.Equals(Normalize(value), normalized, StringComparison.OrdinalIgnoreCase));
    }

    // Giữ dấu tiếng Việt; chỉ chuẩn hóa Unicode và khoảng trắng để tên cùng nghĩa được so sánh nhất quán.
    private static string Normalize(string value) => Regex.Replace(value.Trim().Normalize(NormalizationForm.FormC), @"\s+", " ");
}
