// Chức năng: danh mục nguyên liệu và dữ liệu dinh dưỡng. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using Domain.Entities;

namespace Application.Features.Ingredients;

// IIngredientRepository: định nghĩa hợp đồng xử lý giữa các tầng.
public interface IIngredientRepository
{
    // ListAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<(IReadOnlyList<Ingredient> Items, int TotalCount)> ListAsync(IngredientListQuery query, bool includeInactive, CancellationToken ct);
    // GetAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<Ingredient?> GetAsync(Guid id, CancellationToken ct);
    // NameExistsAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    Task<bool> NameExistsAsync(string name, Guid? exceptId, CancellationToken ct);
    // Add: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    void Add(Ingredient entity);
    // SaveAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    Task SaveAsync(CancellationToken ct);
    // GetManyAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<IReadOnlyList<Ingredient>> GetManyAsync(IReadOnlyCollection<Guid> ids, CancellationToken ct);
}
