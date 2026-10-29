// Chức năng: phân tích ảnh món ăn và nhãn thành phần. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using Domain.Entities;
using Domain.Enums;

namespace Application.Features.FoodScanning;

// ScanProfileSnapshot: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record ScanProfileSnapshot(VegetarianDiet? Diet, IReadOnlyList<string> Allergies,
    DateTimeOffset? ProfileUpdatedAtUtc);
// ScanIngredientEvidence: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record ScanIngredientEvidence(Guid IngredientId, string Name, IngredientKind Kind,
    string? Source, string? Allergens);

// IFoodScanRepository: định nghĩa hợp đồng xử lý giữa các tầng.
public interface IFoodScanRepository
{
    // GetProfileAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<ScanProfileSnapshot> GetProfileAsync(string userId, CancellationToken ct);
    // FindIngredientEvidenceAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<IReadOnlyList<ScanIngredientEvidence>> FindIngredientEvidenceAsync(
        IReadOnlyList<string> names, CancellationToken ct);
    // AddAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    Task AddAsync(FoodScanRecord record, CancellationToken ct);
    // GetOwnedAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<FoodScanRecord?> GetOwnedAsync(Guid id, string userId, CancellationToken ct);
    // ListOwnedAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<(IReadOnlyList<FoodScanRecord> Items, int Total)> ListOwnedAsync(string userId,
        int page, int pageSize, CancellationToken ct);
}
