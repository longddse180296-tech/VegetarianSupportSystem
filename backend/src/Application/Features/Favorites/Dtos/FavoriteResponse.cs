// BE2-06 | Dữ liệu trả về cho giao diện (yêu thích: công thức, video và nhà hàng theo tài khoản).
// Định nghĩa các trường API trả về cho nội dung do người dùng lưu vào yêu thích.
using Domain.Enums;

namespace Application.Features.Favorites;

// FavoriteResponse: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record FavoriteResponse(
    Guid Id,
    FavoriteTargetType TargetType,
    Guid TargetId,
    string TargetName,
    string? ImageUrl,
    DateTimeOffset CreatedAt,
    FavoriteSaveSource? SavedFrom = null,
    double? DurationSeconds = null,
    string? DietaryWarning = null);
