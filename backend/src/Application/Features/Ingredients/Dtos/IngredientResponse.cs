// BE2-03 | Dữ liệu trả về cho giao diện (nguyên liệu: nguồn gốc, dị nguyên và dinh dưỡng theo đơn vị).
// Định nghĩa các trường API trả về cho nguyên liệu, nguồn gốc, đơn vị và dinh dưỡng.

namespace Application.Features.Ingredients;

// IngredientResponse: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record IngredientResponse(
    Guid Id,
    string Name,
    string? Aliases,
    bool ContainsEgg,
    bool ContainsMilk,
    bool ContainsHoney,
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
