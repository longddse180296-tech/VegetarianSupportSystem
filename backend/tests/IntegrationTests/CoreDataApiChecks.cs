using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using Application;
using Application.Features.Categories;
using Application.Features.Ingredients;
using Application.Features.Recipes;
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
        var openapi = await client.GetStringAsync("/openapi/v1.json");
        Check(openapi.Contains("/api/admin/recipes/{id}") && openapi.Contains("RecipeRequest"), "OpenAPI endpoints and DTO schema");
        foreach (var resource in new[] { "categories", "ingredients", "recipes" })
        {
            Check((await client.GetAsync("/api/admin/" + resource)).StatusCode == HttpStatusCode.Unauthorized, resource + " Guest 401");
            client.DefaultRequestHeaders.Add("Test-Role", "User");
            Check((await client.GetAsync("/api/admin/" + resource)).StatusCode == HttpStatusCode.Forbidden, resource + " User 403");
            client.DefaultRequestHeaders.Remove("Test-Role");
        }
        client.DefaultRequestHeaders.Add("Test-Role", "Admin");
        var created = await client.PostAsJsonAsync("/api/admin/categories", new CategoryRequest { Name = "  Main  " });
        Check(created.StatusCode == HttpStatusCode.Created && created.Headers.Location is not null, "Admin category create 201 + Location");
        var category = (await created.Content.ReadFromJsonAsync<CategoryResponse>())!;
        Check(category.Name == "Main", "trim names");
        Check((await client.GetAsync(created.Headers.Location)).IsSuccessStatusCode, "Location resolves");
        Check((await client.PutAsJsonAsync("/api/admin/categories/" + category.Id, new CategoryRequest { Name = "Main", Description = "Updated" })).IsSuccessStatusCode, "update category");
        Check((await client.PutAsJsonAsync("/api/admin/categories/" + Guid.NewGuid(), new CategoryRequest { Name = "Missing" })).StatusCode == HttpStatusCode.NotFound, "update missing category 404");
        Check((await client.PostAsJsonAsync("/api/admin/categories", new CategoryRequest { Name = "main" })).StatusCode == HttpStatusCode.Conflict, "case-insensitive duplicate 409");
        Check((await client.PostAsJsonAsync("/api/admin/categories", new CategoryRequest { Name = "  " })).StatusCode == HttpStatusCode.BadRequest, "blank name 400");
        var tofuResult = await client.PostAsJsonAsync("/api/admin/ingredients", new IngredientRequest { Name = "Tofu", Aliases = "bean curd", Origin = IngredientOrigin.Plant });
        var tofu = (await tofuResult.Content.ReadFromJsonAsync<IngredientResponse>())!;
        var riceResult = await client.PostAsJsonAsync("/api/admin/ingredients", new IngredientRequest { Name = "Rice", Origin = IngredientOrigin.Plant });
        var rice = (await riceResult.Content.ReadFromJsonAsync<IngredientResponse>())!;
        Check((await client.PutAsJsonAsync("/api/admin/ingredients/" + rice.Id, new IngredientRequest { Name = "Rice", Origin = IngredientOrigin.Plant, CaloriesPer100Gram = 100 })).IsSuccessStatusCode, "update ingredient nutrition");
        Check((await client.PostAsJsonAsync("/api/admin/ingredients", new IngredientRequest { Name = "Invalid origin", Origin = (IngredientOrigin)99 })).StatusCode == HttpStatusCode.BadRequest, "invalid origin 400");
        Check((await client.PostAsJsonAsync("/api/admin/ingredients", new IngredientRequest { Name = "Negative calories", CaloriesPer100Gram = -1 })).StatusCode == HttpStatusCode.BadRequest, "negative nutrition 400");
        RecipeRequest Recipe(string name, params RecipeIngredientRequest[] rows) => new()
        { CategoryId = category.Id, Name = name, Servings = 2, Instructions = "Cook", Ingredients = rows, CaloriesPerServing = 123.456m };
        RecipeIngredientRequest Row(Guid id, decimal quantity = 100) => new() { IngredientId = id, Quantity = quantity, Unit = "g" };
        foreach (var resource in new[] { "categories", "ingredients", "recipes" })
        {
            object payload = resource switch
            {
                "categories" => new CategoryRequest { Name = "Permission probe" },
                "ingredients" => new IngredientRequest { Name = "Permission probe" },
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
        Check(recipe.Ingredients.Count == 2 && recipe.CategoryName == "Main" && recipe.CaloriesPerServing == 123.456m, "recipe detail and decimal precision");
        Check((await client.PostAsJsonAsync("/api/admin/recipes", Recipe("Duplicate", Row(tofu.Id), Row(tofu.Id)))).StatusCode == HttpStatusCode.BadRequest, "reject duplicate ingredients");
        Check((await client.PostAsJsonAsync("/api/admin/recipes", Recipe("Missing", Row(Guid.NewGuid())))).StatusCode == HttpStatusCode.BadRequest, "reject missing ingredient");
        Check((await client.PostAsJsonAsync("/api/admin/recipes", Recipe("Zero", Row(tofu.Id, 0)))).StatusCode == HttpStatusCode.BadRequest, "reject zero quantity");
        Check((await client.PostAsJsonAsync("/api/admin/recipes", Recipe("Precision", Row(tofu.Id, 0.0001m)))).StatusCode == HttpStatusCode.BadRequest, "reject excess precision");
        Check((await client.PostAsJsonAsync("/api/admin/recipes", Recipe("Empty"))).StatusCode == HttpStatusCode.BadRequest, "reject empty ingredients");
        var updated = await client.PutAsJsonAsync("/api/admin/recipes/" + recipe.Id, Recipe("Tofu rice", Row(tofu.Id, 200)));
        Check(updated.IsSuccessStatusCode && (await updated.Content.ReadFromJsonAsync<RecipeResponse>())!.Ingredients.Single().Quantity == 200, "replace ingredients and retain existing composite key");
        var restored = await client.PutAsJsonAsync("/api/admin/recipes/" + recipe.Id, Recipe("Tofu rice", Row(tofu.Id, 200), Row(rice.Id)));
        Check(restored.IsSuccessStatusCode, "re-add removed ingredient");
        await client.PostAsync("/api/admin/ingredients/" + tofu.Id + "/deactivate", null);
        Check((await client.GetAsync("/api/ingredients/" + tofu.Id)).StatusCode == HttpStatusCode.NotFound, "inactive ingredient hidden publicly");
        var detail = await client.GetFromJsonAsync<RecipeResponse>("/api/recipes/" + recipe.Id);
        Check(detail!.Ingredients.Any(x => x.IngredientId == tofu.Id && !x.IsActive), "existing recipe keeps inactive ingredient");
        Check((await client.PostAsJsonAsync("/api/admin/recipes", Recipe("Inactive", Row(tofu.Id)))).StatusCode == HttpStatusCode.BadRequest, "new recipe cannot use inactive ingredient");
        Check((await client.PutAsJsonAsync("/api/admin/recipes/" + recipe.Id, Recipe("Tofu rice", Row(tofu.Id, 300)))).IsSuccessStatusCode, "existing recipe can retain inactive reference");
        Check((await client.PatchAsync("/api/admin/categories/" + category.Id + "/deactivate", null)).StatusCode == HttpStatusCode.NoContent, "category PATCH deactivate 204");
        Check((await client.PutAsJsonAsync("/api/admin/recipes/" + recipe.Id, Recipe("Tofu rice", Row(tofu.Id, 300)))).IsSuccessStatusCode, "existing recipe can retain inactive category");
        Check((await client.PostAsJsonAsync("/api/admin/recipes", Recipe("Inactive category", Row(rice.Id)))).StatusCode == HttpStatusCode.BadRequest, "new recipe cannot use inactive category");
        var page = await client.GetFromJsonAsync<RecipePage>("/api/recipes?categoryId=" + category.Id + "&pageSize=1");
        Check(page!.Items.Count == 1 && page.TotalCount == 1, "category filter and pagination");
        Check((await client.GetFromJsonAsync<RecipePage>("/api/recipes?pageNumber=2147483647&pageSize=100"))!.Items.Count == 0, "large page avoids integer overflow");
        Check((await client.GetAsync("/api/recipes?pageSize=101")).StatusCode == HttpStatusCode.BadRequest, "invalid page size 400");
        Check((await client.GetFromJsonAsync<IngredientPage>("/api/admin/ingredients?search=bean"))!.TotalCount == 1, "alias search and admin inactive list");
        await client.PostAsync("/api/admin/recipes/" + recipe.Id + "/deactivate", null);
        Check((await client.GetAsync("/api/recipes/" + recipe.Id)).StatusCode == HttpStatusCode.NotFound, "inactive recipe detail hidden");
        Check((await client.GetFromJsonAsync<RecipePage>("/api/recipes"))!.TotalCount == 0, "inactive recipe excluded from public list");
        Check((await client.GetAsync("/api/admin/recipes/" + recipe.Id)).IsSuccessStatusCode, "Admin can inspect inactive recipe");
        Check((await client.PostAsync("/api/admin/recipes/" + recipe.Id + "/deactivate", null)).StatusCode == HttpStatusCode.NoContent, "deactivate idempotent");
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
