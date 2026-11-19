using System.Net.Http.Json;
using Application.Features.MealPlans;
using Application.Features.Profiles;
using Application.Features.Pantry;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CoreDataChecks;

internal static class NutritionTargetPlanChecks
{
    public static async Task RunAsync(HttpClient client, AppDbContext db, Action<bool, string> check)
    {
        var roles = client.DefaultRequestHeaders.TryGetValues("Test-Role", out var originalRoles) ? originalRoles.ToArray() : [];
        var users = client.DefaultRequestHeaders.TryGetValues("Test-UserId", out var originalUsers) ? originalUsers.ToArray() : [];
        var now = DateTimeOffset.UtcNow;
        var user = User.Register("Nutrition target", "nutrition-target@example.test", "test", now);
        user.Profile!.SetDiet(VegetarianDiet.Vegan, now);
        user.Profile.SetBodyData(new DateOnly(1996, 1, 1), SexForEnergyEstimate.Female, 170, 65, ActivityLevel.Sedentary, WeightGoal.Maintain, now);
        var category = new Category { Name = "Nutrition target meals" };
        var ingredient = new Ingredient { Name = "Nutrition target plant" };
        var recipes = new[] { 400, 600, 800 }.Select(calories => new Recipe {
            Name = "Nutrition target " + calories, Category = category, Servings = 1, Instructions = "Cook",
            CaloriesPerServing = calories, ProteinGramPerServing = calories * 0.2m / 4,
            CarbohydrateGramPerServing = calories * 0.5m / 4, FatGramPerServing = calories * 0.3m / 9,
            DeclaredDietaryType = DietaryType.Vegan,
            RecipeIngredients = [new RecipeIngredient { Ingredient = ingredient, Quantity = 100, Unit = "g" }]
        }).ToArray();
        db.Users.Add(user);
        db.Recipes.AddRange(recipes);
        db.PantryItems.Add(new PantryItem { UserId = user.Id, Ingredient = ingredient, IngredientId = ingredient.Id });
        await db.SaveChangesAsync();
        client.DefaultRequestHeaders.Remove("Test-Role"); client.DefaultRequestHeaders.Add("Test-Role", "User");
        client.DefaultRequestHeaders.Remove("Test-UserId"); client.DefaultRequestHeaders.Add("Test-UserId", user.Id);
        var profile = (await client.GetFromJsonAsync<ProfileDetails>("/api/profile/me"))!;
        check(profile.EstimatedTdeeKcal == 1682 && profile.DailyNutritionTarget?.Calories == 1682,
            "profile HTTP returns activity-adjusted TDEE and daily intake target");
        var pantryBefore = (await client.GetFromJsonAsync<PantryRecipeSuggestionResponse[]>("/api/pantry/recipe-suggestions"))!;
        check(pantryBefore[0].RecipeId == recipes[1].Id,
            "pantry ranks equally matched meals against the current daily nutrition target");
        var generated = await client.PostAsJsonAsync("/api/meal-plans/generate", new MealPlanGenerateRequest {
            Name = "Target plan", WeekStartDate = DateOnly.FromDateTime(now.ToOffset(TimeSpan.FromHours(7)).DateTime) });
        var plan = (await generated.Content.ReadFromJsonAsync<MealPlanResponse>())!;
        check(plan.DailyNutritionTarget?.Calories == 1682 && plan.Meals.Count == 21,
            "generated plan snapshots daily nutrition target for 21 single-person meals");
        check(plan.Meals.All(m => m.Servings == 1 && m.CaloriesPerServing is not null && m.ProteinGramPerServing is not null &&
            m.CarbohydrateGramPerServing is not null && m.FatGramPerServing is not null),
            "target planner selects recipes with complete nutrition when available");
        var preview = await client.PostAsJsonAsync("/api/profile/me/body/estimate", new {
            birthDate = "1996-01-01", sexForEnergyEstimate = SexForEnergyEstimate.Female, heightCm = 170, weightKg = 65,
            activityLevel = ActivityLevel.ModeratelyActive, weightGoal = WeightGoal.Lose });
        var estimate = (await preview.Content.ReadFromJsonAsync<ProfileEstimate>())!;
        check(estimate.EstimatedTdeeKcal == 2172 && estimate.DailyNutritionTarget?.Calories == 1955,
            "preview combines activity level and weight goal without saving");
        var bodyUpdate = await client.PutAsJsonAsync("/api/profile/me/body", new {
            birthDate = "1996-01-01", sexForEnergyEstimate = SexForEnergyEstimate.Female, heightCm = 170, weightKg = 65,
            activityLevel = ActivityLevel.ModeratelyActive, weightGoal = WeightGoal.Lose });
        check(bodyUpdate.IsSuccessStatusCode, "save updated activity and weight goal");
        var saved = (await client.GetFromJsonAsync<MealPlanResponse>($"/api/meal-plans/{plan.Id}"))!;
        check(saved.DailyNutritionTarget?.Calories == 1682, "profile edit does not silently rewrite saved plan targets");
        check(saved.NutritionNotice is null && saved.NutritionAdjustmentMessage is null,
            "viewing old plan after profile edit produces no nutrition adjustment notice");
        var copyRequest = new MealPlanCopyToWeekRequest { WeekStartDate = plan.WeekStartDate.AddDays(7) };
        var copiedResult = await client.PostAsJsonAsync($"/api/meal-plans/{plan.Id}/apply-to-week", copyRequest);
        var copied = (await copiedResult.Content.ReadFromJsonAsync<MealPlanResponse>())!;
        check(copied.DailyNutritionTarget?.Calories == 1955 && copied.NutritionAdjustmentMessage is not null,
            "new week copied from old plan adapts to updated nutrition profile and reports it once");
        var rereadCopy = (await client.GetFromJsonAsync<MealPlanResponse>($"/api/meal-plans/{copied.Id}"))!;
        check(rereadCopy.NutritionAdjustmentMessage is null && rereadCopy.NutritionNotice is null,
            "copied plan does not repeat the adjustment notice when reopened");
        var unchangedResult = await client.PostAsJsonAsync($"/api/meal-plans/{copied.Id}/apply-to-week",
            new MealPlanCopyToWeekRequest { WeekStartDate = plan.WeekStartDate.AddDays(14) });
        var unchanged = (await unchangedResult.Content.ReadFromJsonAsync<MealPlanResponse>())!;
        check(unchanged.NutritionAdjustmentMessage is null && unchanged.Meals.OrderBy(m => m.DayNumber).ThenBy(m => m.Slot).Select(m => m.RecipeId)
            .SequenceEqual(copied.Meals.OrderBy(m => m.DayNumber).ThenBy(m => m.Slot).Select(m => m.RecipeId)),
            "copying with unchanged profile preserves meals without adjustment notice");
        await client.PutAsJsonAsync("/api/profile/me/body", new {
            birthDate = "1996-01-01", sexForEnergyEstimate = SexForEnergyEstimate.Female, heightCm = 170, weightKg = 65,
            activityLevel = ActivityLevel.VeryActive, weightGoal = WeightGoal.Gain });
        var pantryAfter = (await client.GetFromJsonAsync<PantryRecipeSuggestionResponse[]>("/api/pantry/recipe-suggestions"))!;
        check(pantryAfter[0].RecipeId == recipes[2].Id,
            "pantry immediately uses new activity and weight goal without stale target caching");
        var regenerated = await client.PostAsync($"/api/meal-plans/{plan.Id}/regenerate", null);
        var updated = (await regenerated.Content.ReadFromJsonAsync<MealPlanResponse>())!;
        check(updated.DailyNutritionTarget?.Calories == 2660, "explicit regeneration applies current activity and weight goal");
        var legacy = await db.MealPlans.SingleAsync(p => p.Id == plan.Id);
        legacy.ProfileSnapshot = System.Text.Json.JsonSerializer.Serialize(new { Diet = VegetarianDiet.Vegan, Allergies = Array.Empty<string>(), AvoidedFoods = Array.Empty<string>() });
        await db.SaveChangesAsync();
        var legacyResponse = (await client.GetFromJsonAsync<MealPlanResponse>($"/api/meal-plans/{plan.Id}"))!;
        check(legacyResponse.DailyNutritionTarget is null && legacyResponse.NutritionNotice is null,
            "legacy plan remains quiet even when no saved target exists");
        client.DefaultRequestHeaders.Remove("Test-Role"); client.DefaultRequestHeaders.Remove("Test-UserId");
        if (roles.Length > 0) client.DefaultRequestHeaders.Add("Test-Role", roles);
        if (users.Length > 0) client.DefaultRequestHeaders.Add("Test-UserId", users);
        foreach (var recipe in recipes) recipe.IsActive = false;
        await db.SaveChangesAsync();
    }
}
