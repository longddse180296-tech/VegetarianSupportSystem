// Chức năng: tủ bếp và nguyên liệu sẵn có. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
namespace Application.Features.Pantry;

// PantryRecipeIngredientStatus: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record PantryRecipeIngredientStatus(
    Guid IngredientId,
    string Name,
    decimal Quantity,
    string Unit,
    bool IsAvailable);
