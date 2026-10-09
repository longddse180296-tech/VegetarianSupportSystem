using Domain.Enums;

namespace Application.Features.Pantry;

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
