using Domain.Entities;
using Domain.Enums;
using Domain.Rules;

namespace CoreDataChecks;

internal static class DietaryChecks
{
    public static void Run(Action<bool, string> check)
    {
        Ingredient Plant() => new() { Origin = IngredientOrigin.Plant };
        Ingredient Animal(bool egg = false, bool milk = false, bool honey = false, bool? other = false) =>
            new()
            {
                Origin = IngredientOrigin.Animal,
                ContainsEgg = egg,
                ContainsMilk = milk,
                ContainsHoney = honey,
                ContainsOtherAnimalProducts = other
            };
        var unknown = new Ingredient { Origin = IngredientOrigin.Unknown };
        var cases = new (string Name, Ingredient[] Ingredients, int[] Expected)[]
        {
            ("plant", [Plant()], [1, 1, 1, 1]),
            ("egg", [Plant(), Animal(egg: true)], [2, 2, 1, 1]),
            ("milk", [Animal(milk: true)], [2, 1, 2, 1]),
            ("egg and milk", [Animal(egg: true), Animal(milk: true)], [2, 2, 2, 1]),
            ("honey", [Animal(honey: true)], [2, 1, 1, 1]),
            ("other animal", [Animal(other: true)], [2, 2, 2, 2]),
            ("unknown", [unknown], [0, 0, 0, 0]),
            ("known violation wins over unknown", [unknown, Animal(egg: true)], [2, 2, 0, 0]),
            ("meat and unknown", [unknown, Animal(other: true)], [2, 2, 2, 2]),
            ("unclassified animal", [Animal()], [0, 0, 0, 0]),
            ("egg without other animal evidence", [Animal(egg: true, other: null)], [2, 2, 0, 0]),
            ("empty recipe", [], [0, 0, 0, 0])
        };

        foreach (var test in cases)
        {
            var actual = DietaryRules.Classify(test.Ingredients).Select(x => (int)x.Status);
            check(actual.SequenceEqual(test.Expected), "dietary rules: " + test.Name);
        }
    }
}
