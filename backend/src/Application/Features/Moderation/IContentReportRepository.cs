// Chức năng: kiểm duyệt nội dung và kết quả kiểm tra AI. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using Domain.Entities;
using Domain.Enums;

namespace Application.Features.Moderation;

// IContentReportRepository: định nghĩa hợp đồng xử lý giữa các tầng.
public interface IContentReportRepository
{
    // GetPublicContentAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<ReportableContent?> GetPublicContentAsync(ModeratedContentType type, Guid id, CancellationToken ct);
    // HasPendingAsync: Đánh giá điều kiện nghiệp vụ để quyết định nhánh xử lý.
    Task<bool> HasPendingAsync(string reporter, ModeratedContentType type, Guid id, CancellationToken ct);
    // HasReportedAsync: Kiểm tra người dùng đã từng gửi báo cáo cho nội dung này chưa để chống spam.
    Task<bool> HasReportedAsync(string reporter, ModeratedContentType type, Guid id, CancellationToken ct);
    // AddAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    Task AddAsync(ContentReport report, CancellationToken ct);
    // GetAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<ContentReport?> GetAsync(Guid id, CancellationToken ct);
    // ListAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<ContentReportPage> ListAsync(ContentReportStatus? status, ModeratedContentType? type, int page, int pageSize, CancellationToken ct, bool groupByTarget = false);
    // GetPendingCountsAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<IReadOnlyDictionary<(ModeratedContentType Type, Guid TargetId), int>> GetPendingCountsAsync(
        IReadOnlyCollection<Guid> targetIds, CancellationToken ct);
    // SaveAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    Task SaveAsync(CancellationToken ct);
}
