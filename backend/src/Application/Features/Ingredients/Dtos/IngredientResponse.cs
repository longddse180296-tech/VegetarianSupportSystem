// Chức năng: danh mục nguyên liệu và dữ liệu dinh dưỡng. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using Domain.Enums;

namespace Application.Features.Ingredients;

// IngredientResponse: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record IngredientResponse(
    Guid Id,
    string Name,
    string? Aliases,
    IngredientOrigin Origin,
    bool ContainsEgg,
    bool ContainsMilk,
    bool ContainsHoney,
    bool? ContainsOtherAnimalProducts,
    string? Allergens,
    string? DefaultUnit,
    decimal? CaloriesPer100Gram,
    decimal? ProteinGramPer100Gram,
    decimal? CarbohydrateGramPer100Gram,
    decimal? FatGramPer100Gram,
    string? Source,
    bool IsActive, DateTimeOffset CreatedAt, DateTimeOffset? UpdatedAt,
    decimal? Calories, decimal? ProteinGram, decimal? CarbohydrateGram, decimal? FatGram,
    decimal NutritionBasisQuantity, string NutritionBasisUnit);
