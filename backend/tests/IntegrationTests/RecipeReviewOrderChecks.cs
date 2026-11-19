using System.Net.Http.Json;
using Application.Features.Recipes;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Persistence;

namespace CoreDataChecks;

internal static class RecipeReviewOrderChecks
{
    public static async Task RunAsync(HttpClient client, AppDbContext db, Action<bool, string> check)
    {
        var category = new Category { Name = "Review order fixture" };
        var plant = new Ingredient { Name = "Review order plant" };
        var changed = new Ingredient { Name = "Review order changed" };
        var recipes = Enumerable.Range(0, 12).Select(index => new Recipe
        {
            Name = $"Review order {index:D2}",
            Category = category,
            Servings = 1,
            Instructions = "Fixture",
            DeclaredDietaryType = DietaryType.Vegan,
            CaloriesPerServing = index + 1,
            RecipeIngredients =
            [
                new RecipeIngredient { Ingredient = index >= 10 ? changed : plant, Quantity = 100, Unit = "g" }
            ]
        }).ToArray();
        db.Recipes.AddRange(recipes);
        await db.SaveChangesAsync();

        var url = $"/api/admin/recipes?categoryId={category.Id}&pageSize=2";
        var before = (await client.GetFromJsonAsync<RecipePage>(url))!;
        check(before.Items.Select(item => item.Id).SequenceEqual(recipes.Take(2).Select(item => item.Id)),
            "compatible admin recipes use the usual name order");

        // Đổi dữ liệu nguyên liệu sau khi công thức đã tồn tại để tạo cảnh báo trên các trang sau.
        changed.ContainsEgg = true;
        await db.SaveChangesAsync();
        foreach (var sort in new[] { "", "&calorieSort=asc", "&calorieSort=desc" })
        {
            var page = (await client.GetFromJsonAsync<RecipePage>(url + sort))!;
            check(page.TotalCount == 12 &&
                page.Items.Select(item => item.Id).ToHashSet().SetEquals(recipes.Skip(10).Select(item => item.Id)) &&
                page.Items.All(item => item.DietaryAssessments.Any(assessment =>
                    assessment.DietaryType == DietaryType.Vegan && assessment.Status == DietaryCompatibility.Incompatible)),
                "admin promotes every review warning before pagination and calorie sort: " + sort);
        }
        var filtered = (await client.GetFromJsonAsync<RecipePage>(url + "&declaredDietaryType=Vegan&search=Review"))!;
        check(filtered.Items.All(item => recipes.Skip(10).Any(recipe => recipe.Id == item.Id)),
            "admin review priority applies within the selected filters");
        var next = (await client.GetFromJsonAsync<RecipePage>(url + "&pageNumber=2"))!;
        check(next.Items.Select(item => item.Id).SequenceEqual(recipes.Take(2).Select(item => item.Id)),
            "normal recipes follow warnings on subsequent admin pages");
        var publicPage = (await client.GetFromJsonAsync<RecipePage>(
            $"/api/recipes?categoryId={category.Id}&pageSize=2"))!;
        check(publicPage.Items.Select(item => item.Id).SequenceEqual(recipes.Take(2).Select(item => item.Id)),
            "public recipe ordering retains its name order");
        changed.ContainsEgg = false;
        await db.SaveChangesAsync();
        var restored = (await client.GetFromJsonAsync<RecipePage>(url))!;
        check(restored.Items.Select(item => item.Id).SequenceEqual(recipes.Take(2).Select(item => item.Id)),
            "review priority disappears when ingredient evidence becomes compatible again");

        db.Recipes.RemoveRange(recipes);
        await db.SaveChangesAsync();
        db.Categories.Remove(category);
        db.Ingredients.RemoveRange(plant, changed);
        await db.SaveChangesAsync();
    }
}
