// Chức năng: thực đơn bảy ngày và danh sách đi chợ. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using Domain.Entities;

namespace Application.Features.MealPlans;
// IMealPlanRepository: định nghĩa hợp đồng xử lý giữa các tầng.
public interface IMealPlanRepository
{
    // GetProfileAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<UserProfile?> GetProfileAsync(string userId, CancellationToken ct);
    // GetActiveRecipesAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<IReadOnlyList<Recipe>> GetActiveRecipesAsync(CancellationToken ct);
    // GetRecipeImagesAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<IReadOnlyDictionary<Guid, string?>> GetRecipeImagesAsync(IReadOnlyCollection<Guid> recipeIds, CancellationToken ct);
    // GetPantryAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<IReadOnlyList<PantryItem>> GetPantryAsync(string userId, CancellationToken ct);
    // GetAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<MealPlan?> GetAsync(Guid id, string userId, CancellationToken ct);
    // ListAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<(IReadOnlyList<MealPlan> Items, int TotalCount)> ListAsync(string userId, MealPlanListQuery query, CancellationToken ct);
    // GetUsableRecipeAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<Recipe?> GetUsableRecipeAsync(Guid id, CancellationToken ct);
    // Add: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    void Add(MealPlan plan);
    // Remove: Xóa dữ liệu trong phạm vi cho phép và xử lý các liên kết liên quan.
    void Remove(MealPlan plan);
    // SaveAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    Task SaveAsync(CancellationToken ct);
}
