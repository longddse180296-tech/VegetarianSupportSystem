// BE2-08 | Dữ liệu trả về cho giao diện (tủ bếp cá nhân và gợi ý từ nguyên liệu đang có).
// Định nghĩa dữ liệu về mức đáp ứng của tủ bếp cho từng nguyên liệu trong công thức để các bước xử lý dùng chung.
namespace Application.Features.Pantry;

// PantryRecipeIngredientStatus: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record PantryRecipeIngredientStatus(
    Guid IngredientId,
    string Name,
    decimal Quantity,
    string Unit,
    bool IsAvailable);
