// BE2-06 | Hợp đồng lấy nội dung nổi bật và lưu trạng thái ghim.
// Quy định các thao tác truy xuất nội dung được Admin ghim nổi bật mà nghiệp vụ sử dụng.
using Domain.Enums;

namespace Application.Features.Administration;

// IFeaturedContentRepository: định nghĩa hợp đồng xử lý giữa các tầng.
public interface IFeaturedContentRepository
{
    // ListAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<FeaturedContentPage> ListAsync(FeaturedContentType contentType, string? search,
        bool pinnedOnly, int page, int pageSize, CancellationToken ct);
    // SetPinnedAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    Task SetPinnedAsync(FeaturedContentType contentType, Guid id, bool isPinned,
        string adminId, DateTimeOffset now, CancellationToken ct);
}
