// Chức năng: tủ bếp và nguyên liệu sẵn có. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
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
