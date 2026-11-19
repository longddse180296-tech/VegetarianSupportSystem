// BE2-06 | Kết quả danh sách và thông tin phân trang (yêu thích: công thức, video và nhà hàng theo tài khoản).
// Trả một trang nội dung do người dùng lưu vào yêu thích kèm thông tin phân trang.
namespace Application.Features.Favorites;

// FavoritePage: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record FavoritePage(
    IReadOnlyList<FavoriteResponse> Items,
    int TotalCount,
    int PageNumber,
    int PageSize);
