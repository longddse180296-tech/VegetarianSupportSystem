// Chức năng: danh sách nội dung yêu thích. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using Domain.Entities;
using Domain.Enums;

namespace Application.Features.Favorites;

// IFavoriteRepository: định nghĩa hợp đồng xử lý giữa các tầng.
public interface IFavoriteRepository
{
    // ListAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<IReadOnlyList<Favorite>> ListAsync(string userId, FavoriteTargetType? targetType, CancellationToken ct);
    // GetAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<Favorite?> GetAsync(Guid id, string userId, CancellationToken ct);
    // ExistsAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    Task<bool> ExistsAsync(string userId, FavoriteTargetType targetType, Guid targetId, CancellationToken ct);
    // GetPublicTargetAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<FavoriteTargetInfo?> GetPublicTargetAsync(FavoriteTargetType targetType, Guid targetId, CancellationToken ct);
    // Add: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    void Add(Favorite favorite);
    // Remove: Xóa dữ liệu trong phạm vi cho phép và xử lý các liên kết liên quan.
    void Remove(Favorite favorite);
    // RemoveAllByTarget: Xóa dữ liệu trong phạm vi cho phép và xử lý các liên kết liên quan.
    void RemoveAllByTarget(FavoriteTargetType targetType, Guid targetId);
    // SaveAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    Task SaveAsync(CancellationToken ct);
}

// FavoriteTargetInfo: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record FavoriteTargetInfo(Guid Id, string Name, string? ImageUrl, double? DurationSeconds = null);
