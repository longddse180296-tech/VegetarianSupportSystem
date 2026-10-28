// Chức năng: danh sách nội dung yêu thích. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using System.ComponentModel.DataAnnotations;
using Domain.Enums;

namespace Application.Features.Favorites;

// FavoriteRequest: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class FavoriteRequest
{
    [Required]
    public FavoriteTargetType? TargetType { get; init; }

    public Guid TargetId { get; init; }
    public FavoriteSaveSource? SavedFrom { get; init; }
}
