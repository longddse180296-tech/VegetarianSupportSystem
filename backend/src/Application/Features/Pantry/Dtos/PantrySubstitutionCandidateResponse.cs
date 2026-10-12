using Domain.Enums;

namespace Application.Features.Pantry;

public sealed record PantrySubstitutionCandidateResponse(
    Guid IngredientId,
    string Name,
    string? DefaultUnit,
    DietaryCompatibility? DietaryCompatibility,
    IReadOnlyList<string> AllergenWarnings,
    IReadOnlyList<string> AvoidedFoodWarnings);
