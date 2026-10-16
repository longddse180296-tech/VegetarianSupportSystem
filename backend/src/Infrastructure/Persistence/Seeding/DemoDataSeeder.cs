using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Seeding;

public static class DemoDataSeeder
{
    public static async Task SeedAsync(AppDbContext db, CancellationToken ct = default)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        var categories = DemoDataCatalog.Categories();
        var ingredients = DemoDataCatalog.Ingredients();
        var recipes = DemoDataCatalog.Recipes(ingredients.ToDictionary(x => x.Id));
        var restaurants = DemoRestaurantCatalog.Restaurants();

        // Only insert missing IDs: never overwrite renamed, edited, or deactivated demo data.
        var categoryIds = await db.Categories.Select(x => x.Id).ToListAsync(ct);
        var ingredientIds = await db.Ingredients.Select(x => x.Id).ToListAsync(ct);
        var recipeIds = await db.Recipes.Select(x => x.Id).ToListAsync(ct);
        db.Categories.AddRange(categories.Where(x => !categoryIds.Contains(x.Id)));
        db.Ingredients.AddRange(ingredients.Where(x => !ingredientIds.Contains(x.Id)));
        await db.SaveChangesAsync(ct);
        db.Recipes.AddRange(recipes.Where(x => !recipeIds.Contains(x.Id)));
        await db.SaveChangesAsync(ct);
        var restaurantIds = await db.Restaurants.Select(x => x.Id).ToListAsync(ct);
        db.Restaurants.AddRange(restaurants.Where(x => !restaurantIds.Contains(x.Id)));
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
    }
}
