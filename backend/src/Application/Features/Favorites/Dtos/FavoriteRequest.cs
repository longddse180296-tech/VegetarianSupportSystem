// BE2-06 | Dữ liệu đầu vào từ API (yêu thích: công thức, video và nhà hàng theo tài khoản).
// Nhận dữ liệu từ frontend để thực hiện thao tác với nội dung do người dùng lưu vào yêu thích.
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
