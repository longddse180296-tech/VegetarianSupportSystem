// BE2-01/04 | Hợp đồng đọc và ghi dữ liệu mà service sử dụng (công thức: bộ lọc public, định lượng và dinh dưỡng theo khẩu phần).
// Quy định các thao tác truy xuất công thức, số khẩu phần, nguyên liệu và hướng dẫn nấu mà nghiệp vụ sử dụng.
using Domain.Entities;

namespace Application.Features.Recipes;

// IRecipeRepository: định nghĩa hợp đồng xử lý giữa các tầng.
public interface IRecipeRepository
{
    // ListAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<(IReadOnlyList<Recipe> Items, int TotalCount)> ListAsync(RecipeListQuery query, bool includeInactive, CancellationToken ct);
    // GetAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<Recipe?> GetAsync(Guid id, CancellationToken ct);
    // NameExistsAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    Task<bool> NameExistsAsync(string name, Guid? exceptId, CancellationToken ct);
    // Add: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    void Add(Recipe entity);
    // SaveAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    Task SaveAsync(CancellationToken ct);
}
