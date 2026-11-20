using Domain.Entities;
using Domain.Rules;

namespace Domain.Tests;

public sealed class MealNutritionSelectorTests
{
    private static Recipe Meal(string name, decimal calories) => new() {
        Name = name, CaloriesPerServing = calories, ProteinGramPerServing = calories * 0.2m / 4,
        CarbohydrateGramPerServing = calories * 0.5m / 4, FatGramPerServing = calories * 0.3m / 9 };

    [Fact]
    public void ChoosesCombinationClosestToAllDailyTargetsWithoutRepeatingWithinDay()
    {
        var good = new[] { Meal("A", 400), Meal("B", 600), Meal("C", 800) };
        var recipes = good.Concat(new[] { Meal("Too much", 3000), new Recipe { Name = "Missing nutrition", CaloriesPerServing = 600 } }).ToArray();
        var selected = MealNutritionSelector.SelectDay(recipes, new(1800, 90, 225, 60), new Dictionary<Guid, int>());
        Assert.Equal(3, selected.Length);
        Assert.Equal(3, selected.Select(r => r.Id).Distinct().Count());
        Assert.Equal(1800m, selected.Sum(r => r.CaloriesPerServing));
        Assert.Equal(90m, selected.Sum(r => r.ProteinGramPerServing));
        Assert.All(selected, r => Assert.Contains(r, good));
    }

    [Fact]
    public void LimitedCatalogCanRepeatButMissingDataReturnsNoPretendMatch()
    {
        var recipe = Meal("Only available meal", 500);
        var target = new DailyNutritionTarget(1500, 75, 187.5m, 50);
        Assert.Equal(3, MealNutritionSelector.SelectDay([recipe], target, new Dictionary<Guid, int>()).Length);
        Assert.Empty(MealNutritionSelector.SelectDay([new Recipe()], target, new Dictionary<Guid, int>()));
    }
}
