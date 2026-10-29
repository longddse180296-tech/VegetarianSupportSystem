// Chức năng: quản trị tài khoản và thống kê hệ thống. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using Domain.Entities;

namespace Application.Features.Administration;

// IFeedbackRepository: định nghĩa hợp đồng xử lý giữa các tầng.
public interface IFeedbackRepository
{
    // AddAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    Task AddAsync(ContactFeedback feedback, CancellationToken ct);
    // ListAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<FeedbackPage> ListAsync(bool? isRead, int page, int pageSize, CancellationToken ct);
    // MarkReadAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    Task<bool> MarkReadAsync(Guid id, DateTimeOffset readAt, CancellationToken ct);
}
