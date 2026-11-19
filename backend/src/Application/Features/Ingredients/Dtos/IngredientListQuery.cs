// BE2-03 | Tham số lọc, phân trang hoặc giới hạn kết quả (nguyên liệu: nguồn gốc, dị nguyên và dinh dưỡng theo đơn vị).
// Nhận bộ lọc và phân trang cho danh sách nguyên liệu, nguồn gốc, đơn vị và dinh dưỡng.
using System.ComponentModel.DataAnnotations;

namespace Application.Features.Ingredients;

// IngredientListQuery: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class IngredientListQuery
{
    [Range(1, int.MaxValue)]
    public int PageNumber { get; init; } = 1;
    [Range(1, 100)]
    public int PageSize { get; init; } = 20;
    [StringLength(120)]
    public string? Search { get; init; }
    public bool? IsActive { get; init; }

    [RegularExpression("^(plant|egg|milk|egg-milk)$")]
    public string? Component { get; init; }
}
