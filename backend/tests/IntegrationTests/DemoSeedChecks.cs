using System.Net;
using System.Net.Http.Json;
using Application.Features.Recipes;
using Application.Features.Restaurants;
using Domain.Enums;
using Infrastructure.Persistence;
using Infrastructure.Persistence.Seeding;
using Microsoft.EntityFrameworkCore;

namespace CoreDataChecks;

internal static class DemoSeedChecks
{
    public static async Task RunAsync(HttpClient client, AppDbContext db, Action<bool, string> check)
    {
        var usersBefore = await db.Users.CountAsync();
        var plansBefore = await db.MealPlans.CountAsync();
        await DemoDataSeeder.SeedAsync(db);
        db.ChangeTracker.Clear();
        var categories = await db.Categories.Where(x => x.Name.StartsWith("[Demo]")).ToListAsync();
        var ingredients = await db.Ingredients.Where(x => x.Name.StartsWith("[Demo]")).ToListAsync();
        var recipes = await db.Recipes.Where(x => x.Name.StartsWith("[Demo]"))
            .Include(x => x.RecipeIngredients).ThenInclude(x => x.Ingredient).ToListAsync();
        check(categories.Count == 8 && ingredients.Count == 36 && recipes.Count == 32, "complete demo catalog saved");
        check(await db.Users.CountAsync() == usersBefore && await db.MealPlans.CountAsync() == plansBefore,
            "demo seed does not create accounts or meal plans");
        check(recipes.All(x => x.RecipeIngredients.Count > 0 && x.RecipeIngredients.All(row => row.Ingredient is not null)),
            "demo recipes have real ingredient references");
        check(recipes.Where(x => !x.Name.Contains("cần xác minh")).All(x =>
            x.CaloriesPerServing.HasValue && x.ProteinGramPerServing.HasValue &&
            x.CarbohydrateGramPerServing.HasValue && x.FatGramPerServing.HasValue), "known demo recipes have complete nutrition");

        client.DefaultRequestHeaders.Remove("Test-Role");
        var all = (await client.GetFromJsonAsync<RecipePage>("/api/recipes?search=%5BDemo%5D&pageSize=100"))!;
        check(all.TotalCount == 31, "public demo recipes exclude inactive recipe");
        var first = (await client.GetFromJsonAsync<RecipePage>("/api/recipes?search=%5BDemo%5D&pageSize=20"))!;
        var second = (await client.GetFromJsonAsync<RecipePage>("/api/recipes?search=%5BDemo%5D&pageSize=20&pageNumber=2"))!;
        check(first.Items.Count == 20 && second.Items.Count == 11 &&
            !first.Items.Select(x => x.Id).Intersect(second.Items.Select(x => x.Id)).Any(), "demo supports two distinct recipe pages");
        var vegan = (await client.GetFromJsonAsync<RecipePage>("/api/recipes?search=%5BDemo%5D&dietaryType=1&pageSize=100"))!;
        check(vegan.TotalCount == 21 && vegan.Items.All(x => x.DietaryAssessments.Single(a =>
            a.DietaryType == DietaryType.Vegan).Status == DietaryCompatibility.Compatible), "21 demo recipes match Vegan filter");
        check(all.Items.Single(x => x.Name.Contains("cần xác minh")).DietaryAssessments.All(x => x.Status == DietaryCompatibility.Unknown),
            "unverified seasoning keeps unknown dietary status");
        check(all.Items.Single(x => x.Name.Contains("nước mắm cá")).DietaryAssessments.All(x => x.Status == DietaryCompatibility.Incompatible),
            "fish sauce example is incompatible with all vegetarian diets");
        var inactive = recipes.Single(x => !x.IsActive);
        check((await client.GetAsync("/api/recipes/" + inactive.Id)).StatusCode == HttpStatusCode.NotFound,
            "inactive demo recipe is hidden from public detail");
        client.DefaultRequestHeaders.Add("Test-Role", "Admin");
        check((await client.GetAsync("/api/admin/recipes/" + inactive.Id)).IsSuccessStatusCode,
            "Admin can view inactive demo recipe and retained references");

        var restaurants = await db.Restaurants.Where(x => x.Name.StartsWith("[Demo]"))
            .Include(x => x.Amenities).Include(x => x.DietaryTypes).Include(x => x.FeaturedDishes).ToListAsync();
        check(restaurants.Count == 12 && restaurants.Count(x => x.IsActive) == 11, "12 demo restaurants including one inactive");
        client.DefaultRequestHeaders.Remove("Test-Role");
        var restaurantPage = (await client.GetFromJsonAsync<RestaurantPage>("/api/restaurants?search=%5BDemo%5D&pageSize=100"))!;
        check(restaurantPage.TotalCount == 11 && restaurantPage.Items.All(x => x.IsActive), "public restaurant list hides inactive demo");
        var districtPage = (await client.GetFromJsonAsync<RestaurantPage>("/api/restaurants?search=%5BDemo%5D&district=" + Uri.EscapeDataString("Hà Nội")))!;
        check(districtPage.TotalCount == 4 && districtPage.Items.All(x => x.District!.Contains("Hà Nội")), "demo restaurants support city and district search");
        var veganRestaurants = (await client.GetFromJsonAsync<RestaurantPage>("/api/restaurants?search=%5BDemo%5D&dietaryType=1"))!;
        check(veganRestaurants.TotalCount == 8 && veganRestaurants.Items.All(x => x.DietaryTypes.Contains(DietaryType.Vegan)), "demo restaurant dietary filter uses declared diets");
        var nearby = (await client.GetFromJsonAsync<RestaurantPage>("/api/restaurants?search=%5BDemo%5D&latitude=10.776889&longitude=106.700806&maxDistanceKm=5"))!;
        check(nearby.TotalCount >= 1 && nearby.Items[0].DistanceKm == 0 && nearby.Items.All(x => x.DistanceKm is <= 5),
            "demo coordinate search sorts by distance and excludes missing coordinates");
        var missing = restaurants.Single(x => x.Latitude is null);
        var missingDetail = (await client.GetFromJsonAsync<RestaurantResponse>("/api/restaurants/" + missing.Id))!;
        check(missingDetail.Latitude is null && missingDetail.Longitude is null && missingDetail.PriceFromVnd is null && missingDetail.OpeningHours is null,
            "restaurant missing details remain unknown");
        var linked = restaurants.Single(x => x.Name.Contains("Bếp Lá"));
        var linkedDetail = (await client.GetFromJsonAsync<RestaurantResponse>("/api/restaurants/" + linked.Id))!;
        check(linkedDetail.FeaturedDishes.Count == 3 && linkedDetail.FeaturedDishes.All(x => !string.IsNullOrWhiteSpace(x.Name) && !string.IsNullOrWhiteSpace(x.ImageUrl)) &&
            linkedDetail.Amenities.Count == 3 && linkedDetail.Source!.Contains("giả lập"), "restaurant detail has three featured dishes, amenities and demo source");
        var inactiveRestaurant = restaurants.Single(x => !x.IsActive);
        check((await client.GetAsync("/api/restaurants/" + inactiveRestaurant.Id)).StatusCode == HttpStatusCode.NotFound,
            "inactive demo restaurant public detail returns 404");
        client.DefaultRequestHeaders.Add("Test-Role", "Admin");
        check((await client.GetAsync("/api/admin/restaurants/" + inactiveRestaurant.Id)).IsSuccessStatusCode,
            "Admin can inspect inactive demo restaurant");

        // Simulate edits in all three modules before rerunning the seed.
        categories[0].Name = "Demo category renamed by Admin";
        ingredients[0].Source = "Demo ingredient edited by Admin";
        ingredients[0].IsActive = false;
        recipes[0].Instructions = "Demo recipe edited by Admin";
        recipes[0].IsActive = false;
        linked.Name = "Demo restaurant renamed by Admin";
        linked.IsActive = false;
        db.RestaurantAmenities.Remove(linked.Amenities.First());
        await db.SaveChangesAsync();
        var counts = (await db.Categories.CountAsync(), await db.Ingredients.CountAsync(),
            await db.Recipes.CountAsync(), await db.RecipeIngredients.CountAsync());
        var restaurantCounts = (await db.Restaurants.CountAsync(), await db.RestaurantAmenities.CountAsync(),
            await db.RestaurantDietaryTypes.CountAsync(), await db.RestaurantFeaturedDishes.CountAsync());
        db.ChangeTracker.Clear();
        await DemoDataSeeder.SeedAsync(db);
        db.ChangeTracker.Clear();
        check(counts == (await db.Categories.CountAsync(), await db.Ingredients.CountAsync(),
            await db.Recipes.CountAsync(), await db.RecipeIngredients.CountAsync()), "demo rerun does not duplicate catalog or ingredient rows");
        check((await db.Categories.SingleAsync(x => x.Id == categories[0].Id)).Name == categories[0].Name &&
            (await db.Ingredients.SingleAsync(x => x.Id == ingredients[0].Id)).Source == ingredients[0].Source &&
            !await db.Ingredients.Where(x => x.Id == ingredients[0].Id).Select(x => x.IsActive).SingleAsync() &&
            (await db.Recipes.SingleAsync(x => x.Id == recipes[0].Id)).Instructions == recipes[0].Instructions &&
            !await db.Recipes.Where(x => x.Id == recipes[0].Id).Select(x => x.IsActive).SingleAsync(),
            "demo rerun preserves Admin edits, renamed categories and inactive statuses");
        check(restaurantCounts == (await db.Restaurants.CountAsync(), await db.RestaurantAmenities.CountAsync(),
            await db.RestaurantDietaryTypes.CountAsync(), await db.RestaurantFeaturedDishes.CountAsync()) &&
            (await db.Restaurants.SingleAsync(x => x.Id == linked.Id)).Name == linked.Name &&
            !await db.Restaurants.Where(x => x.Id == linked.Id).Select(x => x.IsActive).SingleAsync(),
            "demo rerun preserves restaurant edits and does not restore removed amenities or duplicate featured dishes");
    }
}
