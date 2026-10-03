using System.Net;
using System.Net.Http.Json;
using Application.Features.Ingredients;
using Application.Features.Recipes;
using Domain.Enums;
using Infrastructure.Persistence;
using Infrastructure.Persistence.Seeding;
using Microsoft.EntityFrameworkCore;

namespace CoreDataChecks;

internal static class SeedFilterChecks
{
    public static async Task RunAsync(HttpClient client, AppDbContext db, Action<bool, string> check)
    {
        await CoreDataSeeder.SeedAsync(db);
        var counts = (await db.Categories.CountAsync(), await db.Ingredients.CountAsync(), await db.Recipes.CountAsync());
        await CoreDataSeeder.SeedAsync(db);
        check(counts == (await db.Categories.CountAsync(), await db.Ingredients.CountAsync(), await db.Recipes.CountAsync()),
            "seed rerun does not duplicate records");

        var all = (await client.GetFromJsonAsync<RecipePage>("/api/recipes?pageSize=100"))!;
        check(all.TotalCount == 6, "six public sample recipes");
        foreach (var diet in Enum.GetValues<DietaryType>())
        {
            var expected = all.Items.Where(x => x.DietaryAssessments.Any(a =>
                a.DietaryType == diet && a.Status == DietaryCompatibility.Compatible)).Select(x => x.Id).Order().ToArray();
            var filtered = (await client.GetFromJsonAsync<RecipePage>("/api/recipes?dietaryType=" + (int)diet))!;
            check(filtered.Items.Select(x => x.Id).Order().SequenceEqual(expected),
                "SQL diet filter matches domain classification: " + diet);
            var firstPage = (await client.GetFromJsonAsync<RecipePage>("/api/recipes?dietaryType=" + (int)diet + "&pageSize=1"))!;
            check(firstPage.Items.Count == 1 && firstPage.TotalCount == expected.Length,
                "diet filtering happens before pagination: " + diet);
        }

        check((await client.GetFromJsonAsync<RecipePage>("/api/recipes?maxCookTimeMinutes=15"))!.TotalCount == 4, "cook time boundary filter");
        check((await client.GetFromJsonAsync<RecipePage>("/api/recipes?maxCaloriesPerServing=250"))!.TotalCount == 3, "calorie filter excludes unknown calories");
        check((await client.GetFromJsonAsync<RecipePage>("/api/recipes?dietaryType=1&maxCookTimeMinutes=20&maxCaloriesPerServing=300"))!.TotalCount == 1, "combined filters");
        check((await client.GetAsync("/api/recipes?dietaryType=99")).StatusCode == HttpStatusCode.BadRequest, "invalid diet filter 400");
        check((await client.GetAsync("/api/recipes?maxCookTimeMinutes=-1")).StatusCode == HttpStatusCode.BadRequest, "negative time filter 400");
        check((await client.GetAsync("/api/recipes?maxCaloriesPerServing=-1")).StatusCode == HttpStatusCode.BadRequest, "negative calorie filter 400");

        var milk = await db.Ingredients.SingleAsync(x => x.Name == "[Mẫu] Sữa");
        var milkRecipes = (await client.GetFromJsonAsync<RecipePage>("/api/recipes?search=" + Uri.EscapeDataString("[Mẫu] Sữa")))!;
        check(milkRecipes.TotalCount == 3, "search recipe by ingredient name");
        var updated = await client.PutAsJsonAsync("/api/admin/ingredients/" + milk.Id, new IngredientRequest
        {
            Name = milk.Name,
            Origin = IngredientOrigin.Animal,
            ContainsMilk = true,
            ContainsOtherAnimalProducts = true,
            Aliases = "test-milk-alias",
            Source = "Admin edit"
        });
        check(updated.IsSuccessStatusCode, "Admin edits classification evidence");
        check((await client.GetFromJsonAsync<RecipePage>("/api/recipes?dietaryType=2"))!.TotalCount == 1,
            "diet filter immediately reflects ingredient edits");
        check((await client.GetFromJsonAsync<RecipePage>("/api/recipes?search=test-milk-alias"))!.TotalCount == 3,
            "search recipe by ingredient alias");
        foreach (var recipe in milkRecipes.Items)
        {
            var detail = (await client.GetFromJsonAsync<RecipeResponse>("/api/recipes/" + recipe.Id))!;
            check(detail.DietaryAssessments.All(x => x.Status == DietaryCompatibility.Incompatible),
                "recipe detail reflects ingredient edits");
        }

        db.ChangeTracker.Clear();
        await CoreDataSeeder.SeedAsync(db);
        check((await db.Ingredients.AsNoTracking().SingleAsync(x => x.Id == milk.Id)).Source == "Admin edit",
            "seed preserves Admin modifications");
        check((await client.PostAsJsonAsync("/api/admin/ingredients", new IngredientRequest
        {
            Name = "Conflicting plant",
            Origin = IngredientOrigin.Plant,
            ContainsEgg = true
        })).StatusCode == HttpStatusCode.BadRequest, "reject contradictory plant origin");

        var unknownId = all.Items.Single(x => x.DietaryAssessments.All(a => a.Status == DietaryCompatibility.Unknown)).Id;
        check((await client.GetFromJsonAsync<RecipeResponse>("/api/recipes/" + unknownId))!.DietaryAssessments.All(
            x => x.Status == DietaryCompatibility.Unknown), "unknown recipe remains explicit");
    }
}
