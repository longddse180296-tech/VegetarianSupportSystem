using System.Net;
using System.Net.Http.Json;
using Application.Features.Favorites;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CoreDataChecks;

// Kiểm tra lưu công thức và nguồn lưu trên database kiểm thử riêng; không tạo dữ liệu trong database của ứng dụng.
internal static class FavoriteSourceApiChecks
{
    public static async Task RunAsync(HttpClient client, AppDbContext db, Action<bool, string> check)
    {
        var oldRole = client.DefaultRequestHeaders.TryGetValues("Test-Role", out var roles) ? roles.ToArray() : [];
        var oldIds = client.DefaultRequestHeaders.TryGetValues("Test-UserId", out var ids) ? ids.ToArray() : [];
        void Caller(string id)
        {
            client.DefaultRequestHeaders.Remove("Test-Role"); client.DefaultRequestHeaders.Remove("Test-UserId");
            client.DefaultRequestHeaders.Add("Test-Role", "User"); client.DefaultRequestHeaders.Add("Test-UserId", id);
        }
        try
        {
            var recipe = await db.Recipes.AsNoTracking().FirstAsync(x => x.IsActive);
            Caller("favorite-source-owner");
            var request = new FavoriteRequest { TargetType = FavoriteTargetType.Recipe, TargetId = recipe.Id, SavedFrom = FavoriteSaveSource.Pantry };
            var response = await client.PostAsJsonAsync("/api/favorites", request);
            var saved = (await response.Content.ReadFromJsonAsync<FavoriteResponse>())!;
            check(response.StatusCode == HttpStatusCode.Created && saved.SavedFrom == FavoriteSaveSource.Pantry, "Pantry recipe save returns its source");
            check(await db.Favorites.AsNoTracking().AnyAsync(x => x.Id == saved.Id && x.SavedFrom == FavoriteSaveSource.Pantry && x.UserId == "favorite-source-owner"), "Favorite source and authenticated owner persist in SQL");
            var page = await client.GetFromJsonAsync<FavoritePage>("/api/favorites?targetType=Recipe");
            check(page!.Items.Single().SavedFrom == FavoriteSaveSource.Pantry, "Profile recipe tab reads persisted Pantry source");
            response = await client.PostAsJsonAsync("/api/favorites", new FavoriteRequest { TargetType = FavoriteTargetType.Recipe, TargetId = recipe.Id, SavedFrom = FavoriteSaveSource.Recipe });
            check(response.StatusCode == HttpStatusCode.Conflict && (await db.Favorites.AsNoTracking().SingleAsync(x => x.Id == saved.Id)).SavedFrom == FavoriteSaveSource.Pantry, "Duplicate save preserves original source");
            check((await client.PostAsJsonAsync("/api/favorites", new FavoriteRequest { TargetType = FavoriteTargetType.Recipe, TargetId = recipe.Id, SavedFrom = (FavoriteSaveSource)999 })).StatusCode == HttpStatusCode.BadRequest, "Invalid save source rejected");
            check((await client.PostAsJsonAsync("/api/favorites", new FavoriteRequest { TargetType = FavoriteTargetType.Restaurant, TargetId = recipe.Id, SavedFrom = FavoriteSaveSource.Pantry })).StatusCode == HttpStatusCode.BadRequest, "Recipe-only source cannot be attached to another target type");
            Caller("another-favorite-owner");
            check((await client.GetFromJsonAsync<FavoritePage>("/api/favorites?targetType=Recipe"))!.TotalCount == 0, "Saved recipes remain isolated between accounts");
            check((await client.DeleteAsync($"/api/favorites/{saved.Id}")).StatusCode == HttpStatusCode.NotFound, "Another account cannot remove the saved recipe");
            Caller("favorite-source-owner");
            check((await client.DeleteAsync($"/api/favorites/{saved.Id}")).StatusCode == HttpStatusCode.NoContent, "Recipe can be removed from profile saved list");
            response = await client.PostAsJsonAsync("/api/favorites", new FavoriteRequest { TargetType = FavoriteTargetType.Recipe, TargetId = recipe.Id });
            check((await response.Content.ReadFromJsonAsync<FavoriteResponse>())!.SavedFrom == FavoriteSaveSource.Recipe, "Saving again without source defaults to Recipe for existing clients");
            db.Favorites.Add(new Favorite { UserId = "legacy-favorite-owner", TargetType = FavoriteTargetType.Recipe, TargetId = recipe.Id });
            await db.SaveChangesAsync();
            Caller("legacy-favorite-owner");
            check((await client.GetFromJsonAsync<FavoritePage>("/api/favorites?targetType=Recipe"))!.Items.Single().SavedFrom is null, "Legacy unknown source is not fabricated");
        }
        finally
        {
            client.DefaultRequestHeaders.Remove("Test-Role"); client.DefaultRequestHeaders.Remove("Test-UserId");
            if (oldRole.Length > 0) client.DefaultRequestHeaders.Add("Test-Role", oldRole);
            if (oldIds.Length > 0) client.DefaultRequestHeaders.Add("Test-UserId", oldIds);
        }
    }
}
