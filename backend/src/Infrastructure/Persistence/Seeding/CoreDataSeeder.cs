using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Seeding;

public static class CoreDataSeeder
{
    // Stable IDs allow reruns without duplicating or overwriting data edited by an Admin.
    private static Guid Id(int value) => Guid.Parse($"10000000-0000-0000-0000-{value:000000000000}");

    public static async Task SeedAsync(AppDbContext db, CancellationToken ct = default)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        var categories = new[]
        {
            new Category { Id = Id(1), Name = "[Mẫu] Món chính" },
            new Category { Id = Id(2), Name = "[Mẫu] Món phụ" },
            new Category { Id = Id(3), Name = "[Mẫu] Đồ uống" }
        };
        var ingredients = new[]
        {
            Ingredient(101, "Đậu hũ", IngredientOrigin.Plant, allergens: "Đậu nành"),
            Ingredient(102, "Gạo", IngredientOrigin.Plant),
            Ingredient(103, "Trứng", IngredientOrigin.Animal, egg: true, allergens: "Trứng"),
            Ingredient(104, "Sữa", IngredientOrigin.Animal, milk: true, allergens: "Sữa"),
            Ingredient(105, "Mật ong", IngredientOrigin.Animal, honey: true),
            Ingredient(106, "Gia vị chưa xác minh", IngredientOrigin.Unknown),
            Ingredient(107, "Nước mắm cá", IngredientOrigin.Animal, otherAnimal: true, allergens: "Cá")
        };
        var recipes = new[]
        {
            Recipe(201, 1, "Cơm đậu hũ", 20, 300, (101, 100), (102, 80)),
            Recipe(202, 1, "Cơm trứng", 15, 350, (102, 80), (103, 50)),
            Recipe(203, 2, "Cháo sữa", 25, 250, (102, 50), (104, 100)),
            Recipe(204, 2, "Trứng sữa hấp", 15, 200, (103, 50), (104, 100)),
            Recipe(205, 3, "Sữa mật ong", 5, 150, (104, 100), (105, 10)),
            Recipe(206, 1, "Đậu hũ với gia vị chưa rõ", 10, null, (101, 100), (106, 5))
        };

        foreach (var category in categories)
        {
            if (!await db.Categories.AnyAsync(x => x.Id == category.Id, ct))
            {
                db.Categories.Add(category);
            }
        }
        foreach (var ingredient in ingredients)
        {
            if (!await db.Ingredients.AnyAsync(x => x.Id == ingredient.Id, ct))
            {
                db.Ingredients.Add(ingredient);
            }
        }
        await db.SaveChangesAsync(ct);

        foreach (var recipe in recipes)
        {
            if (!await db.Recipes.AnyAsync(x => x.Id == recipe.Id, ct))
            {
                db.Recipes.Add(recipe);
            }
        }
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
    }

    private static Ingredient Ingredient(
        int id, string name, IngredientOrigin origin,
        bool egg = false, bool milk = false, bool honey = false,
        bool otherAnimal = false, string? allergens = null) => new()
        {
            Id = Id(id),
            Name = $"[Mẫu] {name}",
            Origin = origin,
            ContainsEgg = egg,
            ContainsMilk = milk,
            ContainsHoney = honey,
            ContainsOtherAnimalProducts = origin == IngredientOrigin.Unknown ? null : otherAnimal,
            Allergens = allergens,
            DefaultUnit = "g",
            Source = "Dữ liệu mẫu kiểm thử; chưa dùng làm nguồn dinh dưỡng thực tế."
        };

    private static Recipe Recipe(
        int id, int categoryId, string name, int cookTime, decimal? calories,
        params (int IngredientId, decimal Quantity)[] ingredients) => new()
        {
            Id = Id(id),
            CategoryId = Id(categoryId),
            Name = $"[Mẫu] {name}",
            Description = "Công thức và số dinh dưỡng minh họa để kiểm thử, không phải dữ liệu dinh dưỡng đã xác minh.",
            Servings = 1,
            Instructions = "Hướng dẫn mẫu; cần Admin bổ sung cách chế biến trước khi sử dụng thực tế.",
            PrepTimeMinutes = 5,
            CookTimeMinutes = cookTime,
            CaloriesPerServing = calories,
            RecipeIngredients = ingredients.Select(row => new RecipeIngredient
            {
                RecipeId = Id(id),
                IngredientId = Id(row.IngredientId),
                Quantity = row.Quantity,
                Unit = "g"
            }).ToList()
        };
}
