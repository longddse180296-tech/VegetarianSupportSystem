// BE2-08 | Dữ liệu trả về cho giao diện (tủ bếp cá nhân và gợi ý từ nguyên liệu đang có).
// Định nghĩa các trường API trả về cho nguyên liệu có thể thay thế khi nấu.
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
