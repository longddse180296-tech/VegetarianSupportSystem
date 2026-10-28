// Chức năng: quản lý thành viên. Tầng Domain mô tả dữ liệu hoặc quy tắc nghiệp vụ, không phụ thuộc HTTP hay cơ sở dữ liệu.
namespace Domain.Entities;

// MemberStatusChange: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class MemberStatusChange
{
    private MemberStatusChange() { }

    private MemberStatusChange(string userId, string adminId, bool isLocked, string reason, DateTimeOffset occurredAtUtc)
    {
        Id = Guid.NewGuid();
        UserId = userId;
        AdminId = adminId;
        IsLocked = isLocked;
        Reason = reason;
        OccurredAtUtc = occurredAtUtc;
    }

    public Guid Id { get; private set; }
    public string UserId { get; private set; } = string.Empty;
    public string AdminId { get; private set; } = string.Empty;
    public bool IsLocked { get; private set; }
    public string Reason { get; private set; } = string.Empty;
    public DateTimeOffset OccurredAtUtc { get; private set; }

    // Create: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public static MemberStatusChange Create(string userId, string adminId, bool isLocked, string reason, DateTimeOffset occurredAtUtc)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(adminId))
            throw new ArgumentException("Chưa xác định được thành viên hoặc Quản trị viên thực hiện thao tác.");
        if (string.IsNullOrWhiteSpace(reason) || reason.Trim().Length > 1_000)
            throw new ArgumentException("Reason is required and must be at most 1000 characters.", nameof(reason));
        return new MemberStatusChange(userId, adminId, isLocked, reason.Trim(), occurredAtUtc);
    }
}
