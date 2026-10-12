using Application.Features.FoodScanning;
using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public sealed class FoodScanRepository(AppDbContext db) : IFoodScanRepository
{
    public async Task<ScanProfileSnapshot> GetProfileAsync(string userId, CancellationToken ct)
    {
        var profile = await db.UserProfiles.AsNoTracking().Include(x => x.Allergies)
            .FirstOrDefaultAsync(x => x.UserId == userId, ct);
        return profile is null ? new(null, [], null) : new(profile.Diet,
            profile.Allergies.Select(x => x.Name).ToArray(), profile.UpdatedAtUtc);
    }
    public async Task<IReadOnlyList<ScanIngredientEvidence>> FindIngredientEvidenceAsync(
        IReadOnlyList<string> names, CancellationToken ct)
    {
        var normalized = names.Select(x => x.Trim()).Where(x => x.Length > 0).Distinct().ToArray();
        var ingredients = await db.Ingredients.AsNoTracking()
            .Where(x => x.IsActive && normalized.Contains(x.Name))
            .ToArrayAsync(ct);
        return ingredients.Select(x => new ScanIngredientEvidence(x.Id, x.Name,
            x.Origin == IngredientOrigin.Animal || x.ContainsOtherAnimalProducts == true
                ? IngredientKind.Animal :
            x.ContainsEgg && !x.ContainsMilk && !x.ContainsHoney ? IngredientKind.Egg :
            x.ContainsMilk && !x.ContainsEgg && !x.ContainsHoney ? IngredientKind.Dairy :
            x.ContainsHoney && !x.ContainsEgg && !x.ContainsMilk ? IngredientKind.Honey :
            x.Origin == IngredientOrigin.Plant && x.ContainsOtherAnimalProducts == false &&
                !x.ContainsEgg && !x.ContainsMilk && !x.ContainsHoney ? IngredientKind.Plant :
            IngredientKind.Unknown, x.Source, x.Allergens)).ToArray();
    }
    public async Task AddAsync(FoodScanRecord record, CancellationToken ct)
    {
        await db.FoodScanRecords.AddAsync(record, ct);
        await db.SaveChangesAsync(ct);
    }
    public Task<FoodScanRecord?> GetOwnedAsync(Guid id, string userId, CancellationToken ct) =>
        db.FoodScanRecords.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id &&
            x.OwnerUserId == userId, ct);
    public async Task<(IReadOnlyList<FoodScanRecord> Items, int Total)> ListOwnedAsync(
        string userId, int page, int pageSize, CancellationToken ct)
    {
        var query = db.FoodScanRecords.AsNoTracking().Where(x => x.OwnerUserId == userId);
        var count = await query.CountAsync(ct);
        var items = await query.OrderByDescending(x => x.CreatedAtUtc)
            .Skip((page - 1) * pageSize).Take(pageSize).ToArrayAsync(ct);
        return (items, count);
    }
}
