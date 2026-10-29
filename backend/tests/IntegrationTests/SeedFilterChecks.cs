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

        // Deliberately declare a plant-only recipe as Lacto-ovo: declared type and
        // ingredient-based compatibility must remain independent filters.
        var declared = await db.Recipes.SingleAsync(x => x.Name == "[Mẫu] Cơm đậu hũ");
        declared.DeclaredDietaryType = DietaryType.LactoOvoVegetarian;
        await db.SaveChangesAsync();
        var exact = (await client.GetFromJsonAsync<RecipePage>("/api/recipes?declaredDietaryType=LactoOvoVegetarian&pageSize=1"))!;
        check(exact.TotalCount == 1 && exact.Items.Single().Id == declared.Id,
            "declared diet filter is exact and applied before pagination");
        check((await client.GetFromJsonAsync<RecipePage>("/api/recipes?declaredDietaryType=4&dietaryType=1"))!.TotalCount == 1,
            "declared and compatible diet filters combine with AND");
        check((await client.GetAsync("/api/recipes?declaredDietaryType=99")).StatusCode == HttpStatusCode.BadRequest,
            "invalid declared diet filter returns 400");

        var all = (await client.GetFromJsonAsync<RecipePage>("/api/recipes?pageSize=100"))!;
        check(all.TotalCount == 6, "six public sample recipes");
        foreach (var direction in new[] { "asc", "desc" })
        {
            var known = all.Items.Where(x => x.CaloriesPerServing.HasValue);
            var expected = (direction == "asc"
                ? known.OrderBy(x => x.CaloriesPerServing)
                : known.OrderByDescending(x => x.CaloriesPerServing))
                .Select(x => x.Id).Concat(all.Items.Where(x => !x.CaloriesPerServing.HasValue).Select(x => x.Id)).ToArray();
            var sorted = (await client.GetFromJsonAsync<RecipePage>("/api/recipes?calorieSort=" + direction + "&pageSize=100"))!;
            check(sorted.Items.Select(x => x.Id).SequenceEqual(expected),
                "calorie sort keeps unknown values last: " + direction);
            var secondPage = (await client.GetFromJsonAsync<RecipePage>("/api/recipes?calorieSort=" + direction + "&pageSize=1&pageNumber=2"))!;
            check(secondPage.TotalCount == all.TotalCount && secondPage.Items.Single().Id == expected[1],
                "calorie sort applies across pages: " + direction);
            var filtered = (await client.GetFromJsonAsync<RecipePage>("/api/recipes?calorieSort=" + direction + "&dietaryType=3&pageSize=100"))!;
            var compatible = all.Items.Where(x => x.DietaryAssessments.Any(a => a.DietaryType == DietaryType.OvoVegetarian && a.Status == DietaryCompatibility.Compatible)).Select(x => x.Id).ToHashSet();
            check(filtered.Items.Select(x => x.Id).SequenceEqual(expected.Where(compatible.Contains)),
                "calorie sort respects active filters: " + direction);
        }
        check((await client.GetAsync("/api/recipes?calorieSort=invalid")).StatusCode == HttpStatusCode.BadRequest,
            "invalid calorie sort returns 400");
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

        var ovo = (await client.GetFromJsonAsync<RecipePage>("/api/recipes?dietaryType=3&pageSize=100"))!;
        check(ovo.Items.Any(x => x.Name == "[Mẫu] Cơm trứng") &&
            !ovo.Items.Any(x => x.Name == "[Mẫu] Trứng sữa hấp" || x.Name == "[Mẫu] Cháo sữa"),
            "Ovo allows egg-only recipes and excludes every milk recipe");
        var lacto = (await client.GetFromJsonAsync<RecipePage>("/api/recipes?dietaryType=2&pageSize=100"))!;
        check(lacto.Items.Any(x => x.Name == "[Mẫu] Cháo sữa") &&
            !lacto.Items.Any(x => x.Name == "[Mẫu] Cơm trứng" || x.Name == "[Mẫu] Trứng sữa hấp"),
            "Lacto allows milk-only recipes and excludes every egg recipe");

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
            DefaultUnit = "g", Calories = 60, ProteinGram = 3, CarbohydrateGram = 5, FatGram = 3,
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
