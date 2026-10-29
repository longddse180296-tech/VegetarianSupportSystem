// Chức năng: danh sách nội dung yêu thích. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using System.ComponentModel.DataAnnotations;
using Domain.Enums;

namespace Application.Features.Favorites;

// FavoriteListQuery: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class FavoriteListQuery
{
    public FavoriteTargetType? TargetType { get; init; }

    [Range(1, int.MaxValue)]
    public int PageNumber { get; init; } = 1;

    [Range(1, 100)]
    public int PageSize { get; init; } = 20;
}
