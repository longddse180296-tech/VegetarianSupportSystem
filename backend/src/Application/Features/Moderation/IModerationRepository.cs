// Chức năng: kiểm duyệt nội dung và kết quả kiểm tra AI. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using Domain.Entities;

namespace Application.Features.Moderation;

// IModerationRepository: định nghĩa hợp đồng xử lý giữa các tầng.
public interface IModerationRepository
{
    // AuthorNamesAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    Task<IReadOnlyDictionary<string, string>> AuthorNamesAsync(IEnumerable<string> userIds, CancellationToken cancellationToken);
    // GetByIdAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<ModerationSubmission?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    // GetLatestForContentAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<ModerationSubmission?> GetLatestForContentAsync(Guid contentId, CancellationToken cancellationToken);
    // GetCurrentPublishedAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<ModerationSubmission?> GetCurrentPublishedAsync(Guid contentId, CancellationToken cancellationToken);
    // GetCheckingIdsAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<IReadOnlyList<Guid>> GetCheckingIdsAsync(int count, CancellationToken cancellationToken);
    // SearchAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<ModerationPage> SearchAsync(ModerationSearch search, CancellationToken cancellationToken);
    // AddAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    Task AddAsync(ModerationSubmission submission, CancellationToken cancellationToken);
    // SaveChangesAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    Task SaveChangesAsync(CancellationToken cancellationToken);
    // ExecuteInTransactionAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    Task ExecuteInTransactionAsync(Func<CancellationToken, Task> operation, CancellationToken cancellationToken);
}
