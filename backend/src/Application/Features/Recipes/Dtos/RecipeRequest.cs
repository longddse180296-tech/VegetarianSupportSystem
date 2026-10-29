// Chức năng: công thức và định lượng nguyên liệu. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using System.ComponentModel.DataAnnotations;
using Application.Common.Validation;
using Domain.Enums;

namespace Application.Features.Recipes;

// RecipeRequest: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class RecipeRequest
{

    public Guid CategoryId { get; init; }
    [Required, StringLength(120)]
    public string Name { get; init; } = string.Empty;
    [StringLength(2000)]
    public string? Description { get; init; }
    [Required(ErrorMessage = "Vui lòng nhập khẩu phần."), Range(1, 10000)]
    public int? Servings { get; init; }
    [Required, StringLength(20000)]
    public string Instructions { get; init; } = string.Empty;
    [Required(ErrorMessage = "Vui lòng nhập thời gian chuẩn bị."), Range(0, 10080)]
    public int? PrepTimeMinutes { get; init; }
    [Required(ErrorMessage = "Vui lòng nhập thời gian nấu."), Range(0, 10080)]
    public int? CookTimeMinutes { get; init; }
    [Required(ErrorMessage = "Vui lòng thêm ảnh đại diện."), StringLength(2048)]
    public string? ImageUrl { get; init; }
    [Range(typeof(decimal), "0", "999999999", ParseLimitsInInvariantCulture = true)]
    [DecimalPrecision(3)]
    public decimal? CaloriesPerServing { get; init; }
    [Range(typeof(decimal), "0", "999999999", ParseLimitsInInvariantCulture = true)]
    [DecimalPrecision(3)]
    public decimal? ProteinGramPerServing { get; init; }
    [Range(typeof(decimal), "0", "999999999", ParseLimitsInInvariantCulture = true)]
    [DecimalPrecision(3)]
    public decimal? CarbohydrateGramPerServing { get; init; }
    [Range(typeof(decimal), "0", "999999999", ParseLimitsInInvariantCulture = true)]
    [DecimalPrecision(3)]
    public decimal? FatGramPerServing { get; init; }
    [Required]
    public DietaryType? DeclaredDietaryType { get; init; }
    [Required, MinLength(1), MaxLength(200)]
    public RecipeIngredientRequest[] Ingredients { get; init; } = [];
}
