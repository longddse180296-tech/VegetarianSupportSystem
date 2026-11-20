// Biểu diễn một mục trong lịch sử trạng thái tài khoản và lịch sử khóa hoặc mở khóa.
namespace Application.Features.Administration;

// MemberStatusEntry: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record MemberStatusEntry(
    Guid Id, bool IsLocked, string Reason, string AdminId, string AdminName, DateTimeOffset OccurredAtUtc);
