// BE2-08 | Dữ liệu trả về cho giao diện (tủ bếp cá nhân và gợi ý từ nguyên liệu đang có).
// Định nghĩa các trường API trả về cho nguyên liệu và định lượng trong tủ bếp cá nhân.
using Domain.Enums;

namespace Application.Features.Pantry;

// PantryItemResponse: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record PantryItemResponse(
    Guid Id,
    Guid? IngredientId,
    string Name,
    bool IsCatalogMatched,
    decimal? Quantity,
    string? Unit,
    VegetarianDiet? ProfileDiet,
    DietaryCompatibility? DietaryCompatibility,
    string? DietaryNotice,
    IReadOnlyList<string> AllergenWarnings,
    IReadOnlyList<string> AvoidedFoodWarnings,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt);
