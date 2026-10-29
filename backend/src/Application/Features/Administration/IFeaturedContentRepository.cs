// Chức năng: quản trị tài khoản và thống kê hệ thống. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
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
