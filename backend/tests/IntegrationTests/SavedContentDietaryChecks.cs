using System.Net.Http.Json;
using Application.Features.Favorites;
using Application.Features.MealPlans;
using Application.Features.Recipes;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CoreDataChecks;

internal static class SavedContentDietaryChecks
{
    public static async Task RunAsync(HttpClient client, AppDbContext db, Action<bool, string> check)
    {
        var now = DateTimeOffset.UtcNow;
        var user = User.Register("Diet warning user", "diet-warning@example.test", "test-only", now);
        user.Profile!.SetDiet(VegetarianDiet.Vegan, now);
        var category = new Category { Name = "Diet warning category" };
        var ingredient = new Ingredient { Name = "Diet warning ingredient",
            DefaultUnit = "g", Calories = 100, ProteinGram = 5, CarbohydrateGram = 10, FatGram = 3 };
        var recipe = new Recipe
        {
            Name = "Diet warning recipe", Category = category, Servings = 1, Instructions = "Fixture",
            DeclaredDietaryType = DietaryType.Vegan,
            RecipeIngredients = [new RecipeIngredient { Ingredient = ingredient, Quantity = 100, Unit = "g" }]
        };
        var replacementIngredient = new Ingredient { Name = "Diet warning replacement plant" };
        var replacementRecipe = new Recipe
        {
            Name = "Diet warning replacement recipe", Category = category, Servings = 1, Instructions = "Fixture",
            DeclaredDietaryType = DietaryType.Vegan,
            RecipeIngredients = [new RecipeIngredient { Ingredient = replacementIngredient, Quantity = 100, Unit = "g" }]
        };
        var restaurant = new Restaurant { Name = "Diet warning restaurant", Address = "Test",
            DietaryTypes = [new RestaurantDietaryType { DietaryType = DietaryType.OvoVegetarian }] };
        var article = new Article(user.Id, "Diet warning article", "Published article", ["Test"], null,
            [DietaryType.OvoVegetarian], now);
        var articleSubmission = ModerationSubmission.Submit(Guid.NewGuid(), 1,
            ModeratedContentType.Article, user.Id, article.DraftTitle, article.DraftContent, null, now);
        articleSubmission.RecordAiResult(AiFlagStatus.Passed, "Test", "Text", null, now);
        articleSubmission.Decide(ModerationDecisionType.Approve, "test-admin", "Test", now);
        article.LinkSubmission(articleSubmission, now);
        article.SetDraft("Diet warning article draft", "Draft", ["Test"], null, [DietaryType.Vegan], now);
        var video = Video.Create(user.Id, "Diet warning video", "[Chế độ: Chay có trứng (Ovo)] Published", null);
        video.SetMedia("diet-warning.mp4");
        var videoSubmission = ModerationSubmission.Submit(video.Id, 1, ModeratedContentType.Video, user.Id,
            video.Title, video.Description, video.MediaKey, now);
        videoSubmission.Decide(ModerationDecisionType.Approve, "test-admin", "Test", now);
        video.Publish(videoSubmission.Id);
        video.Edit("Diet warning video draft", "[Chế độ: Thuần chay (Vegan)] Draft", null);
        var plan = new MealPlan
        {
            UserId = user.Id, Name = "Diet warning plan", WeekStartDate = new DateOnly(2026, 12, 1),
            ProfileDiet = VegetarianDiet.Vegan
        };
        // Serialize the enum value used by this build, matching the real plan service.
        plan.ProfileSnapshot = System.Text.Json.JsonSerializer.Serialize(new
        {
            Diet = VegetarianDiet.Vegan, Allergies = Array.Empty<string>(), AvoidedFoods = Array.Empty<string>()
        });
        foreach (var day in Enumerable.Range(1, 7))
            foreach (var slot in Enum.GetValues<MealSlot>())
                plan.Meals.Add(new MealPlanMeal
                {
                    DayNumber = day, Slot = slot, RecipeId = recipe.Id, RecipeName = recipe.Name, Servings = 1,
                    Ingredients = [new MealPlanMealIngredient
                        { IngredientId = ingredient.Id, IngredientName = ingredient.Name, Quantity = 100, Unit = "g" }]
                });
        db.Users.Add(user);
        db.Recipes.AddRange(recipe, replacementRecipe);
        db.Restaurants.Add(restaurant);
        db.Articles.Add(article);
        db.Videos.Add(video);
        db.ModerationSubmissions.Add(videoSubmission);
        db.MealPlans.Add(plan);
        await db.SaveChangesAsync();

        client.DefaultRequestHeaders.Remove("Test-Role");
        client.DefaultRequestHeaders.Remove("Test-UserId");
        client.DefaultRequestHeaders.Add("Test-Role", "User");
        client.DefaultRequestHeaders.Add("Test-UserId", user.Id);
        try
        {
            foreach (var (type, id) in new[]
            {
                (FavoriteTargetType.Recipe, recipe.Id), (FavoriteTargetType.Restaurant, restaurant.Id),
                (FavoriteTargetType.Article, article.Id), (FavoriteTargetType.Video, video.Id)
            })
                check((await client.PostAsJsonAsync("/api/favorites", new FavoriteRequest
                    { TargetType = type, TargetId = id })).IsSuccessStatusCode, "saving content is allowed despite dietary mismatch: " + type);

            var saved = (await client.GetFromJsonAsync<FavoritePage>("/api/favorites"))!;
            check(saved.Items.Single(item => item.TargetType == FavoriteTargetType.Recipe).DietaryWarning is null &&
                saved.Items.Where(item => item.TargetType != FavoriteTargetType.Recipe).All(item => item.DietaryWarning is not null),
                "Profile warnings use published article/video diets and restaurant service diets");
            var before = (await client.GetFromJsonAsync<MealPlanResponse>($"/api/meal-plans/{plan.Id}"))!;
            check(before.Meals.Count == 21 && before.Meals.All(meal => meal.AvailabilityWarning is null),
                "compatible saved meals are available for recipe detail");
            ingredient.ContainsEgg = true;
            await db.SaveChangesAsync();
            var pending = (await client.GetFromJsonAsync<MealPlanResponse>($"/api/meal-plans/{plan.Id}"))!;
            saved = (await client.GetFromJsonAsync<FavoritePage>("/api/favorites"))!;
            check(pending.Meals.All(meal => meal.AvailabilityWarning is null) &&
                saved.Items.Single(item => item.TargetType == FavoriteTargetType.Recipe).DietaryWarning is null,
                "ingredient-only changes wait for Admin confirmation before notifying saved-content users");
            var publicRecipe = (await client.GetFromJsonAsync<RecipeResponse>($"/api/recipes/{recipe.Id}"))!;
            check(publicRecipe.DeclaredDietaryType == DietaryType.Vegan,
                "public recipe retains the Admin-saved type while ingredient review is pending");
            client.DefaultRequestHeaders.Remove("Test-Role");
            client.DefaultRequestHeaders.Add("Test-Role", "Admin");
            var confirmation = await client.PutAsJsonAsync($"/api/admin/recipes/{recipe.Id}", new RecipeRequest
            {
                CategoryId = category.Id, Name = recipe.Name, Servings = 1, Instructions = "Confirmed recipe",
                PrepTimeMinutes = 0, CookTimeMinutes = 1, ImageUrl = "https://example.test/recipe.jpg",
                DeclaredDietaryType = DietaryType.OvoVegetarian,
                Ingredients = [new RecipeIngredientRequest { IngredientId = ingredient.Id, Quantity = 100, Unit = "g" }]
            });
            check(confirmation.IsSuccessStatusCode, "Admin confirms the new recipe diet through the normal update endpoint");
            client.DefaultRequestHeaders.Remove("Test-Role");
            client.DefaultRequestHeaders.Add("Test-Role", "User");
            var changed = (await client.GetFromJsonAsync<MealPlanResponse>($"/api/meal-plans/{plan.Id}"))!;
            check(changed.Meals.Count == 21 && changed.Meals.All(meal => meal.AvailabilityWarning is not null),
                "Admin-confirmed dietary changes warn on every affected day of an existing plan");
            var plansBefore = await db.MealPlans.CountAsync(p => p.UserId == user.Id);
            var unconfirmedCopy = await client.PostAsJsonAsync($"/api/meal-plans/{plan.Id}/apply-to-week",
                new MealPlanCopyToWeekRequest { WeekStartDate = plan.WeekStartDate.AddDays(7), Name = "Tuần mới chưa xác nhận" });
            check(unconfirmedCopy.StatusCode == System.Net.HttpStatusCode.Conflict &&
                await db.MealPlans.CountAsync(p => p.UserId == user.Id) == plansBefore,
                "copying warned meals requires confirmation before creating a new plan");
            var confirmedCopy = await client.PostAsJsonAsync($"/api/meal-plans/{plan.Id}/apply-to-week",
                new MealPlanCopyToWeekRequest { WeekStartDate = plan.WeekStartDate.AddDays(7), Name = "Thực đơn tuần mới của tôi", AcceptRecipeChanges = true });
            var copied = (await confirmedCopy.Content.ReadFromJsonAsync<MealPlanResponse>())!;
            check(confirmedCopy.IsSuccessStatusCode && copied.Name == "Thực đơn tuần mới của tôi" &&
                copied.Meals.All(m => m.RecipeId != recipe.Id && m.AvailabilityWarning is null),
                "confirmed copy accepts custom name and replaces incompatible recipes for the new week");
            check(!(await client.GetFromJsonAsync<RecipePage>($"/api/recipes?categoryId={category.Id}&dietaryType=Vegan"))!
                .Items.Any(item => item.Id == recipe.Id),
                "confirmed non-vegan recipes leave the public Vegan filter");
            saved = (await client.GetFromJsonAsync<FavoritePage>("/api/favorites"))!;
            check(saved.TotalCount == 4 && saved.Items.All(item => item.DietaryWarning is not null),
                "mismatched items stay saved and receive Profile warnings");
            check(!(await client.PutAsJsonAsync($"/api/meal-plans/{plan.Id}/meals/1/Breakfast",
                new MealReplacementRequest { RecipeId = recipe.Id })).IsSuccessStatusCode,
                "replacing a warned meal with another incompatible recipe is rejected");
            var replace = await client.PutAsJsonAsync($"/api/meal-plans/{plan.Id}/meals/1/Breakfast",
                new MealReplacementRequest { RecipeId = replacementRecipe.Id });
            check(replace.IsSuccessStatusCode, "warned meals can be replaced with a compatible recipe");
            var replaced = (await replace.Content.ReadFromJsonAsync<MealPlanResponse>())!;
            check(replaced.Meals.Single(meal => meal.DayNumber == 1 && meal.Slot == MealSlot.Breakfast).AvailabilityWarning is null &&
                replaced.Meals.Count(meal => meal.AvailabilityWarning is not null) == 20,
                "replacement clears the warning only for the changed meal");

            user.Profile.SetDiet(VegetarianDiet.Ovo, now);
            await db.SaveChangesAsync();
            saved = (await client.GetFromJsonAsync<FavoritePage>("/api/favorites"))!;
            check(saved.Items.All(item => item.DietaryWarning is null),
                "Profile warnings are recalculated when the user's diet changes");
            var savedRecipe = saved.Items.Single(item => item.TargetType == FavoriteTargetType.Recipe);
            check((await client.DeleteAsync($"/api/favorites/{savedRecipe.Id}")).IsSuccessStatusCode,
                "saved items can still be removed normally");
        }
        finally
        {
            client.DefaultRequestHeaders.Remove("Test-UserId");
            client.DefaultRequestHeaders.Remove("Test-Role");
            client.DefaultRequestHeaders.Add("Test-Role", "Admin");
            // API đổi món đã thay các dòng con, dọn theo ID hiện có trong database.
            db.ChangeTracker.Clear();
            await db.Favorites.Where(item => item.UserId == user.Id).ExecuteDeleteAsync();
            await db.MealPlans.Where(item => item.UserId == user.Id).ExecuteDeleteAsync();
            await db.Recipes.Where(item => item.Id == recipe.Id || item.Id == replacementRecipe.Id).ExecuteDeleteAsync();
            await db.Restaurants.Where(item => item.Id == restaurant.Id).ExecuteDeleteAsync();
            await db.Categories.Where(item => item.Id == category.Id).ExecuteDeleteAsync();
            await db.Ingredients.Where(item => item.Id == ingredient.Id || item.Id == replacementIngredient.Id).ExecuteDeleteAsync();
            await db.ArticleVersions.Where(item => item.ArticleId == article.Id).ExecuteDeleteAsync();
            await db.Articles.Where(item => item.Id == article.Id).ExecuteDeleteAsync();
            await db.Videos.Where(item => item.Id == video.Id).ExecuteDeleteAsync();
            await db.ModerationDecisions.Where(item => item.SubmissionId == articleSubmission.Id || item.SubmissionId == videoSubmission.Id)
                .ExecuteDeleteAsync();
            await db.ModerationSubmissions.Where(item => item.Id == articleSubmission.Id || item.Id == videoSubmission.Id)
                .ExecuteDeleteAsync();
            await db.Users.Where(item => item.Id == user.Id).ExecuteDeleteAsync();
        }
    }
}
