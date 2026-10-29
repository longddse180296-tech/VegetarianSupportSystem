// Chức năng: tủ bếp và nguyên liệu sẵn có. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using System.ComponentModel.DataAnnotations;

namespace Application.Features.Pantry;

// PantryRecipeSuggestionQuery: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class PantryRecipeSuggestionQuery
{
    [Range(1, 50)]
    public int Limit { get; init; } = 20;
}
