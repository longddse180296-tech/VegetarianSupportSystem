// Chức năng: quản trị tài khoản và thống kê hệ thống. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
namespace Application.Features.Administration;

// IMemberRepository: định nghĩa hợp đồng xử lý giữa các tầng.
public interface IMemberRepository
{
    // ListAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<MemberPage> ListAsync(string? search, bool? isLocked, int page, int pageSize, CancellationToken cancellationToken);
    // FindAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<MemberDetail?> FindAsync(string id, CancellationToken cancellationToken);
    // HistoryAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    Task<MemberStatusPage?> HistoryAsync(string id, int page, int pageSize, CancellationToken cancellationToken);
    // ChangeStatusAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    Task<MemberStatusUpdateResult> ChangeStatusAsync(string id, string adminId, bool lockAccount, string reason, DateTimeOffset now, CancellationToken cancellationToken);
}
