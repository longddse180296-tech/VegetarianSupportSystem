// Chức năng: video, bản nháp và nội dung công khai. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using Domain.Entities;

namespace Application.Features.Videos;

// IVideoRepository: định nghĩa hợp đồng xử lý giữa các tầng.
public interface IVideoRepository
{
    // GetAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<Video?> GetAsync(Guid id, CancellationToken cancellationToken);
    // CategoryExistsAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    Task<bool> CategoryExistsAsync(Guid id, CancellationToken cancellationToken);
    // ListAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<(IReadOnlyList<Video> Items, int Total)> ListAsync(string? owner, bool publishedOnly,
        int page, int pageSize, CancellationToken cancellationToken);
    // AddAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    Task AddAsync(Video video, CancellationToken cancellationToken);
    // SaveAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    Task SaveAsync(CancellationToken cancellationToken);
    // FavoriteCountAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    Task<int> FavoriteCountAsync(Guid id, CancellationToken cancellationToken);
    // AuthorNamesAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    Task<IReadOnlyDictionary<string, string>> AuthorNamesAsync(IEnumerable<string> authorIds, CancellationToken cancellationToken);
    // IncrementViewAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    Task IncrementViewAsync(Guid id, CancellationToken cancellationToken);
}

// IVideoPublication: định nghĩa hợp đồng xử lý giữa các tầng.
public interface IVideoPublication
{
    // ApplyDecisionAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    Task ApplyDecisionAsync(Guid videoId, Guid submissionId, bool published,
        CancellationToken cancellationToken);
}
