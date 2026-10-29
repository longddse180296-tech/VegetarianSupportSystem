// Chức năng: danh mục nguyên liệu và dữ liệu dinh dưỡng. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using System.ComponentModel.DataAnnotations;
using Application.Common.Validation;
using Domain.Enums;

namespace Application.Features.Ingredients;

// IngredientRequest: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class IngredientRequest
{
    [Required, StringLength(120)]
    public string Name { get; init; } = string.Empty;
    [StringLength(1000)]
    public string? Aliases { get; init; }
    [EnumDataType(typeof(IngredientOrigin))]
    public IngredientOrigin Origin { get; init; }

    public bool ContainsEgg { get; init; }

    public bool ContainsMilk { get; init; }

    public bool ContainsHoney { get; init; }
    public bool? ContainsOtherAnimalProducts { get; init; }
    [StringLength(1000)]
    public string? Allergens { get; init; }
    [Required(ErrorMessage = "Vui lòng chọn đơn vị."), RegularExpression("^(g|kg|ml|đơn vị)$", ErrorMessage = "Chọn đơn vị g, kg, ml hoặc Số lượng.")]
    public string? DefaultUnit { get; init; }
    [Range(typeof(decimal), "0", "999999999", ParseLimitsInInvariantCulture = true)]
    [DecimalPrecision(3)]
    [Required(ErrorMessage = "Vui lòng nhập năng lượng.")]
    public decimal? Calories { get; init; }
    [Range(typeof(decimal), "0", "999999999", ParseLimitsInInvariantCulture = true)]
    [DecimalPrecision(3)]
    [Required(ErrorMessage = "Vui lòng nhập chất đạm.")]
    public decimal? ProteinGram { get; init; }
    [Range(typeof(decimal), "0", "999999999", ParseLimitsInInvariantCulture = true)]
    [DecimalPrecision(3)]
    [Required(ErrorMessage = "Vui lòng nhập tinh bột.")]
    public decimal? CarbohydrateGram { get; init; }
    [Range(typeof(decimal), "0", "999999999", ParseLimitsInInvariantCulture = true)]
    [DecimalPrecision(3)]
    [Required(ErrorMessage = "Vui lòng nhập chất béo.")]
    public decimal? FatGram { get; init; }
    [StringLength(1000)]
    public string? Source { get; init; }
}
