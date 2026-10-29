// Chức năng: danh sách nội dung yêu thích. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
namespace Application.Features.Favorites;

// FavoritePage: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record FavoritePage(
    IReadOnlyList<FavoriteResponse> Items,
    int TotalCount,
    int PageNumber,
    int PageSize);
