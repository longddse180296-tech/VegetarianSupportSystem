// Kiểm thử độ tương thích với các chế độ ăn dựa trên thành phần đã biết.
// BE2-03/07 | Đối chiếu kết quả phân loại bốn chế độ ăn với nguồn gốc và bằng chứng nguyên liệu.
using Domain.Entities;
using Domain.Enums;
using Domain.Rules;

namespace CoreDataChecks;

internal static class DietaryChecks
{
    public static void Run(Action<bool, string> check)
    {
        Ingredient Plant() => new();
        Ingredient WithComponents(bool egg = false, bool milk = false, bool honey = false) =>
            new()
            {
                ContainsEgg = egg,
                ContainsMilk = milk,
                ContainsHoney = honey
            };
        var cases = new (string Name, Ingredient[] Ingredients, int[] Expected)[]
        {
            ("plant", [Plant()], [1, 1, 1, 1]),
            ("egg", [Plant(), WithComponents(egg: true)], [2, 2, 1, 1]),
            ("milk", [WithComponents(milk: true)], [2, 1, 2, 1]),
            ("egg and milk", [WithComponents(egg: true), WithComponents(milk: true)], [2, 2, 2, 1]),
            ("honey", [WithComponents(honey: true)], [2, 1, 1, 1]),
            ("empty recipe", [], [0, 0, 0, 0])
        };

        foreach (var test in cases)
        {
            var actual = DietaryRules.Classify(test.Ingredients).Select(x => (int)x.Status);
            check(actual.SequenceEqual(test.Expected), "dietary rules: " + test.Name);
        }
    }
}
