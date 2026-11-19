// BE2-08 | Dữ liệu đầu vào từ API (tủ bếp cá nhân và gợi ý từ nguyên liệu đang có).
// Nhận dữ liệu từ frontend để thực hiện thao tác với nguyên liệu và định lượng trong tủ bếp cá nhân.
using System.ComponentModel.DataAnnotations;
using Application.Common.Validation;

namespace Application.Features.Pantry;

// PantryItemRequest: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class PantryItemRequest
{
    public Guid? IngredientId { get; init; }

    [StringLength(120)]
    public string? Name { get; init; }

    [Range(typeof(decimal), "0.001", "999999999", ParseLimitsInInvariantCulture = true)]
    [DecimalPrecision(3)]
    public decimal? Quantity { get; init; }

    [StringLength(40)]
    public string? Unit { get; init; }
}
