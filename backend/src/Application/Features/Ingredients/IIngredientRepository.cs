// BE2-03 | Hợp đồng đọc và ghi dữ liệu mà service sử dụng (nguyên liệu: nguồn gốc, dị nguyên và dinh dưỡng theo đơn vị).
// Quy định các thao tác truy xuất nguyên liệu, nguồn gốc, đơn vị và dinh dưỡng mà nghiệp vụ sử dụng.
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
