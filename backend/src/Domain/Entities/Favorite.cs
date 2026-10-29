// Chức năng: danh sách nội dung yêu thích. Tầng Domain mô tả dữ liệu hoặc quy tắc nghiệp vụ, không phụ thuộc HTTP hay cơ sở dữ liệu.
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
