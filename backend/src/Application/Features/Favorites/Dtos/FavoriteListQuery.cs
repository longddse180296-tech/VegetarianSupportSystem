// BE2-06 | Tham số lọc, phân trang hoặc giới hạn kết quả (yêu thích: công thức, video và nhà hàng theo tài khoản).
// Nhận bộ lọc và phân trang cho danh sách nội dung do người dùng lưu vào yêu thích.
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
