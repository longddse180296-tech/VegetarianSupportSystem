using Domain.Entities;
using Domain.Enums;

namespace Application.Features.FoodScanning;

public sealed record ScanProfileSnapshot(VegetarianDiet? Diet, IReadOnlyList<string> Allergies,
    DateTimeOffset? ProfileUpdatedAtUtc);
public sealed record ScanIngredientEvidence(Guid IngredientId, string Name, IngredientKind Kind,
    string? Source, string? Allergens);

public interface IFoodScanRepository
{
    Task<ScanProfileSnapshot> GetProfileAsync(string userId, CancellationToken ct);
    Task<IReadOnlyList<ScanIngredientEvidence>> FindIngredientEvidenceAsync(
        IReadOnlyList<string> names, CancellationToken ct);
    Task AddAsync(FoodScanRecord record, CancellationToken ct);
    Task<FoodScanRecord?> GetOwnedAsync(Guid id, string userId, CancellationToken ct);
    Task<(IReadOnlyList<FoodScanRecord> Items, int Total)> ListOwnedAsync(string userId,
        int page, int pageSize, CancellationToken ct);
}
