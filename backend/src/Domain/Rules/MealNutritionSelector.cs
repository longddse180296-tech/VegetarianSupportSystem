using Domain.Entities;

namespace Domain.Rules;

// Chọn 3 món một người/ngày gần mục tiêu nhất trong kho công thức đã lọc an toàn.
public static class MealNutritionSelector
{
    public static decimal? MealDistance(Recipe recipe, DailyNutritionTarget target) => HasNutrition(recipe)
        ? Score(recipe.CaloriesPerServing!.Value * 3, recipe.ProteinGramPerServing!.Value * 3,
            recipe.CarbohydrateGramPerServing!.Value * 3, recipe.FatGramPerServing!.Value * 3, target)
        : null;
    public static Recipe[] SelectDay(IReadOnlyList<Recipe> recipes, DailyNutritionTarget target, IReadOnlyDictionary<Guid, int> usage)
    {
        var candidates = recipes.Where(HasNutrition)
            .OrderBy(r => Score(r.CaloriesPerServing!.Value * 3, r.ProteinGramPerServing!.Value * 3,
                r.CarbohydrateGramPerServing!.Value * 3, r.FatGramPerServing!.Value * 3, target)
                + usage.GetValueOrDefault(r.Id) * 0.025m)
            .Take(24).ToArray();
        if (candidates.Length == 0) return [];
        Recipe[] best = [];
        var bestScore = decimal.MaxValue;
        foreach (var first in candidates)
        foreach (var second in candidates)
        foreach (var third in candidates)
        {
            if (candidates.Length >= 3 && (first.Id == second.Id || first.Id == third.Id || second.Id == third.Id)) continue;
            var cost = Score(first.CaloriesPerServing!.Value + second.CaloriesPerServing!.Value + third.CaloriesPerServing!.Value,
                first.ProteinGramPerServing!.Value + second.ProteinGramPerServing!.Value + third.ProteinGramPerServing!.Value,
                first.CarbohydrateGramPerServing!.Value + second.CarbohydrateGramPerServing!.Value + third.CarbohydrateGramPerServing!.Value,
                first.FatGramPerServing!.Value + second.FatGramPerServing!.Value + third.FatGramPerServing!.Value, target)
                + (usage.GetValueOrDefault(first.Id) + usage.GetValueOrDefault(second.Id) + usage.GetValueOrDefault(third.Id)) * 0.025m;
            if (cost < bestScore) { bestScore = cost; best = [first, second, third]; }
        }
        return best;
    }

    public static bool HasNutrition(Recipe r) => r.CaloriesPerServing is > 0 && r.ProteinGramPerServing is >= 0 &&
        r.CarbohydrateGramPerServing is >= 0 && r.FatGramPerServing is >= 0;

    private static decimal Score(decimal calories, decimal protein, decimal carbs, decimal fat, DailyNutritionTarget target) =>
        Math.Abs(calories - target.Calories) / Math.Max(1, target.Calories) +
        0.3m * Math.Abs(protein - target.ProteinGrams) / Math.Max(1, target.ProteinGrams) +
        0.2m * Math.Abs(carbs - target.CarbohydrateGrams) / Math.Max(1, target.CarbohydrateGrams) +
        0.2m * Math.Abs(fat - target.FatGrams) / Math.Max(1, target.FatGrams);
}
