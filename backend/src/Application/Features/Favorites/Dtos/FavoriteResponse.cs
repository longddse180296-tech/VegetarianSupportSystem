// Chức năng: danh sách nội dung yêu thích. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
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
    double? DurationSeconds = null);
