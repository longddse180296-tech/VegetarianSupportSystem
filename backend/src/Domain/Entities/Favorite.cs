// BE2-06 | Mô hình nghiệp vụ lưu mục yêu thích và chủ sở hữu.
// Lưu nội dung do người dùng lưu vào yêu thích.
using Domain.Enums;

namespace Domain.Entities;

// Favorite: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class Favorite
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserId { get; set; } = string.Empty;
    public FavoriteTargetType TargetType { get; set; }
    public Guid TargetId { get; set; }
    // Bản ghi trước khi có chức năng ghi nguồn giữ null; không suy đoán nguồn từ dữ liệu cũ.
    public FavoriteSaveSource? SavedFrom { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
