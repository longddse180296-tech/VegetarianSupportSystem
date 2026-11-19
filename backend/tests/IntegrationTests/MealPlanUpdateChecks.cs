using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Application.Features.MealPlans;
using Application.Features.Pantry;
using Application.Features.Profiles;
using Domain.Entities;
using Domain.Enums;
using Domain.Rules;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CoreDataChecks;

internal static class MealPlanUpdateChecks
{
    public static async Task RunAsync(HttpClient client, AppDbContext db, Action<bool, string> check)
    {
        var roles = client.DefaultRequestHeaders.TryGetValues("Test-Role", out var rs) ? rs.ToArray() : [];
        var users = client.DefaultRequestHeaders.TryGetValues("Test-UserId", out var us) ? us.ToArray() : [];
        var now = DateTimeOffset.UtcNow;
        var today = DateOnly.FromDateTime(now.ToOffset(TimeSpan.FromHours(7)).DateTime);
        var user = User.Register("Meal update", "meal-update@example.test", "test", now);
        user.Profile!.SetDiet(VegetarianDiet.Vegan, now);
        user.Profile.SetBodyData(new DateOnly(1996, 1, 1), SexForEnergyEstimate.Female, 170, 65, ActivityLevel.Sedentary, WeightGoal.Maintain, now);
        var target = ProfileNutritionEstimator.Calculate(user.Profile, today).DailyNutritionTarget!;
        var category = new Category { Name = "Meal update fixtures" };
        var ingredients = Enumerable.Range(0, 8).Select(i => new Ingredient { Name = "MealUpdateIngredient " + i,
            ContainsEgg = i is 3 or 5, ContainsMilk = i is 4 or 5 }).ToArray();
        var recipes = ingredients.Select((ingredient, i) => new Recipe { Name = "MealUpdateRecipe " + i,
            Category = category, Servings = 1, Instructions = "Cook", DeclaredDietaryType = i switch
            { 3 => DietaryType.OvoVegetarian, 4 => DietaryType.LactoVegetarian, 5 => DietaryType.LactoOvoVegetarian, _ => DietaryType.Vegan },
            CaloriesPerServing = decimal.Round(target.Calories / 3m, 3), ProteinGramPerServing = decimal.Round(target.ProteinGrams / 3, 3),
            CarbohydrateGramPerServing = decimal.Round(target.CarbohydrateGrams / 3, 3), FatGramPerServing = decimal.Round(target.FatGrams / 3, 3),
            RecipeIngredients = [new RecipeIngredient { Ingredient = ingredient, Quantity = 100, Unit = "g" }]
        }).ToArray();
        var plan = new MealPlan { UserId = user.Id, Name = "Week in progress", WeekStartDate = today.AddDays(-2), ProfileDiet = VegetarianDiet.Vegan,
            ProfileSnapshot = JsonSerializer.Serialize(new { Diet = VegetarianDiet.Vegan, Allergies = Array.Empty<string>(), AvoidedFoods = Array.Empty<string>(), DailyNutritionTarget = target }) };
        for (var day = 1; day <= 7; day++)
        foreach (var slot in Enum.GetValues<MealSlot>())
        {
            var recipe = recipes[(int)slot - 1];
            plan.Meals.Add(new MealPlanMeal { DayNumber = day, Slot = slot, RecipeId = recipe.Id, RecipeName = recipe.Name,
                CaloriesPerServing = recipe.CaloriesPerServing, ProteinGramPerServing = recipe.ProteinGramPerServing,
                CarbohydrateGramPerServing = recipe.CarbohydrateGramPerServing, FatGramPerServing = recipe.FatGramPerServing,
                Ingredients = [new MealPlanMealIngredient { IngredientId = ingredients[(int)slot - 1].Id,
                    IngredientName = ingredients[(int)slot - 1].Name, Quantity = 100, Unit = "g" }] });
        }
        foreach (var ingredient in ingredients.Take(3)) plan.ShoppingItems.Add(new MealPlanShoppingItem {
            IngredientId = ingredient.Id, IngredientName = ingredient.Name, Unit = "g", RequiredQuantity = 700, QuantityToBuy = 700 });
        db.Users.Add(user); db.Recipes.AddRange(recipes); db.MealPlans.Add(plan);
        foreach (var ingredient in ingredients) db.PantryItems.Add(new PantryItem { UserId = user.Id, Ingredient = ingredient, IngredientId = ingredient.Id });
        await db.SaveChangesAsync();
        client.DefaultRequestHeaders.Remove("Test-Role"); client.DefaultRequestHeaders.Add("Test-Role", "User");
        client.DefaultRequestHeaders.Remove("Test-UserId"); client.DefaultRequestHeaders.Add("Test-UserId", user.Id);
        var url = $"/api/meal-plans/{plan.Id}";
        async Task<MealPlanResponse> Read() => (await client.GetFromJsonAsync<MealPlanResponse>(url))!;
        try
        {
            var initial = await Read();
            check(!initial.RequiresReview, "unchanged current week needs no review");
            recipes[1].CaloriesPerServing += 1; await db.SaveChangesAsync();
            var compatible = await Read();
            check(!compatible.RequiresReview && compatible.Meals.Single(x => x.DayNumber == 3 && x.Slot == MealSlot.Lunch).CaloriesPerServing == recipes[1].CaloriesPerServing,
                "compatible admin nutrition edit refreshes pending meal values automatically");
            check(compatible.Meals.Single(x => x.DayNumber == 1 && x.Slot == MealSlot.Lunch).CaloriesPerServing == initial.Meals.Single(x => x.DayNumber == 1 && x.Slot == MealSlot.Lunch).CaloriesPerServing,
                "nutrition refresh preserves days already passed");

            // Dị ứng theo tên nguyên liệu phải hoạt động dù nguyên liệu không có nhãn Allergens.
            var namedAllergyResult = await client.PostAsJsonAsync("/api/profile/me/allergies", new { name = ingredients[1].Name.ToLowerInvariant() });
            var namedAllergy = (await namedAllergyResult.Content.ReadFromJsonAsync<ProfileItem>())!;
            check(namedAllergyResult.IsSuccessStatusCode && namedAllergy.IsKnownInCatalog == true,
                "ingredient-name allergy is recognized without an allergen tag");
            var namedWarning = await Read();
            check(namedWarning.RequiresReview && namedWarning.Meals.Single(x => x.DayNumber == 3 && x.Slot == MealSlot.Lunch).AvailabilityWarning is not null,
                "new ingredient-name allergy immediately warns on an existing current-week meal");
            user.Profile.SetDiet(null, now); await db.SaveChangesAsync();
            check((await Read()).RequiresReview, "new allergy still applies if the current profile temporarily has no diet selected");
            user.Profile.SetDiet(VegetarianDiet.Vegan, now); await db.SaveChangesAsync();
            var safeChoices = (await client.GetFromJsonAsync<MealChoicePage>(url + "/meals/3/Breakfast/choices?search=MealUpdateRecipe&pageSize=100"))!;
            check(safeChoices.Items.All(x => x.Id != recipes[1].Id), "ingredient-name allergy excludes replacement candidates before display");
            var blockedChoices = (await client.GetFromJsonAsync<MealChoicePage>(url + "/meals/3/Breakfast/choices?search=MealUpdateRecipe&pageSize=100&includeAll=true"))!;
            check(blockedChoices.Items.Single(x => x.Id == recipes[1].Id).IncompatibilityReason!.Contains("dị nguyên"),
                "show-all explains why an ingredient-name allergy blocks a recipe");
            check((await client.PutAsJsonAsync(url + "/meals/3/Dinner", new MealReplacementRequest { RecipeId = recipes[1].Id })).StatusCode == HttpStatusCode.Conflict,
                "direct replacement API also rejects ingredient-name allergy");
            await client.DeleteAsync("/api/profile/me/allergies/" + namedAllergy.Id);

            // Khai báo chưa có trong DB vẫn lưu; Admin bổ sung tên gọi khác sau đó phải được đối chiếu lại.
            var newIngredientName = "Ingredient added after allergy";
            var preCatalogResult = await client.PostAsJsonAsync("/api/profile/me/allergies", new { name = newIngredientName });
            var preCatalog = (await preCatalogResult.Content.ReadFromJsonAsync<ProfileItem>())!;
            check(preCatalog.IsKnownInCatalog == false, "allergy can precede the ingredient itself in the database");
            var addedLater = new Ingredient { Name = newIngredientName };
            var addedLink = new RecipeIngredient { Ingredient = addedLater, IngredientId = addedLater.Id, Quantity = 10, Unit = "g" };
            recipes[2].RecipeIngredients.Add(addedLink);
            await db.SaveChangesAsync();
            var afterCatalogAdd = (await client.GetFromJsonAsync<ProfileDetails>("/api/profile/me"))!;
            check(afterCatalogAdd.Allergies.Single(x => x.Id == preCatalog.Id).IsKnownInCatalog == true && (await Read()).RequiresReview,
                "adding a new ingredient to an old recipe activates a previously saved unknown allergy");
            await client.DeleteAsync("/api/profile/me/allergies/" + preCatalog.Id);
            recipes[2].RecipeIngredients.Remove(addedLink); db.Ingredients.Remove(addedLater); await db.SaveChangesAsync();

            var futureName = "Future pumpkin restriction";
            var unknownResult = await client.PostAsJsonAsync("/api/profile/me/allergies", new { name = futureName });
            var unknown = (await unknownResult.Content.ReadFromJsonAsync<ProfileItem>())!;
            check(unknownResult.IsSuccessStatusCode && unknown.IsKnownInCatalog == false,
                "unknown allergy is accepted and preserved before catalog recognition");
            ingredients[2].Aliases = futureName; await db.SaveChangesAsync();
            var recognizedProfile = (await client.GetFromJsonAsync<ProfileDetails>("/api/profile/me"))!;
            check(recognizedProfile.Allergies.Single(x => x.Id == unknown.Id).IsKnownInCatalog == true,
                "previously unknown allergy is recognized after admin updates ingredient aliases");
            var lateWarning = await Read();
            check(lateWarning.RequiresReview && lateWarning.Meals.Single(x => x.DayNumber == 3 && x.Slot == MealSlot.Dinner).AvailabilityWarning is not null,
                "late catalog alias update flags a saved meal without re-entering allergy");
            var latePantry = (await client.GetFromJsonAsync<PantryRecipeSuggestionResponse[]>("/api/pantry/recipe-suggestions?limit=50"))!;
            check(latePantry.All(x => x.RecipeId != recipes[2].Id), "pantry also applies newly recognized allergy");
            await client.DeleteAsync("/api/profile/me/allergies/" + unknown.Id);
            ingredients[2].Aliases = null; await db.SaveChangesAsync();

            var avoidedName = "Future avoided food";
            var avoidedResult = await client.PostAsJsonAsync("/api/profile/me/avoided-foods", new { name = avoidedName });
            var unknownAvoided = (await avoidedResult.Content.ReadFromJsonAsync<ProfileItem>())!;
            check(avoidedResult.IsSuccessStatusCode && unknownAvoided.IsKnownInCatalog == false,
                "unknown avoided food remains a valid profile declaration");
            ingredients[2].Aliases = avoidedName; await db.SaveChangesAsync();
            check((await Read()).RequiresReview, "admin catalog change activates a previously unknown avoided-food restriction");
            var avoidedChoices = (await client.GetFromJsonAsync<MealChoicePage>(url + "/meals/3/Breakfast/choices?search=MealUpdateRecipe&pageSize=100"))!;
            check(avoidedChoices.Items.All(x => x.Id != recipes[2].Id), "avoided-food aliases filter replacement choices");
            await client.DeleteAsync("/api/profile/me/avoided-foods/" + unknownAvoided.Id);
            ingredients[2].Aliases = null;

            var futureGroupResult = await client.PostAsJsonAsync("/api/profile/me/allergies", new { name = "Future allergen group" });
            var futureGroup = (await futureGroupResult.Content.ReadFromJsonAsync<ProfileItem>())!;
            ingredients[1].Allergens = "Future allergen group"; await db.SaveChangesAsync();
            check((await Read()).RequiresReview, "admin allergen-tag update activates an existing profile allergy");
            await client.DeleteAsync("/api/profile/me/allergies/" + futureGroup.Id);
            ingredients[1].Allergens = null;

            ingredients[1].ContainsEgg = true; recipes[1].DeclaredDietaryType = DietaryType.OvoVegetarian; await db.SaveChangesAsync();
            check((await Read()).RequiresReview, "admin recipe diet change flags current Vegan plan");
            ingredients[1].ContainsEgg = false; recipes[1].DeclaredDietaryType = DietaryType.Vegan;
            recipes[1].IsActive = false; await db.SaveChangesAsync();
            check((await Read()).RequiresReview, "admin recipe deactivation flags current plan");
            check((await client.GetAsync(url + "/recipes/" + recipes[1].Id)).IsSuccessStatusCode &&
                (await client.GetAsync("/api/recipes/" + recipes[1].Id)).StatusCode == HttpStatusCode.NotFound,
                "plan owner can view a warned inactive recipe while public detail remains hidden");
            check((await client.GetAsync(url + "/recipes/" + recipes[7].Id)).StatusCode == HttpStatusCode.NotFound,
                "saved-plan detail cannot expose an unrelated inactive or active recipe");
            recipes[1].IsActive = true; await db.SaveChangesAsync();
            check(!(await Read()).RequiresReview, "removing restrictions and restoring recipe clears review warnings");

            var remainingWeek = (await client.GetFromJsonAsync<MealPlanResponse>(url + "/export"))!;
            check(remainingWeek.Meals.Count == 15 && remainingWeek.Meals.All(x => x.DayNumber >= 3), "week export excludes every past calendar day");
            check((await client.GetAsync(url + "/export?day=1")).StatusCode == HttpStatusCode.BadRequest &&
                (await client.GetFromJsonAsync<ShoppingItemResponse[]>(url + "/shopping-list?day=1"))!.Length == 0,
                "past day cannot export meals or shopping ingredients");
            var checkUrl = url + "/meals/3/Breakfast/check-in";
            check((await client.PostAsync(checkUrl, null)).IsSuccessStatusCode, "today's meal can be checked in");
            check((await client.PostAsync(checkUrl, null)).IsSuccessStatusCode && await db.MealCheckIns.CountAsync(x => x.UserId == user.Id) == 1,
                "check-in is persisted with one log even after duplicate requests");
            var logged = await db.MealCheckIns.AsNoTracking().SingleAsync(x => x.UserId == user.Id);
            check(logged.EatenOn == today && logged.CheckedInAt != default && logged.RecipeId == recipes[0].Id,
                "check-in records recipe, local calendar date and timestamp");
            var remainingToday = (await client.GetFromJsonAsync<MealPlanResponse>(url + "/export?day=3"))!;
            check(remainingToday.Meals.Count == 2 && remainingToday.Meals.All(x => x.CheckedInAt is null) && remainingToday.ShoppingItems.All(x => x.IngredientId != ingredients[0].Id),
                "day export removes completed meal and its ingredient requirements");
            check((await client.GetAsync(url + "/pdf?day=3")).IsSuccessStatusCode, "day PDF endpoint accepts filtered pending meals");
            var canceled = await client.DeleteAsync(checkUrl);
            var canceledPlan = (await canceled.Content.ReadFromJsonAsync<MealPlanResponse>())!;
            check(canceled.IsSuccessStatusCode && canceledPlan.Meals.Single(x => x.DayNumber == 3 && x.Slot == MealSlot.Breakfast).CheckedInAt is null &&
                !await db.MealCheckIns.AnyAsync(x => x.UserId == user.Id),
                "undo clears completed state and the corresponding actual consumption history");
            check((await client.GetFromJsonAsync<MealPlanResponse>(url + "/export?day=3"))!.Meals.Count == 3,
                "undo restores the meal to day PDF export");
            check((await client.DeleteAsync(checkUrl)).IsSuccessStatusCode, "undoing an already canceled check-in is idempotent");
            var afterUndo = (await client.GetFromJsonAsync<MealChoicePage>(url + "/meals/3/Lunch/choices?includeAll=true&search=MealUpdateRecipe&pageSize=100"))!;
            check(afterUndo.Items.Single(x => x.Id == recipes[0].Id).LastEatenOn is null,
                "canceled check-in no longer affects recent-meal suggestions");
            check((await client.PostAsync(checkUrl, null)).IsSuccessStatusCode && await db.MealCheckIns.CountAsync(x => x.UserId == user.Id) == 1,
                "meal can be checked in again after accidental check-in is canceled");
            client.DefaultRequestHeaders.Remove("Test-UserId"); client.DefaultRequestHeaders.Add("Test-UserId", "another-meal-user");
            check((await client.GetAsync(url + "/recipes/" + recipes[0].Id)).StatusCode == HttpStatusCode.NotFound, "saved recipe detail rejects another account");
            check((await client.PostAsync(checkUrl, null)).StatusCode == HttpStatusCode.NotFound &&
                (await client.DeleteAsync(checkUrl)).StatusCode == HttpStatusCode.NotFound &&
                (await client.PostAsync(url + "/review", null)).StatusCode == HttpStatusCode.NotFound &&
                (await client.GetAsync(url + "/meals/3/Lunch/choices")).StatusCode == HttpStatusCode.NotFound,
                "check-in, review and choices cannot access another user's plan");
            client.DefaultRequestHeaders.Remove("Test-UserId"); client.DefaultRequestHeaders.Add("Test-UserId", user.Id);
            check((await client.PostAsync(url + "/meals/4/Breakfast/check-in", null)).StatusCode == HttpStatusCode.Conflict,
                "future meals cannot be checked in");
            check((await client.PutAsJsonAsync(url + "/meals/3/Breakfast", new MealReplacementRequest { RecipeId = recipes[2].Id })).StatusCode == HttpStatusCode.Conflict,
                "checked-in meal cannot be replaced");

            recipes[0].CaloriesPerServing += 2000; await db.SaveChangesAsync();
            var changed = await Read();
            check(changed.RequiresReview && changed.Meals.Any(x => x.DayNumber >= 4 && x.AvailabilityWarning is not null),
                "admin nutrition edit outside daily target asks for confirmation");
            var eatenBefore = changed.Meals.Single(x => x.DayNumber == 3 && x.Slot == MealSlot.Breakfast);
            check(eatenBefore.CheckedInAt is not null && eatenBefore.CaloriesPerServing == initial.Meals.First().CaloriesPerServing,
                "admin changes never overwrite eaten nutrition snapshots");
            var review = await client.PostAsync(url + "/review", null);
            check(review.IsSuccessStatusCode, "confirmed review automatically replaces unsuitable pending meals");
            var revised = (await review.Content.ReadFromJsonAsync<MealPlanResponse>())!;
            check(!revised.RequiresReview && revised.Meals.Single(x => x.Id == eatenBefore.Id).CheckedInAt == eatenBefore.CheckedInAt,
                "review preserves checked-in meal identity and timestamp");
            check(revised.Meals.Where(x => x.DayNumber <= 2).Select(x => x.RecipeId).SequenceEqual(initial.Meals.Where(x => x.DayNumber <= 2).Select(x => x.RecipeId)),
                "review does not rewrite historical days");

            // Hồ sơ mới mở rộng loại ăn được: không được giữ ràng buộc Vegan cũ khi chọn món.
            user.Profile.SetDiet(VegetarianDiet.Ovo, now); await db.SaveChangesAsync();
            var choicesUrl = url + "/meals/3/Lunch/choices?search=MealUpdateRecipe&pageSize=100";
            var choices = (await client.GetFromJsonAsync<MealChoicePage>(choicesUrl))!;
            check(choices.Items.Any(x => x.Id == recipes[3].Id) && choices.Items.Any(x => x.Id == recipes[6].Id) &&
                choices.Items.All(x => x.Id != recipes[4].Id && x.Id != recipes[5].Id),
                "latest Ovo profile allows Vegan and Ovo choices, excluding milk and mixed recipes");
            var all = (await client.GetFromJsonAsync<MealChoicePage>(choicesUrl + "&includeAll=true"))!;
            check(all.Items.Any(x => x.Id == recipes[4].Id && !x.IsCompatible && x.IncompatibilityReason is not null),
                "show-all includes blocked recipes with an explicit reason");
            check(all.Items.Any(x => x.Id == recipes[0].Id && x.LastEatenOn == today && x.NutritionWarning is not null),
                "choices expose recent check-in and projected daily nutrition warning");
            check((await client.PutAsJsonAsync(url + "/meals/3/Lunch", new MealReplacementRequest { RecipeId = recipes[3].Id })).IsSuccessStatusCode,
                "replacement uses current Ovo profile rather than the old Vegan snapshot");

            ingredients[1].Allergens = "FixtureSoy";
            user.Profile.Allergies.Add(UserAllergy.Create(user.Id, "FixtureSoy", now));
            user.Profile.AvoidedFoods.Add(UserAvoidedFood.Create(user.Id, ingredients[7].Name, now));
            await db.SaveChangesAsync();
            choices = (await client.GetFromJsonAsync<MealChoicePage>(choicesUrl))!;
            check(choices.Items.All(x => x.Id != recipes[1].Id && x.Id != recipes[7].Id),
                "replacement list filters current allergies and avoided foods before display");
            var pantry = (await client.GetFromJsonAsync<PantryRecipeSuggestionResponse[]>("/api/pantry/recipe-suggestions?limit=50"))!;
            check(pantry.All(x => x.IsCompatible && x.RecipeId != recipes[1].Id && x.RecipeId != recipes[7].Id),
                "pantry uses the same latest allergy and avoidance restrictions");
            var pantryAll = (await client.GetFromJsonAsync<PantryRecipeSuggestionResponse[]>("/api/pantry/recipe-suggestions?limit=50&includeAll=true"))!;
            check(pantryAll.Any(x => x.RecipeId == recipes[1].Id && !x.IsCompatible) &&
                pantryAll.Any(x => x.RecipeId == recipes[0].Id && x.LastEatenOn == today && x.CaloriesPerServing == recipes[0].CaloriesPerServing),
                "pantry show-all exposes blocked status, fresh nutrition and actual recent meal history");

            user.Profile.SetBodyData(new DateOnly(1996, 1, 1), SexForEnergyEstimate.Female, 170, 90, ActivityLevel.VeryActive, WeightGoal.Gain, now);
            await db.SaveChangesAsync();
            var profileChanged = await Read();
            check(profileChanged.RequiresReview && profileChanged.CurrentDailyNutritionTarget!.Calories > target.Calories,
                "midweek body and goal change requests review when pending days no longer fit");
            var copy = new MealPlanCopyToWeekRequest { WeekStartDate = today.AddDays(7), Name = "Renamed new week" };
            check((await client.PostAsJsonAsync(url + "/apply-to-week", copy)).StatusCode == HttpStatusCode.Conflict,
                "copying a changed plan requires explicit acceptance");
            var copied = await client.PostAsJsonAsync(url + "/apply-to-week", new MealPlanCopyToWeekRequest
                { WeekStartDate = copy.WeekStartDate, Name = copy.Name, AcceptRecipeChanges = true });
            check(copied.IsSuccessStatusCode, "confirmed copy creates a renamed week at the selected start date");
            var newWeek = (await copied.Content.ReadFromJsonAsync<MealPlanResponse>())!;
            check(newWeek.Name == copy.Name && newWeek.WeekStartDate == copy.WeekStartDate && newWeek.Meals.All(x => x.CheckedInAt is null),
                "new week does not inherit check-ins from the source week");
            check(newWeek.Meals.All(x => x.RecipeId != logged.RecipeId), "generator avoids recipes checked in within the last three weeks when alternatives exist");
            check((await client.DeleteAsync(url)).IsSuccessStatusCode && await db.MealCheckIns.AnyAsync(x => x.UserId == user.Id),
                "actual consumption history survives deletion of a meal plan");
        }
        finally
        {
            client.DefaultRequestHeaders.Remove("Test-Role"); client.DefaultRequestHeaders.Remove("Test-UserId");
            if (roles.Length > 0) client.DefaultRequestHeaders.Add("Test-Role", roles);
            if (users.Length > 0) client.DefaultRequestHeaders.Add("Test-UserId", users);
            await db.MealCheckIns.Where(x => x.UserId == user.Id).ExecuteDeleteAsync();
            foreach (var recipe in recipes) recipe.IsActive = false;
            await db.SaveChangesAsync();
        }
    }
}
