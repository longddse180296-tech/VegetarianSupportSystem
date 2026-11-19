// BE2-09 | Hợp đồng đọc và ghi dữ liệu mà service sử dụng (thực đơn tuần, dinh dưỡng, danh sách mua và PDF).
// Quy định các thao tác truy xuất thực đơn theo ngày và bữa cùng danh sách mua sắm mà nghiệp vụ sử dụng.
using Domain.Entities;

namespace Application.Features.MealPlans;
// IMealPlanRepository: định nghĩa hợp đồng xử lý giữa các tầng.
public interface IMealPlanRepository
{
    // GetProfileAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<UserProfile?> GetProfileAsync(string userId, CancellationToken ct);
    // GetActiveRecipesAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<IReadOnlyList<Recipe>> GetActiveRecipesAsync(CancellationToken ct);
    Task<IReadOnlyDictionary<Guid, DateOnly>> GetRecipeUsageAsync(string userId, DateOnly beforeDate, CancellationToken ct);
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
    // Kiểm tra và lưu lịch mới nguyên tử, chặn khoảng 7 ngày trùng lịch của cùng tài khoản.
    Task SaveNewAsync(MealPlan plan, CancellationToken ct);
    // Remove: Xóa dữ liệu trong phạm vi cho phép và xử lý các liên kết liên quan.
    void Remove(MealPlan plan);
    // SaveAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    Task SaveAsync(CancellationToken ct);
}
