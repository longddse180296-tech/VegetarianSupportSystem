using System.Net.Http.Json;
using System.Net;
using Microsoft.EntityFrameworkCore;
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
            CaloriesPerServing = index + 1, ProteinGramPerServing = 10, CarbohydrateGramPerServing = 20, FatGramPerServing = 5,
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

        // Khóa rồi mở lại phải được lưu thật, cho public xem lại và không làm mất nội dung/nguyên liệu.
        var target = recipes[0];
        var activateUrl = $"/api/admin/recipes/{target.Id}/activate";
        client.DefaultRequestHeaders.Remove("Test-Role");
        check((await client.PostAsync(activateUrl, null)).StatusCode == HttpStatusCode.Unauthorized,
            "recipe activation requires authentication");
        client.DefaultRequestHeaders.Add("Test-Role", "User");
        check((await client.PostAsync(activateUrl, null)).StatusCode == HttpStatusCode.Forbidden,
            "recipe activation rejects non-admin users");
        client.DefaultRequestHeaders.Remove("Test-Role");
        client.DefaultRequestHeaders.Add("Test-Role", "Admin");
        check((await client.PostAsync($"/api/admin/recipes/{target.Id}/deactivate", null)).StatusCode == HttpStatusCode.NoContent,
            "recipe deactivation succeeds before activation");
        check((await client.GetAsync($"/api/recipes/{target.Id}")).StatusCode == HttpStatusCode.NotFound,
            "deactivated recipe is hidden from public detail");
        check((await client.PostAsync(activateUrl, null)).StatusCode == HttpStatusCode.NoContent,
            "admin can activate a deactivated recipe");
        var persisted = await db.Recipes.AsNoTracking().Include(x => x.RecipeIngredients).SingleAsync(x => x.Id == target.Id);
        check(persisted.IsActive && persisted.UpdatedAt.HasValue && persisted.Name == target.Name &&
            persisted.Instructions == target.Instructions && persisted.RecipeIngredients.Count == 1,
            "activation persists state and preserves recipe content and ingredients");
        check((await client.GetAsync($"/api/recipes/{target.Id}")).IsSuccessStatusCode,
            "reactivated recipe is visible in public detail");
        var activePage = (await client.GetFromJsonAsync<RecipePage>($"/api/recipes?categoryId={category.Id}&pageSize=100"))!;
        check(activePage.Items.Any(x => x.Id == target.Id), "reactivated recipe returns to public listing");
        check((await client.PostAsync(activateUrl, null)).StatusCode == HttpStatusCode.NoContent,
            "activation of an active recipe is idempotent");
        check((await client.PostAsync($"/api/admin/recipes/{Guid.NewGuid()}/activate", null)).StatusCode == HttpStatusCode.NotFound,
            "activation of a missing recipe returns 404");

        // Loại công thức là duy nhất theo trứng/sữa; tương thích hồ sơ được xét riêng.
        changed.ContainsEgg = true; changed.Calories = 100; changed.ProteinGram = 10; changed.CarbohydrateGram = 10; changed.FatGram = 2; changed.DefaultUnit = "g"; await db.SaveChangesAsync();
        var editUrl = $"/api/admin/recipes/{recipes[10].Id}";
        object Payload(DietaryType diet, string? image) => new { categoryId = category.Id, name = recipes[10].Name,
            servings = 1, instructions = "Cook", prepTimeMinutes = 1, cookTimeMinutes = 1, imageUrl = image,
            declaredDietaryType = diet, ingredients = new[] { new { ingredientId = changed.Id, quantity = 100, unit = "g" } } };
        check((await client.PutAsJsonAsync(editUrl, Payload(DietaryType.LactoOvoVegetarian, "https://example.com/test.jpg"))).StatusCode == HttpStatusCode.BadRequest,
            "egg-only recipe cannot declare the broader egg-and-milk type");
        check((await client.PutAsJsonAsync(editUrl, Payload(DietaryType.LactoVegetarian, "https://example.com/test.jpg"))).StatusCode == HttpStatusCode.BadRequest,
            "egg-only recipe cannot declare milk-only type");
        var image = "/api/public-images/0123456789abcdef0123456789abcdef.webp";
        check((await client.PutAsJsonAsync(editUrl, Payload(DietaryType.OvoVegetarian, image))).IsSuccessStatusCode,
            "exact egg classification accepts a stored local image URL on update");
        var detail = (await client.GetFromJsonAsync<RecipeResponse>(editUrl))!;
        check(detail.DeclaredDietaryType == DietaryType.OvoVegetarian && detail.InferredDietaryType == DietaryType.OvoVegetarian && detail.ImageUrl == image,
            "saved recipe exposes one declared classification and preserves its local image URL");
        foreach (var invalid in new[] { "/api/public-images/../secret.png", "E:\\photo.jpg", "javascript:alert(1)", "//example.com/image.jpg" })
            check((await client.PutAsJsonAsync(editUrl, Payload(DietaryType.OvoVegetarian, invalid))).StatusCode == HttpStatusCode.BadRequest,
                "recipe image validation rejects arbitrary local paths and unsafe URLs");
        changed.ContainsMilk = true; await db.SaveChangesAsync();
        check((await client.PutAsJsonAsync(editUrl, Payload(DietaryType.OvoVegetarian, image))).StatusCode == HttpStatusCode.BadRequest &&
            (await client.PutAsJsonAsync(editUrl, Payload(DietaryType.LactoOvoVegetarian, image))).IsSuccessStatusCode,
            "egg-and-milk ingredients require exactly the mixed classification");

        db.Recipes.RemoveRange(recipes);
        await db.SaveChangesAsync();
        db.Categories.Remove(category);
        db.Ingredients.RemoveRange(plant, changed);
        await db.SaveChangesAsync();
    }
}
