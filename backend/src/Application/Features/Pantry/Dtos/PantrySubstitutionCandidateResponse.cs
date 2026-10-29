// Chức năng: tủ bếp và nguyên liệu sẵn có. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using Domain.Enums;

namespace Application.Features.Pantry;

// PantrySubstitutionCandidateResponse: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record PantrySubstitutionCandidateResponse(
    Guid IngredientId,
    string Name,
    string? DefaultUnit,
    DietaryCompatibility? DietaryCompatibility,
    IReadOnlyList<string> AllergenWarnings,
    IReadOnlyList<string> AvoidedFoodWarnings);
