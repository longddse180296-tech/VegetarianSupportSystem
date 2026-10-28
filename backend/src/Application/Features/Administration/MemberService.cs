// Chức năng: quản trị tài khoản và thống kê hệ thống. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
namespace Application.Features.Administration;

// MemberService: điều phối các bước nghiệp vụ và xử lý kết quả cho bên gọi.
public sealed class MemberService(IMemberRepository members)
{
    // ListAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public Task<MemberPage> ListAsync(string? search, bool? isLocked, int page, int pageSize, CancellationToken cancellationToken)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (search?.Trim().Length > 150) throw new ArgumentException("Từ khóa tối đa 150 ký tự.", nameof(search));
        ValidatePage(page, pageSize);
        return members.ListAsync(search?.Trim(), isLocked, page, pageSize, cancellationToken);
    }

    // FindAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public Task<MemberDetail?> FindAsync(string id, CancellationToken cancellationToken) =>
        members.FindAsync(id, cancellationToken);

    // HistoryAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public Task<MemberStatusPage?> HistoryAsync(string id, int page, int pageSize, CancellationToken cancellationToken)
    {
        ValidatePage(page, pageSize);
        return members.HistoryAsync(id, page, pageSize, cancellationToken);
    }

    // ChangeStatusAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public Task<MemberStatusUpdateResult> ChangeStatusAsync(
        string id, string adminId, bool lockAccount, string? reason, CancellationToken cancellationToken)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (string.IsNullOrWhiteSpace(reason) || reason.Trim().Length > 1_000)
            throw new ArgumentException("Lý do phải dài từ 1 đến 1000 ký tự.", nameof(reason));
        return members.ChangeStatusAsync(id, adminId, lockAccount, reason.Trim(), DateTimeOffset.UtcNow, cancellationToken);
    }

    // ValidatePage: Kiểm tra dữ liệu và điều kiện nghiệp vụ; dừng xử lý khi không hợp lệ.
    private static void ValidatePage(int page, int pageSize)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (page < 1 || pageSize is < 1 or > 100 || page > int.MaxValue / pageSize)
            throw new ArgumentException("Trang phải từ 1 và kích thước trang từ 1 đến 100.");
    }
}
