using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using Application;
using Application.Features.Categories;
using Application.Features.Ingredients;
using Application.Features.Favorites;
using Application.Features.Pantry;
using Application.Features.MealPlans;
using Application.Features.Recipes;
using Application.Features.Restaurants;
using Api.Controllers;
using Domain.Enums;
using Infrastructure;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

using Application.Common.Exceptions;
using Infrastructure.Persistence.Repositories;

namespace CoreDataChecks;

internal static class CoreDataApiChecks
{
    public static async Task RunAsync(HttpClient client, AppDbContext db, Action<bool, string> Check)
    {
        var ct = CancellationToken.None;
        var testUser = Domain.Entities.User.Register("Meal Plan Test User", "meal-plan@example.test", "test-hash", DateTimeOffset.UtcNow);
        testUser.Profile!.SetDiet(VegetarianDiet.Vegan, DateTimeOffset.UtcNow);
        db.Users.Add(testUser);
        await db.SaveChangesAsync(ct);
        var openapi = await client.GetStringAsync("/openapi/v1.json");
        Check(openapi.Contains("/api/admin/recipes/{id}") && openapi.Contains("RecipeRequest"), "OpenAPI endpoints and DTO schema");
        Check((await client.GetAsync("/api/pantry/items")).StatusCode == HttpStatusCode.Unauthorized, "pantry Guest 401");
        Check((await client.GetAsync("/api/meal-plans")).StatusCode == HttpStatusCode.Unauthorized, "meal plans Guest 401");
        client.DefaultRequestHeaders.Add("Test-Role", "User");
        Check((await client.GetAsync("/api/pantry/items")).IsSuccessStatusCode, "User can view own empty pantry");
        client.DefaultRequestHeaders.Remove("Test-Role");
        foreach (var resource in new[] { "categories", "ingredients", "recipes", "restaurants" })
        {
            Check((await client.GetAsync("/api/admin/" + resource)).StatusCode == HttpStatusCode.Unauthorized, resource + " Guest 401");
            client.DefaultRequestHeaders.Add("Test-Role", "User");
            Check((await client.GetAsync("/api/admin/" + resource)).StatusCode == HttpStatusCode.Forbidden, resource + " User 403");
            client.DefaultRequestHeaders.Remove("Test-Role");
        }
        client.DefaultRequestHeaders.Add("Test-Role", "Admin");
        var legacyModeration = await client.PostAsJsonAsync("/api/moderation/submissions", new {
            contentType = ModeratedContentType.Article, title = "Legacy route test", textContent = "Test only"
        });
        Check(legacyModeration.StatusCode == HttpStatusCode.BadRequest &&
            (await legacyModeration.Content.ReadAsStringAsync()).Contains("/api/me/articles/", StringComparison.Ordinal),
            "legacy article submission route gives actionable draft guidance instead of false service outage");
        Check(!await db.ModerationSubmissions.AnyAsync(item => item.Title == "Legacy route test"), "legacy route cannot create detached moderation content");
        var created = await client.PostAsJsonAsync("/api/admin/categories", new CategoryRequest { Name = "  Main  " });
        Check(created.StatusCode == HttpStatusCode.Created && created.Headers.Location is not null, "Admin category create 201 + Location");
        var category = (await created.Content.ReadFromJsonAsync<CategoryResponse>())!;
        Check(category.Name == "Main", "trim names");
        Check((await client.GetAsync(created.Headers.Location)).IsSuccessStatusCode, "Location resolves");
        Check((await client.PutAsJsonAsync("/api/admin/categories/" + category.Id, new CategoryRequest { Name = "Main", Description = "Updated" })).IsSuccessStatusCode, "update category");
        Check((await client.PutAsJsonAsync("/api/admin/categories/" + Guid.NewGuid(), new CategoryRequest { Name = "Missing" })).StatusCode == HttpStatusCode.NotFound, "update missing category 404");
        Check((await client.PostAsJsonAsync("/api/admin/categories", new CategoryRequest { Name = "main" })).StatusCode == HttpStatusCode.Conflict, "case-insensitive duplicate 409");
        Check((await client.PostAsJsonAsync("/api/admin/categories", new CategoryRequest { Name = "  " })).StatusCode == HttpStatusCode.BadRequest, "blank name 400");
        var tofuResult = await client.PostAsJsonAsync("/api/admin/ingredients", new IngredientRequest
        {
            Name = "Tofu", Aliases = "bean curd", Origin = IngredientOrigin.Plant, DefaultUnit = "g",
            Calories = 100, ProteinGram = 10, CarbohydrateGram = 5, FatGram = 3
        });
        var tofu = (await tofuResult.Content.ReadFromJsonAsync<IngredientResponse>())!;
        var riceResult = await client.PostAsJsonAsync("/api/admin/ingredients", new IngredientRequest
        {
            Name = "Rice", Origin = IngredientOrigin.Plant, DefaultUnit = "g",
            Calories = 100, ProteinGram = 2, CarbohydrateGram = 20, FatGram = 0
        });
        var rice = (await riceResult.Content.ReadFromJsonAsync<IngredientResponse>())!;
        Check((await client.PutAsJsonAsync("/api/admin/ingredients/" + rice.Id, new IngredientRequest
        {
            Name = "Rice", Origin = IngredientOrigin.Plant, DefaultUnit = "g", Calories = 100,
            ProteinGram = 2, CarbohydrateGram = 20, FatGram = 0
        })).IsSuccessStatusCode, "update ingredient nutrition");
        Check((await client.PostAsJsonAsync("/api/admin/ingredients", new IngredientRequest { Name = "Invalid origin", Origin = (IngredientOrigin)99 })).StatusCode == HttpStatusCode.BadRequest, "invalid origin 400");
        Check((await client.PostAsJsonAsync("/api/admin/ingredients", new IngredientRequest { Name = "Negative calories", DefaultUnit = "g", Calories = -1, ProteinGram = 0, CarbohydrateGram = 0, FatGram = 0 })).StatusCode == HttpStatusCode.BadRequest, "negative nutrition 400");
        RecipeRequest Recipe(string name, params RecipeIngredientRequest[] rows) => new()
        {
            CategoryId = category.Id,
            Name = name,
            Description = "Đậu hũ và cơm dùng kèm rau xanh.",
            Servings = 2,
            PrepTimeMinutes = 0,
            CookTimeMinutes = 10,
            ImageUrl = "https://example.test/recipe-cover.jpg",
            Instructions = "Cook",
            DeclaredDietaryType = DietaryType.Vegan,
            Ingredients = rows,
            CaloriesPerServing = 123.456m
        };
        RecipeIngredientRequest Row(Guid id, decimal quantity = 100) => new() { IngredientId = id, Quantity = quantity, Unit = "g" };
        foreach (var resource in new[] { "categories", "ingredients", "recipes" })
        {
            object payload = resource switch
            {
                "categories" => new CategoryRequest { Name = "Permission probe" },
                "ingredients" => new IngredientRequest { Name = "Permission probe" },
                "restaurants" => new RestaurantRequest { Name = "Permission probe", Address = "1 Test Street", DietaryType = DietaryType.Vegan },
                _ => Recipe("Permission probe", Row(rice.Id))
            };
            foreach (var role in new[] { "Guest", "User" })
            {
                client.DefaultRequestHeaders.Remove("Test-Role");
                if (role == "User")
                {
                    client.DefaultRequestHeaders.Add("Test-Role", role);
                }
                var expected = role == "Guest" ? HttpStatusCode.Unauthorized : HttpStatusCode.Forbidden;
                Check((await client.PostAsJsonAsync("/api/admin/" + resource, payload)).StatusCode == expected, resource + " " + role + " cannot create");
                Check((await client.PutAsJsonAsync("/api/admin/" + resource + "/" + Guid.NewGuid(), payload)).StatusCode == expected, resource + " " + role + " cannot update");
                using var deactivateRequest = new HttpRequestMessage(resource == "categories" ? HttpMethod.Patch : HttpMethod.Post,
                    "/api/admin/" + resource + "/" + Guid.NewGuid() + "/deactivate");
                Check((await client.SendAsync(deactivateRequest)).StatusCode == expected, resource + " " + role + " cannot deactivate");
                Check((await client.GetAsync("/api/admin/" + resource + "/" + Guid.NewGuid())).StatusCode == expected, resource + " " + role + " cannot read admin detail");
            }
        }
        client.DefaultRequestHeaders.Remove("Test-Role");
        client.DefaultRequestHeaders.Add("Test-Role", "Admin");
        Check((await client.PostAsJsonAsync("/api/admin/recipes", Recipe("Null rows", null!))).StatusCode == HttpStatusCode.BadRequest, "null ingredient list 400");
        Check((await client.PostAsJsonAsync("/api/admin/recipes", Recipe("Null row", new RecipeIngredientRequest[] { null! }))).StatusCode == HttpStatusCode.BadRequest, "null ingredient row 400");
        var recipeResult = await client.PostAsJsonAsync("/api/admin/recipes", Recipe("Tofu rice", Row(tofu.Id), Row(rice.Id)));
        if (!recipeResult.IsSuccessStatusCode)
        {
            Console.WriteLine(await recipeResult.Content.ReadAsStringAsync());
        }
        Check(recipeResult.StatusCode == HttpStatusCode.Created, "recipe graph saved");
        var recipe = (await recipeResult.Content.ReadFromJsonAsync<RecipeResponse>())!;
        Check(recipe.Ingredients.Count == 2 && recipe.CategoryName == "Main" && recipe.CaloriesPerServing == 100m,
            "recipe nutrition is calculated on server and ignores forged manual totals");
        foreach (var field in new[] { "categoryId", "imageUrl", "servings", "prepTimeMinutes", "cookTimeMinutes" })
        {
            var payload = System.Text.Json.JsonSerializer.SerializeToNode(Recipe("Missing required " + field, Row(tofu.Id)),
                new System.Text.Json.JsonSerializerOptions(System.Text.Json.JsonSerializerDefaults.Web))!.AsObject();
            payload.Remove(field);
            Check((await client.PostAsJsonAsync("/api/admin/recipes", payload)).StatusCode == HttpStatusCode.BadRequest,
                "recipe requires explicit " + field);
        }
        var countUnits = await client.PutAsJsonAsync("/api/admin/recipes/" + recipe.Id, Recipe("Tofu rice",
            new RecipeIngredientRequest { IngredientId = tofu.Id, Quantity = 2, Unit = "đơn vị", Note = "2 miếng cỡ vừa" },
            new RecipeIngredientRequest { IngredientId = rice.Id, Quantity = 150, Unit = "g" }));
        Check(countUnits.StatusCode == HttpStatusCode.BadRequest,
            "recipe rejects a count unit when ingredient data requires grams");
        Check((await client.PostAsJsonAsync("/api/admin/recipes", Recipe("Duplicate", Row(tofu.Id), Row(tofu.Id)))).StatusCode == HttpStatusCode.BadRequest, "reject duplicate ingredients");
        Check((await client.PostAsJsonAsync("/api/admin/recipes", Recipe("Missing", Row(Guid.NewGuid())))).StatusCode == HttpStatusCode.BadRequest, "reject missing ingredient");
        Check((await client.PostAsJsonAsync("/api/admin/recipes", Recipe("Zero", Row(tofu.Id, 0)))).StatusCode == HttpStatusCode.BadRequest, "reject zero quantity");
        Check((await client.PostAsJsonAsync("/api/admin/recipes", Recipe("Precision", Row(tofu.Id, 0.0001m)))).StatusCode == HttpStatusCode.BadRequest, "reject excess precision");
        Check((await client.PostAsJsonAsync("/api/admin/recipes", Recipe("Empty"))).StatusCode == HttpStatusCode.BadRequest, "reject empty ingredients");
        var updated = await client.PutAsJsonAsync("/api/admin/recipes/" + recipe.Id, Recipe("Tofu rice", Row(tofu.Id, 200)));
        Check(updated.IsSuccessStatusCode && (await updated.Content.ReadFromJsonAsync<RecipeResponse>())!.Ingredients.Single().Quantity == 200, "replace ingredients and retain existing composite key");
        var restored = await client.PutAsJsonAsync("/api/admin/recipes/" + recipe.Id, Recipe("Tofu rice", Row(tofu.Id, 200), Row(rice.Id)));
        Check(restored.IsSuccessStatusCode, "re-add removed ingredient");
        var restaurantRequest = new RestaurantRequest
        {
            Name = "  Chay Moc  ",
            Address = "12 Test Street, District One",
            District = "District One",
            Latitude = 10.776889m,
            Longitude = 106.700806m,
            PriceFromVnd = 50_000,
            PriceToVnd = 180_000,
            DietaryType = DietaryType.Vegan,
            Amenities = ["Wi-Fi", "Parking"],
            FeaturedDishes =
            [
                new RestaurantFeaturedDishRequest { Name = "Cơm đậu hũ", ImageUrl = "https://images.example.com/com-dau-hu.jpg" },
                new RestaurantFeaturedDishRequest { Name = "Canh nấm", ImageUrl = "https://images.example.com/canh-nam.jpg" },
                new RestaurantFeaturedDishRequest { Name = "Gỏi rau củ", ImageUrl = "https://images.example.com/goi-rau-cu.jpg" }
            ]
        };
        var restaurantResult = await client.PostAsJsonAsync("/api/admin/restaurants", restaurantRequest);
        Check(restaurantResult.StatusCode == HttpStatusCode.Created && restaurantResult.Headers.Location is not null, "restaurant create 201 + Location");
        var restaurant = (await restaurantResult.Content.ReadFromJsonAsync<RestaurantResponse>())!;
        Check(restaurant.Name == "Chay Moc" && restaurant.FeaturedDishes.Count == 3 &&
            restaurant.FeaturedDishes.Select(dish => dish.Name).SequenceEqual(["Cơm đậu hũ", "Canh nấm", "Gỏi rau củ"]) &&
            restaurant.DietaryType == DietaryType.Vegan,
            "restaurant trims data and retains three featured dishes");
        var nearby = await client.GetFromJsonAsync<RestaurantPage>("/api/restaurants?latitude=10.776889&longitude=106.700806&maxDistanceKm=1");
        Check(nearby!.Items.Single().Id == restaurant.Id && nearby.Items.Single().DistanceKm == 0m, "restaurant distance filter uses supplied location");
        Check(nearby.Items.Single().Latitude == restaurantRequest.Latitude && nearby.Items.Single().Longitude == restaurantRequest.Longitude,
            "restaurant cards and map receive stored coordinates without inferred markers");
        Check((await client.GetAsync("/api/restaurants?latitude=10")).StatusCode == HttpStatusCode.BadRequest, "restaurant rejects incomplete coordinates");
        Check((await client.PostAsJsonAsync("/api/admin/restaurants", new RestaurantRequest
        {
            Name = "CHAY MOC",
            Address = restaurantRequest.Address,
            DietaryType = restaurantRequest.DietaryType,
            FeaturedDishes = restaurantRequest.FeaturedDishes
        })).StatusCode == HttpStatusCode.Conflict,
            "restaurant duplicate name 409");
        // Nhà hàng nhiều loại: kiểm tra lưu thật, đọc lại, lọc từng loại và bỏ chọn khi cập nhật.
        RestaurantRequest MultiDietRequest(params DietaryType[] types) => new()
        {
            Name = "Multi diet restaurant",
            Address = restaurantRequest.Address,
            DietaryTypes = types,
            FeaturedDishes = restaurantRequest.FeaturedDishes
        };
        var multiResult = await client.PostAsJsonAsync("/api/admin/restaurants",
            MultiDietRequest(DietaryType.Vegan, DietaryType.OvoVegetarian, DietaryType.LactoVegetarian));
        Check(multiResult.StatusCode == HttpStatusCode.Created, "restaurant accepts multiple declared diets");
        var multi = (await multiResult.Content.ReadFromJsonAsync<RestaurantResponse>())!;
        var multiDetail = (await client.GetFromJsonAsync<RestaurantResponse>("/api/restaurants/" + multi.Id))!;
        Check(multiDetail.DietaryType is null && multiDetail.DietaryTypes.ToHashSet().SetEquals(
            [DietaryType.Vegan, DietaryType.OvoVegetarian, DietaryType.LactoVegetarian]),
            "restaurant persists and returns every declared diet without inventing one primary diet");
        foreach (var diet in new[] { DietaryType.Vegan, DietaryType.LactoVegetarian, DietaryType.OvoVegetarian, DietaryType.LactoOvoVegetarian })
        {
            var filtered = (await client.GetFromJsonAsync<RestaurantPage>("/api/restaurants?dietaryType=" + (int)diet))!;
            Check(filtered.Items.Any(item => item.Id == multi.Id) == (diet != DietaryType.LactoOvoVegetarian),
                "restaurant filter matches only selected diet: " + diet);
        }
        var multiUpdated = await client.PutAsJsonAsync("/api/admin/restaurants/" + multi.Id,
            MultiDietRequest(DietaryType.OvoVegetarian));
        Check(multiUpdated.IsSuccessStatusCode &&
            (await multiUpdated.Content.ReadFromJsonAsync<RestaurantResponse>())!.DietaryTypes.SequenceEqual([DietaryType.OvoVegetarian]),
            "restaurant update removes deselected diets and retains selected diet");
        Check(!(await client.GetFromJsonAsync<RestaurantPage>("/api/restaurants?dietaryType=1"))!.Items.Any(item => item.Id == multi.Id),
            "removed restaurant diet no longer matches public filter");
        foreach (var invalid in new[] { Array.Empty<DietaryType>(), new[] { (DietaryType)99 }, new[] { DietaryType.Vegan, DietaryType.Vegan } })
            Check((await client.PutAsJsonAsync("/api/admin/restaurants/" + multi.Id, MultiDietRequest(invalid))).StatusCode == HttpStatusCode.BadRequest,
                "restaurant rejects missing, unknown or duplicate diets: " + string.Join(',', invalid));
        Check((await client.GetFromJsonAsync<RestaurantResponse>("/api/admin/restaurants/" + multi.Id))!.DietaryTypes.SequenceEqual([DietaryType.OvoVegetarian]),
            "invalid restaurant update keeps stored diets intact");
        Check((await client.PostAsync("/api/admin/restaurants/" + multi.Id + "/deactivate", null)).StatusCode == HttpStatusCode.NoContent,
            "deactivate multi-diet fixture after checks");
        var recipeFavoriteResult = await client.PostAsJsonAsync("/api/favorites", new FavoriteRequest
        {
            TargetType = FavoriteTargetType.Recipe,
            TargetId = recipe.Id
        });
        var recipeFavorite = (await recipeFavoriteResult.Content.ReadFromJsonAsync<FavoriteResponse>())!;
        Check(recipeFavoriteResult.StatusCode == HttpStatusCode.Created && recipeFavorite.TargetName == recipe.Name,
            "favorite active recipe create");
        var restaurantFavoriteResult = await client.PostAsJsonAsync("/api/favorites", new FavoriteRequest
        {
            TargetType = FavoriteTargetType.Restaurant,
            TargetId = restaurant.Id
        });
        var restaurantFavorite = (await restaurantFavoriteResult.Content.ReadFromJsonAsync<FavoriteResponse>())!;
        Check(restaurantFavoriteResult.StatusCode == HttpStatusCode.Created, "favorite active restaurant create");
        Check((await client.PostAsJsonAsync("/api/favorites", new FavoriteRequest
        {
            TargetType = FavoriteTargetType.Recipe,
            TargetId = recipe.Id
        })).StatusCode == HttpStatusCode.Conflict, "favorite duplicate 409");
        Check((await client.PostAsJsonAsync("/api/favorites", new FavoriteRequest
        {
            TargetType = FavoriteTargetType.Video,
            TargetId = Guid.NewGuid()
        })).StatusCode == HttpStatusCode.NotFound, "favorite hides unavailable video");
        var favorites = await client.GetFromJsonAsync<FavoritePage>("/api/favorites");
        Check(favorites!.TotalCount == 2 && favorites.Items.Select(item => item.TargetId).ToHashSet().SetEquals([recipe.Id, restaurant.Id]),
            "favorite list returns caller's visible targets");
        client.DefaultRequestHeaders.Remove("Test-Role");
        client.DefaultRequestHeaders.Add("Test-Role", "User");
        Check((await client.GetFromJsonAsync<FavoritePage>("/api/favorites"))!.TotalCount == 0 &&
            (await client.DeleteAsync("/api/favorites/" + recipeFavorite.Id)).StatusCode == HttpStatusCode.NotFound,
            "favorites are isolated by user");
        client.DefaultRequestHeaders.Remove("Test-Role");
        client.DefaultRequestHeaders.Add("Test-Role", "Admin");
        Check((await client.DeleteAsync("/api/favorites/" + restaurantFavorite.Id)).StatusCode == HttpStatusCode.NoContent,
            "favorite delete");
        var pantryItemResult = await client.PostAsJsonAsync("/api/pantry/items", new PantryItemRequest
        {
            IngredientId = tofu.Id,
            Quantity = 200,
            Unit = "g"
        });
        Check(pantryItemResult.StatusCode == HttpStatusCode.Created && pantryItemResult.Headers.Location is not null,
            "pantry catalog item create 201 + Location");
        var pantryTofu = (await pantryItemResult.Content.ReadFromJsonAsync<PantryItemResponse>())!;
        Check(pantryTofu.IsCatalogMatched && pantryTofu.IngredientId == tofu.Id && pantryTofu.Quantity == 200,
            "pantry catalog item has managed ingredient data");
        Check((await client.PostAsJsonAsync("/api/pantry/items", new PantryItemRequest { Name = "bean curd" })).StatusCode == HttpStatusCode.Conflict,
            "pantry alias match prevents duplicate catalog item");
        Check((await client.PostAsJsonAsync("/api/pantry/items", new PantryItemRequest { IngredientId = tofu.Id, Name = "Tofu" })).StatusCode == HttpStatusCode.BadRequest,
            "pantry requires exactly one ingredient ID or name");
        var customPantryResult = await client.PostAsJsonAsync("/api/pantry/items", new PantryItemRequest
        {
            Name = "Homemade sauce",
            Quantity = 1,
            Unit = "jar"
        });
        var customPantryItem = (await customPantryResult.Content.ReadFromJsonAsync<PantryItemResponse>())!;
        Check(customPantryResult.StatusCode == HttpStatusCode.Created && !customPantryItem.IsCatalogMatched &&
            customPantryItem.DietaryCompatibility is null, "pantry keeps unmatched ingredient as unknown");
        var pantryUpdate = await client.PutAsJsonAsync("/api/pantry/items/" + pantryTofu.Id, new PantryItemRequest
        {
            IngredientId = tofu.Id,
            Quantity = 250,
            Unit = "g"
        });
        Check(pantryUpdate.IsSuccessStatusCode && (await pantryUpdate.Content.ReadFromJsonAsync<PantryItemResponse>())!.Quantity == 250,
            "pantry item update");
        var suggestions = await client.GetFromJsonAsync<List<PantryRecipeSuggestionResponse>>("/api/pantry/recipe-suggestions");
        var recipeSuggestion = suggestions!.Single(item => item.RecipeId == recipe.Id);
        Check(recipeSuggestion.MatchPercent == 50 && recipeSuggestion.AvailableIngredients.Single().IngredientId == tofu.Id,
            "pantry recipe suggestion separates available and missing ingredients");
        var substitutions = await client.GetFromJsonAsync<List<PantrySubstitutionCandidateResponse>>(
            "/api/pantry/items/" + pantryTofu.Id + "/substitution-candidates");
        Check(substitutions!.Any(item => item.IngredientId == rice.Id), "pantry substitution candidates use compatible catalog data");
        client.DefaultRequestHeaders.Remove("Test-Role");
        client.DefaultRequestHeaders.Add("Test-Role", "User");
        Check((await client.GetAsync("/api/pantry/items/" + pantryTofu.Id)).StatusCode == HttpStatusCode.NotFound,
            "pantry item is isolated by user");
        client.DefaultRequestHeaders.Remove("Test-Role");
        client.DefaultRequestHeaders.Add("Test-Role", "Admin");
        Check((await client.DeleteAsync("/api/pantry/items/" + customPantryItem.Id)).StatusCode == HttpStatusCode.NoContent &&
            (await client.GetAsync("/api/pantry/items/" + customPantryItem.Id)).StatusCode == HttpStatusCode.NotFound,
            "pantry custom item delete");
        client.DefaultRequestHeaders.Add("Test-UserId", testUser.Id);
        var generatePlan = await client.PostAsJsonAsync("/api/meal-plans/generate", new MealPlanGenerateRequest
        {
            Name = "Vegan week",
            WeekStartDate = new DateOnly(2026, 10, 12)
        });
        var mealPlan = (await generatePlan.Content.ReadFromJsonAsync<MealPlanResponse>())!;
        Check(generatePlan.StatusCode == HttpStatusCode.Created && mealPlan.Meals.Count == 21 &&
            mealPlan.Meals.GroupBy(meal => meal.DayNumber).All(day => day.Count() == 3) && mealPlan.Nutrition.Calories > 0,
            "meal plan generates 7 days with 3 meals and nutrition totals");
        var plans = await client.GetFromJsonAsync<MealPlanPage>("/api/meal-plans?page=1&pageSize=20");
        Check(plans!.TotalCount == 1 && plans.Items.Single().Id == mealPlan.Id, "meal plan list is paginated and user scoped");
        var replacement = await client.PutAsJsonAsync("/api/meal-plans/" + mealPlan.Id + "/meals/1/Breakfast",
            new MealReplacementRequest { RecipeId = recipe.Id, Servings = 2 });
        mealPlan = (await replacement.Content.ReadFromJsonAsync<MealPlanResponse>())!;
        Check(replacement.IsSuccessStatusCode && mealPlan.Meals.Single(meal => meal.DayNumber == 1 && meal.Slot == MealSlot.Breakfast).Servings == 2 &&
            mealPlan.ShoppingItems.Any(item => item.QuantityToBuy > 0), "meal replacement updates the plan and shopping list");
        var shoppingItem = mealPlan.ShoppingItems.First();
        var purchased = await client.PutAsJsonAsync("/api/meal-plans/" + mealPlan.Id + "/shopping-list/" + shoppingItem.Id + "/purchase",
            new ShoppingPurchaseRequest { IsPurchased = true });
        Check(purchased.IsSuccessStatusCode && (await purchased.Content.ReadFromJsonAsync<List<ShoppingItemResponse>>())!.Single(item => item.Id == shoppingItem.Id).IsPurchased,
            "shopping list purchase state persists");
        var regenerated = await client.PostAsync("/api/meal-plans/" + mealPlan.Id + "/regenerate", null);
        Check(regenerated.IsSuccessStatusCode && (await regenerated.Content.ReadFromJsonAsync<MealPlanResponse>())!.Meals.Count == 21,
            "meal plan regenerates all 21 positions");
        var copied = await client.PostAsJsonAsync("/api/meal-plans/" + mealPlan.Id + "/apply-to-week", new MealPlanCopyToWeekRequest
        {
            WeekStartDate = new DateOnly(2026, 10, 19),
            Name = "Next vegan week"
        });
        var nextWeek = (await copied.Content.ReadFromJsonAsync<MealPlanResponse>())!;
        Check(copied.StatusCode == HttpStatusCode.Created && nextWeek.Id != mealPlan.Id && nextWeek.Meals.Count == 21,
            "meal plan applies saved snapshot to a new week");
        var pdf = await client.GetAsync("/api/meal-plans/" + mealPlan.Id + "/pdf");
        Check(pdf.Content.Headers.ContentType?.MediaType == "application/pdf" && (await pdf.Content.ReadAsByteArrayAsync()).AsSpan().StartsWith("%PDF"u8),
            "meal plan exports a real PDF document");
        client.DefaultRequestHeaders.Remove("Test-UserId");
        await client.PostAsync("/api/admin/ingredients/" + tofu.Id + "/deactivate", null);
        Check((await client.GetAsync("/api/ingredients/" + tofu.Id)).StatusCode == HttpStatusCode.NotFound, "inactive ingredient hidden publicly");
        Check(!(await client.GetFromJsonAsync<IngredientPage>("/api/ingredients?pageSize=100"))!.Items.Any(item => item.Id == tofu.Id),
            "inactive ingredient excluded from new recipe ingredient picker");
        var detail = await client.GetFromJsonAsync<RecipeResponse>("/api/recipes/" + recipe.Id);
        client.DefaultRequestHeaders.Remove("Test-Role");
        Check((await client.PostAsync($"/api/admin/ingredients/{tofu.Id}/activate", null)).StatusCode == HttpStatusCode.Unauthorized,
            "Guest cannot activate ingredient");
        client.DefaultRequestHeaders.Add("Test-Role", "User");
        Check((await client.PostAsync($"/api/admin/ingredients/{tofu.Id}/activate", null)).StatusCode == HttpStatusCode.Forbidden,
            "User cannot activate ingredient");
        client.DefaultRequestHeaders.Remove("Test-Role");
        client.DefaultRequestHeaders.Add("Test-Role", "Admin");
        Check((await client.PostAsync($"/api/admin/ingredients/{tofu.Id}/activate", null)).StatusCode == HttpStatusCode.NoContent,
            "Admin activates ingredient");
        var reopened = (await client.GetFromJsonAsync<IngredientResponse>("/api/ingredients/" + tofu.Id))!;
        Check(reopened.IsActive && reopened.Name == tofu.Name && reopened.Calories == tofu.Calories,
            "activation persists and restores public ingredient without changing nutrition");
        Check((await client.GetFromJsonAsync<IngredientPage>("/api/ingredients?pageSize=100"))!.Items.Any(item => item.Id == tofu.Id),
            "activated ingredient returns to recipe picker");
        Check((await client.PostAsync($"/api/admin/ingredients/{tofu.Id}/activate", null)).StatusCode == HttpStatusCode.NoContent,
            "ingredient activation is idempotent");
        Check((await client.PostAsync($"/api/admin/ingredients/{Guid.NewGuid()}/activate", null)).StatusCode == HttpStatusCode.NotFound,
            "missing ingredient activation returns 404");
        await client.PostAsync($"/api/admin/ingredients/{tofu.Id}/deactivate", null);
        Check(detail!.Ingredients.Any(x => x.IngredientId == tofu.Id && !x.IsActive), "existing recipe keeps inactive ingredient");
        Check((await client.PostAsJsonAsync("/api/admin/recipes", Recipe("Inactive", Row(tofu.Id)))).StatusCode == HttpStatusCode.BadRequest, "new recipe cannot use inactive ingredient");
        Check((await client.PutAsJsonAsync("/api/admin/recipes/" + recipe.Id, Recipe("Tofu rice", Row(tofu.Id, 300)))).IsSuccessStatusCode, "existing recipe can retain inactive reference");
        Check((await client.PatchAsync("/api/admin/categories/" + category.Id + "/deactivate", null)).StatusCode == HttpStatusCode.NoContent, "category PATCH deactivate 204");
        Check((await client.GetAsync("/api/categories/" + category.Id)).StatusCode == HttpStatusCode.NotFound,
            "inactive category hidden from public category detail");
        Check(!(await client.GetFromJsonAsync<CategoryPage>("/api/categories?pageSize=100"))!.Items.Any(item => item.Id == category.Id),
            "inactive category excluded from active category list");
        Check((await client.PutAsJsonAsync("/api/admin/recipes/" + recipe.Id, Recipe("Tofu rice", Row(tofu.Id, 300)))).IsSuccessStatusCode, "existing recipe can retain inactive category");
        Check((await client.PostAsJsonAsync("/api/admin/recipes", Recipe("Inactive category", Row(rice.Id)))).StatusCode == HttpStatusCode.BadRequest, "new recipe cannot use inactive category");
        var page = await client.GetFromJsonAsync<RecipePage>("/api/recipes?categoryId=" + category.Id + "&pageSize=1");
        Check(page!.Items.Count == 1 && page.TotalCount == 1, "category filter and pagination");
        Check((await client.GetFromJsonAsync<RecipeResponse>("/api/recipes/" + recipe.Id))!.CategoryName == category.Name,
            "public existing recipe retains category name after category is locked");
        // Chặn lỗi thẻ công thức báo thiếu mô tả dù trang chi tiết đã có dữ liệu.
        Check(page.Items[0].Description == detail.Description && !string.IsNullOrWhiteSpace(page.Items[0].Description), "recipe list preserves saved detail description");
        Check((await client.GetFromJsonAsync<RecipePage>("/api/recipes?pageNumber=2147483647&pageSize=100"))!.Items.Count == 0, "large page avoids integer overflow");
        Check((await client.GetAsync("/api/recipes?pageSize=101")).StatusCode == HttpStatusCode.BadRequest, "invalid page size 400");
        Check((await client.GetFromJsonAsync<IngredientPage>("/api/admin/ingredients?search=bean"))!.TotalCount == 1, "alias search and admin inactive list");
        await client.PostAsync("/api/admin/recipes/" + recipe.Id + "/deactivate", null);
        Check((await client.GetAsync("/api/recipes/" + recipe.Id)).StatusCode == HttpStatusCode.NotFound, "inactive recipe detail hidden");
        Check((await client.GetFromJsonAsync<RecipePage>("/api/recipes"))!.TotalCount == 0, "inactive recipe excluded from public list");
        Check((await client.GetAsync("/api/admin/recipes/" + recipe.Id)).IsSuccessStatusCode, "Admin can inspect inactive recipe");
        Check((await client.PostAsync("/api/admin/recipes/" + recipe.Id + "/deactivate", null)).StatusCode == HttpStatusCode.NoContent, "deactivate idempotent");
        await client.PostAsync("/api/admin/restaurants/" + restaurant.Id + "/deactivate", null);
        Check((await client.GetAsync("/api/restaurants/" + restaurant.Id)).StatusCode == HttpStatusCode.NotFound, "inactive restaurant hidden publicly");
        Check((await client.GetAsync("/api/admin/restaurants/" + restaurant.Id)).IsSuccessStatusCode, "Admin can inspect inactive restaurant");
        // Mở khóa phải lưu DB và khôi phục public; không chỉ thay trạng thái hiển thị trên FE.
        client.DefaultRequestHeaders.Remove("Test-Role");
        Check((await client.PostAsync($"/api/admin/restaurants/{restaurant.Id}/activate", null)).StatusCode == HttpStatusCode.Unauthorized, "Guest cannot reactivate restaurant");
        client.DefaultRequestHeaders.Add("Test-Role", "User");
        Check((await client.PostAsync($"/api/admin/restaurants/{restaurant.Id}/activate", null)).StatusCode == HttpStatusCode.Forbidden, "User cannot reactivate restaurant");
        client.DefaultRequestHeaders.Remove("Test-Role");
        client.DefaultRequestHeaders.Add("Test-Role", "Admin");
        Check((await client.PostAsync($"/api/admin/restaurants/{Guid.NewGuid()}/activate", null)).StatusCode == HttpStatusCode.NotFound, "reactivate missing restaurant returns 404");
        Check((await client.PostAsync($"/api/admin/restaurants/{restaurant.Id}/activate", null)).StatusCode == HttpStatusCode.NoContent, "Admin reactivation succeeds after saving");
        Check(await db.Restaurants.AsNoTracking().AnyAsync(item => item.Id == restaurant.Id && item.IsActive), "restaurant reactivation persists in SQL");
        Check((await client.GetAsync($"/api/restaurants/{restaurant.Id}")).IsSuccessStatusCode, "reactivated restaurant detail visible publicly");
        Check((await client.GetFromJsonAsync<RestaurantPage>("/api/restaurants"))!.Items.Any(item => item.Id == restaurant.Id), "reactivated restaurant returns to public list");
        Check((await client.PostAsync($"/api/admin/restaurants/{restaurant.Id}/activate", null)).StatusCode == HttpStatusCode.NoContent, "restaurant reactivation idempotent");
        Check(!await db.Favorites.AsNoTracking().AnyAsync(item => item.TargetType == FavoriteTargetType.Restaurant && item.TargetId == restaurant.Id), "reactivation does not recreate removed favorites");
        await client.PostAsync($"/api/admin/restaurants/{restaurant.Id}/deactivate", null);
        // Simulate precheck races by bypassing the application name lookup.
        db.Categories.Add(new Domain.Entities.Category { Name = "MAIN" });
        try { await new CategoryRepository(db).SaveAsync(ct); throw new Exception("Unique index missing"); }
        catch (ConflictException) { Check(true, "SQL unique violation translated to conflict"); }
        db.ChangeTracker.Clear();
        var linkedCategory = await db.Categories.FindAsync(category.Id);
        db.Categories.Remove(linkedCategory!);
        try { await db.SaveChangesAsync(); throw new Exception("Restrict missing"); }
        catch (DbUpdateException) { Check(true, "SQL foreign key protects referenced category"); }
        db.ChangeTracker.Clear();
    }
}
