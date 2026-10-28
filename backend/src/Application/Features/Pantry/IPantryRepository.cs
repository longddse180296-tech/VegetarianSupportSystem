// Chức năng: tủ bếp và nguyên liệu sẵn có. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using Domain.Entities;

namespace Application.Features.Pantry;

// IPantryRepository: định nghĩa hợp đồng xử lý giữa các tầng.
public interface IPantryRepository
{
    // ListAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<IReadOnlyList<PantryItem>> ListAsync(string userId, CancellationToken ct);
    // GetAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<PantryItem?> GetAsync(Guid id, string userId, CancellationToken ct);
    // GetActiveIngredientAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<Ingredient?> GetActiveIngredientAsync(Guid id, CancellationToken ct);
    // FindActiveIngredientByNameOrAliasAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<Ingredient?> FindActiveIngredientByNameOrAliasAsync(string name, CancellationToken ct);
    // HasIngredientAsync: Đánh giá điều kiện nghiệp vụ để quyết định nhánh xử lý.
    Task<bool> HasIngredientAsync(string userId, Guid ingredientId, Guid? exceptId, CancellationToken ct);
    // HasCustomNameAsync: Đánh giá điều kiện nghiệp vụ để quyết định nhánh xử lý.
    Task<bool> HasCustomNameAsync(string userId, string name, Guid? exceptId, CancellationToken ct);
    // GetProfileAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<UserProfile?> GetProfileAsync(string userId, CancellationToken ct);
    // GetActiveRecipesAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<IReadOnlyList<Recipe>> GetActiveRecipesAsync(CancellationToken ct);
    // GetActiveIngredientsWithUnitAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<IReadOnlyList<Ingredient>> GetActiveIngredientsWithUnitAsync(string unit, CancellationToken ct);
    // Add: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    void Add(PantryItem item);
    // Remove: Xóa dữ liệu trong phạm vi cho phép và xử lý các liên kết liên quan.
    void Remove(PantryItem item);
    // SaveAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    Task SaveAsync(CancellationToken ct);
}
