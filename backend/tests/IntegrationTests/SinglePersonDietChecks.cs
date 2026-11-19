using System.Net;
using System.Net.Http.Json;
using Application.Features.MealPlans;
using Application.Features.Pantry;
using Application.Features.Recipes;
using Domain.Entities;
using Domain.Enums;
using Domain.Rules;
using Infrastructure.Persistence;

namespace CoreDataChecks;

internal static class SinglePersonDietChecks
{
    public static async Task RunAsync(HttpClient client, AppDbContext db, Action<bool, string> check)
    {
        var originalRole = client.DefaultRequestHeaders.TryGetValues("Test-Role", out var roles) ? roles.ToArray() : [];
        var originalUser = client.DefaultRequestHeaders.TryGetValues("Test-UserId", out var users) ? users.ToArray() : [];
        var category = new Category { Name = "Single person diet matrix" };
        var plant = new Ingredient { Name = "Diet matrix plant", DefaultUnit = "g" };
        var egg = new Ingredient { Name = "Diet matrix egg", ContainsEgg = true, DefaultUnit = "g" };
        var milk = new Ingredient { Name = "Diet matrix milk", ContainsMilk = true, DefaultUnit = "g" };
        var recipes = Enum.GetValues<DietaryType>().Select(diet => new Recipe
        {
            Name = "Diet matrix " + diet, Category = category, Servings = 2,
            DeclaredDietaryType = diet, Instructions = "Cook", CaloriesPerServing = 100,
            RecipeIngredients = new List<RecipeIngredient> { new() { Ingredient = plant, Quantity = 200, Unit = "g" } }
        }).ToArray();
        foreach (var recipe in recipes)
        {
            if (recipe.DeclaredDietaryType is DietaryType.OvoVegetarian or DietaryType.LactoOvoVegetarian)
                recipe.RecipeIngredients.Add(new() { Ingredient = egg, Quantity = 20, Unit = "g" });
            if (recipe.DeclaredDietaryType is DietaryType.LactoVegetarian or DietaryType.LactoOvoVegetarian)
                recipe.RecipeIngredients.Add(new() { Ingredient = milk, Quantity = 20, Unit = "g" });
        }
        db.Recipes.AddRange(recipes);
        await db.SaveChangesAsync();
        client.DefaultRequestHeaders.Remove("Test-Role");
        client.DefaultRequestHeaders.Add("Test-Role", "User");
        foreach (var (profileDiet, requested) in new[] {
            (VegetarianDiet.Vegan, DietaryType.Vegan), (VegetarianDiet.Ovo, DietaryType.OvoVegetarian),
            (VegetarianDiet.Lacto, DietaryType.LactoVegetarian), (VegetarianDiet.LactoOvo, DietaryType.LactoOvoVegetarian) })
        {
            var user = User.Register("Diet matrix user", $"matrix-{profileDiet}@example.test", "test", DateTimeOffset.UtcNow);
            user.Profile!.SetDiet(profileDiet, DateTimeOffset.UtcNow);
            db.Users.Add(user);
            db.PantryItems.Add(new PantryItem { UserId = user.Id, Ingredient = plant, IngredientId = plant.Id });
            await db.SaveChangesAsync();
            client.DefaultRequestHeaders.Remove("Test-UserId");
            client.DefaultRequestHeaders.Add("Test-UserId", user.Id);
            var suggestions = (await client.GetFromJsonAsync<PantryRecipeSuggestionResponse[]>("/api/pantry/recipe-suggestions"))!;
            var expected = recipes.Where(r => DietaryRules.SupportsDiet(r.DeclaredDietaryType!.Value, requested)).Select(r => r.Id).ToHashSet();
            check(suggestions.Select(s => s.RecipeId).ToHashSet().SetEquals(expected), "pantry diet hierarchy: " + profileDiet);
            var choices = (await client.GetFromJsonAsync<RecipePage>(
                $"/api/recipes?search=Diet%20matrix&dietaryType={(int)requested}&compatibleDeclaredDietaryType={(int)requested}"))!;
            check(choices.Items.Select(r => r.Id).ToHashSet().SetEquals(expected), "meal replacement picker diet hierarchy: " + profileDiet);
            var generated = await client.PostAsJsonAsync("/api/meal-plans/generate", new MealPlanGenerateRequest {
                Name = "Single person matrix", WeekStartDate = DateOnly.FromDateTime(DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(7)).DateTime) });
            check(generated.IsSuccessStatusCode, "generate single person plan: " + profileDiet);
            var plan = (await generated.Content.ReadFromJsonAsync<MealPlanResponse>())!;
            check(plan.Meals.All(m => m.Servings == 1), "every meal serves one person: " + profileDiet);
            foreach (var recipe in recipes)
            {
                var response = await client.PutAsJsonAsync($"/api/meal-plans/{plan.Id}/meals/1/Breakfast", new MealReplacementRequest { RecipeId = recipe.Id });
                check(response.IsSuccessStatusCode == expected.Contains(recipe.Id), "meal replacement diet matrix: " + profileDiet + "/" + recipe.DeclaredDietaryType);
                if (response.IsSuccessStatusCode) plan = (await response.Content.ReadFromJsonAsync<MealPlanResponse>())!;
            }
            var fixtureMeals = plan.Meals.Count(m => recipes.Any(r => r.Id == m.RecipeId));
            check(plan.ShoppingItems.Single(i => i.IngredientId == plant.Id).RequiredQuantity == fixtureMeals * 100,
                "shopping normalizes legacy two-person recipe to one person: " + profileDiet);
            check((await client.PutAsJsonAsync($"/api/meal-plans/{plan.Id}/meals/1/Breakfast",
                new MealReplacementRequest { RecipeId = recipes[0].Id, Servings = 2 })).StatusCode == HttpStatusCode.BadRequest,
                "meal replacement rejects multiple people: " + profileDiet);
        }
        client.DefaultRequestHeaders.Remove("Test-UserId");
        client.DefaultRequestHeaders.Remove("Test-Role");
        foreach (var recipe in recipes) recipe.IsActive = false;
        await db.SaveChangesAsync();
        if (originalRole.Length > 0) client.DefaultRequestHeaders.Add("Test-Role", originalRole);
        if (originalUser.Length > 0) client.DefaultRequestHeaders.Add("Test-UserId", originalUser);
    }
}
