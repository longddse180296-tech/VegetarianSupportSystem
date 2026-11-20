using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Application.Features.Ingredients;
using Application.Features.MealPlans;
using Application.Features.Pantry;
using Application.Features.Recipes;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CoreDataChecks;

internal static class RecipeSynchronizationChecks
{
    public static async Task RunAsync(HttpClient client, AppDbContext db, Action<bool, string> check)
    {
        var now = DateTimeOffset.UtcNow;
        var today = DateOnly.FromDateTime(now.ToOffset(TimeSpan.FromHours(7)).DateTime);
        var user = User.Register("Recipe sync", "recipe-sync@example.test", "test", now);
        user.Profile!.SetDiet(VegetarianDiet.Vegan, now);
        var category = new Category { Name = "Recipe sync category" };
        var ingredient = new Ingredient { Name = "Recipe sync ingredient", DefaultUnit = "g", Calories = 100, ProteinGram = 10, CarbohydrateGram = 20, FatGram = 5 };
        var recipe = new Recipe { Name = "Recipe sync active", Category = category, Servings = 1, Instructions = "Cook",
            ImageUrl = "/api/public-images/11111111111111111111111111111111.jpg", DeclaredDietaryType = DietaryType.Vegan,
            CaloriesPerServing = 150, ProteinGramPerServing = 15, CarbohydrateGramPerServing = 30, FatGramPerServing = 7.5m,
            RecipeIngredients = [new RecipeIngredient { Ingredient = ingredient, Quantity = 150, Unit = "g" }] };
        var inactive = new Recipe { Name = "Recipe sync inactive", Category = category, Servings = 2, Instructions = "Cook", IsActive = false,
            DeclaredDietaryType = DietaryType.Vegan, CaloriesPerServing = 100, ProteinGramPerServing = 10, CarbohydrateGramPerServing = 20, FatGramPerServing = 5,
            RecipeIngredients = [new RecipeIngredient { Ingredient = ingredient, Quantity = 200, Unit = "g" }] };
        var plan = new MealPlan { UserId = user.Id, Name = "Recipe sync week", WeekStartDate = today.AddDays(-1), ProfileDiet = VegetarianDiet.Vegan };
        foreach (var (day, slot, done) in new[] { (1, MealSlot.Breakfast, false), (2, MealSlot.Breakfast, true), (2, MealSlot.Lunch, false), (3, MealSlot.Dinner, false) })
            plan.Meals.Add(new MealPlanMeal { DayNumber = day, Slot = slot, RecipeId = recipe.Id, RecipeName = recipe.Name, Servings = 1,
                ImageUrl = recipe.ImageUrl, CheckedInAt = done ? now : null, CaloriesPerServing = 150, ProteinGramPerServing = 15,
                CarbohydrateGramPerServing = 30, FatGramPerServing = 7.5m,
                Ingredients = [new MealPlanMealIngredient { IngredientId = ingredient.Id, IngredientName = ingredient.Name, Quantity = 150, Unit = "g" }] });
        db.Users.Add(user); db.Recipes.AddRange(recipe, inactive); db.MealPlans.Add(plan);
        db.PantryItems.Add(new PantryItem { UserId = user.Id, Ingredient = ingredient, IngredientId = ingredient.Id });
        db.Favorites.Add(new Favorite { UserId = user.Id, TargetType = FavoriteTargetType.Recipe, TargetId = recipe.Id });
        await db.SaveChangesAsync();
        var originalRoles = client.DefaultRequestHeaders.GetValues("Test-Role").ToArray();
        var originalUsers = client.DefaultRequestHeaders.TryGetValues("Test-UserId", out var ids) ? ids.ToArray() : [];
        void Role(string role) { client.DefaultRequestHeaders.Remove("Test-Role"); client.DefaultRequestHeaders.Add("Test-Role", role); }
        client.DefaultRequestHeaders.Remove("Test-UserId"); client.DefaultRequestHeaders.Add("Test-UserId", user.Id);
        async Task<int> Count() => (await client.GetFromJsonAsync<JsonElement>("/api/admin/recipes/review-count")).GetProperty("count").GetInt32();
        IngredientRequest Input(decimal calories, bool egg = false, string unit = "g") => new()
            { Name = ingredient.Name, DefaultUnit = unit, Calories = calories, ProteinGram = 20, CarbohydrateGram = 40, FatGram = 10, ContainsEgg = egg };
        try
        {
            Role("Admin"); var baseline = await Count();
            check((await client.PutAsJsonAsync($"/api/admin/ingredients/{ingredient.Id}", Input(200))).IsSuccessStatusCode,
                "ingredient nutrition update succeeds with dependent recipes");
            var updated = (await client.GetFromJsonAsync<RecipeResponse>($"/api/admin/recipes/{recipe.Id}"))!;
            check(updated.CaloriesPerServing == 300 && updated.ProteinGramPerServing == 30 && updated.CarbohydrateGramPerServing == 60 && updated.FatGramPerServing == 15,
                "ingredient save immediately recalculates all four recipe nutrients");
            var locked = (await client.GetFromJsonAsync<RecipeResponse>($"/api/admin/recipes/{inactive.Id}"))!;
            check(locked.CaloriesPerServing == 200 && locked.ProteinGramPerServing == 20 && !locked.IsActive,
                "inactive recipes also recalculate with their own quantities and servings");
            var publicRecipe = (await client.GetFromJsonAsync<RecipeResponse>($"/api/recipes/{recipe.Id}"))!;
            check(publicRecipe.CaloriesPerServing == 300 && publicRecipe.ProteinGramPerServing == 30,
                "public recipe immediately returns recalculated nutrition");
            Role("User");
            check((await client.GetAsync("/api/admin/recipes/review-count")).StatusCode == HttpStatusCode.Forbidden,
                "recipe warning count is admin-only");
            var suggestions = (await client.GetFromJsonAsync<PantryRecipeSuggestionResponse[]>("/api/pantry/recipe-suggestions?limit=50"))!;
            check(suggestions.Any(x => x.RecipeId == recipe.Id && x.CaloriesPerServing == 300 && x.ProteinGramPerServing == 30),
                "pantry receives recalculated recipe nutrition without editing the recipe");
            var read = (await client.GetFromJsonAsync<MealPlanResponse>($"/api/meal-plans/{plan.Id}"))!;
            check(read.Meals.Where(x => x.CheckedInAt is null && x.DayNumber >= 2).All(x => x.CaloriesPerServing == 300 && x.ProteinGramPerServing == 30) &&
                read.Meals.Where(x => x.CheckedInAt is not null || x.DayNumber == 1).All(x => x.CaloriesPerServing == 150),
                "pending plan meals refresh nutrition while eaten meals and past days preserve historical values");
            Role("Admin");
            await client.PutAsJsonAsync($"/api/admin/ingredients/{ingredient.Id}", Input(200, egg: true));
            check(await Count() == baseline + 2, "menu counts each affected active or inactive recipe exactly once");
            var flagged = (await client.GetFromJsonAsync<RecipePage>($"/api/admin/recipes?categoryId={category.Id}"))!;
            check(flagged.Items.All(x => x.RequiresReview), "table warning uses the same rule as the menu badge");
            var newImage = "/api/public-images/22222222222222222222222222222222.webp";
            var request = new RecipeRequest { CategoryId = category.Id, Name = recipe.Name, Servings = 1, Instructions = "Cook",
                PrepTimeMinutes = 1, CookTimeMinutes = 1, DeclaredDietaryType = DietaryType.OvoVegetarian, ImageUrl = newImage,
                Ingredients = [new RecipeIngredientRequest { IngredientId = ingredient.Id, Quantity = 150, Unit = "g" }] };
            check((await client.PutAsJsonAsync($"/api/admin/recipes/{recipe.Id}", request)).IsSuccessStatusCode && await Count() == baseline + 1,
                "saving the corrected recipe clears its warning count immediately");
            Role("User");
            read = (await client.GetFromJsonAsync<MealPlanResponse>($"/api/meal-plans/{plan.Id}"))!;
            check(read.Meals.All(x => x.ImageUrl == newImage), "new recipe image refreshes every meal, including past, eaten and warned meals");
            var exported = (await client.GetFromJsonAsync<MealPlanResponse>($"/api/meal-plans/{plan.Id}/export"))!;
            check(exported.Meals.All(x => x.ImageUrl == newImage), "export data also resolves the current recipe image");
            var favorites = await client.GetFromJsonAsync<JsonElement>("/api/favorites?targetType=Recipe");
            check(favorites.GetProperty("items").EnumerateArray().Any(x => x.GetProperty("targetId").GetGuid() == recipe.Id && x.GetProperty("imageUrl").GetString() == newImage),
                "saved favorites resolve current recipe images instead of storing old copies");
            Role("Admin");
            await client.PutAsJsonAsync($"/api/admin/ingredients/{ingredient.Id}", Input(200, egg: true, unit: "ml"));
            updated = (await client.GetFromJsonAsync<RecipeResponse>($"/api/admin/recipes/{recipe.Id}"))!;
            check(updated.CaloriesPerServing is null && updated.RequiresReview,
                "incompatible nutrition unit clears outdated totals and flags recipe instead of guessing a conversion");
            await client.PutAsJsonAsync($"/api/admin/ingredients/{ingredient.Id}", Input(200, egg: true));
            updated = (await client.GetFromJsonAsync<RecipeResponse>($"/api/admin/recipes/{recipe.Id}"))!;
            check(updated.CaloriesPerServing == 300 && !updated.RequiresReview,
                "restoring compatible ingredient units recalculates nutrition and clears its warning");
        }
        finally
        {
            client.DefaultRequestHeaders.Remove("Test-Role"); foreach (var role in originalRoles) client.DefaultRequestHeaders.Add("Test-Role", role);
            client.DefaultRequestHeaders.Remove("Test-UserId"); foreach (var id in originalUsers) client.DefaultRequestHeaders.Add("Test-UserId", id);
            // Cơ sở dữ liệu của runner là tạm thời; xóa theo thứ tự khóa ngoại để các kiểm tra sau không bị lẫn fixture.
            await db.Favorites.Where(x => x.UserId == user.Id).ExecuteDeleteAsync();
            await db.PantryItems.Where(x => x.UserId == user.Id).ExecuteDeleteAsync();
            await db.MealPlans.Where(x => x.Id == plan.Id).ExecuteDeleteAsync();
            await db.Recipes.Where(x => x.Id == recipe.Id || x.Id == inactive.Id).ExecuteDeleteAsync();
            await db.Ingredients.Where(x => x.Id == ingredient.Id).ExecuteDeleteAsync();
            await db.Categories.Where(x => x.Id == category.Id).ExecuteDeleteAsync();
            await db.Users.Where(x => x.Id == user.Id).ExecuteDeleteAsync();
            db.ChangeTracker.Clear();
        }
    }
}
