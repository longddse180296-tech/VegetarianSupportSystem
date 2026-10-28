using System.Net;
using System.Net.Http.Json;
using Application.Features.Ingredients;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Application.Features.Recipes;

namespace CoreDataChecks;

internal static class IngredientNutritionChecks
{
    public static async Task RunAsync(HttpClient client, AppDbContext db, Action<bool, string> check)
    {
        client.DefaultRequestHeaders.Remove("Test-Role");
        client.DefaultRequestHeaders.Add("Test-Role", "Admin");
        IngredientRequest Input(string name, string? unit) => new()
        {
            Name = name, DefaultUnit = unit, Calories = 123.456m,
            ProteinGram = 10, CarbohydrateGram = 20, FatGram = 0
        };

        foreach (var unit in new[] { "g", "kg", "ml", "đơn vị" })
        {
            var name = "Nutrition basis check " + unit;
            var result = await client.PostAsJsonAsync("/api/admin/ingredients", Input(name, unit));
            check(result.StatusCode == HttpStatusCode.Created, "create required nutrition with unit " + unit);
            var created = (await result.Content.ReadFromJsonAsync<IngredientResponse>())!;
            var detail = (await client.GetFromJsonAsync<IngredientResponse>("/api/admin/ingredients/" + created.Id))!;
            check(detail.NutritionBasisUnit == unit && detail.NutritionBasisQuantity == (unit is "g" or "ml" ? 100 : 1) &&
                detail.Calories == 123.456m && detail.FatGram == 0,
                "nutrition basis and explicit zero round-trip: " + unit);
            check(unit is "ml" or "đơn vị" ? detail.CaloriesPer100Gram is null : detail.CaloriesPer100Gram is not null,
                "do not infer grams from volume/count: " + unit);
            if (unit is "ml" or "đơn vị")
            {
                // Dữ liệu đi qua API lưu DB rồi dùng chính entity đã lưu để tính, không dựng mốc dinh dưỡng khác.
                var persisted = await db.Ingredients.AsNoTracking().SingleAsync(item => item.Id == created.Id);
                var amount = unit == "ml" ? 250m : 2m;
                var nutrition = RecipeNutritionService.Calculate(new() {Servings=2, Ingredients=[new(){IngredientId=created.Id,Quantity=amount,Unit=unit}]},[persisted]);
                check(nutrition.IsComplete && nutrition.CaloriesPerServing == (unit == "ml" ? 154.32m : 123.456m),
                    "API-stored volume/count calculates directly without grams: " + unit);
            }
            check((await client.PutAsJsonAsync("/api/admin/ingredients/" + created.Id, Input(name, unit))).IsSuccessStatusCode,
                "updating same ingredient name remains allowed: " + unit);
            var duplicate = await client.PostAsJsonAsync("/api/admin/ingredients", Input("  " + name.ToUpperInvariant() + "  ", unit));
            check(duplicate.StatusCode == HttpStatusCode.Conflict &&
                (await duplicate.Content.ReadAsStringAsync()).Contains("Tên nguyên liệu đã tồn tại"),
                "duplicate name is rejected with Vietnamese message: " + unit);
            await client.PostAsync("/api/admin/ingredients/" + created.Id + "/deactivate", null);
            check((await client.PostAsJsonAsync("/api/admin/ingredients", Input(name, unit))).StatusCode == HttpStatusCode.Conflict,
                "inactive ingredient name is still reserved: " + unit);
        }

        foreach (var unit in new string?[] { null, "", "quả" })
            check((await client.PostAsJsonAsync("/api/admin/ingredients", Input("Invalid unit check", unit))).StatusCode == HttpStatusCode.BadRequest,
                "missing or unsupported unit is rejected: " + (unit ?? "null"));

        foreach (var field in new[] { "calories", "proteinGram", "carbohydrateGram", "fatGram" })
        {
            var payload = new Dictionary<string, object?>
            {
                ["name"] = "Missing nutrition check", ["defaultUnit"] = "g",
                ["calories"] = 1m, ["proteinGram"] = 0m, ["carbohydrateGram"] = 0m, ["fatGram"] = 0m
            };
            payload.Remove(field);
            check((await client.PostAsJsonAsync("/api/admin/ingredients", payload)).StatusCode == HttpStatusCode.BadRequest,
                "each nutrient is required: " + field);
        }
    }
}
