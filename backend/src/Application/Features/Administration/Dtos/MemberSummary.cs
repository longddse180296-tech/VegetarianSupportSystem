// Trả thông tin rút gọn về tài khoản thành viên trong màn hình quản trị để hiển thị trong danh sách.
namespace Application.Features.Administration;

// MemberSummary: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record MemberSummary(
    string Id, string FullName, string Email, string Role, DateTimeOffset JoinedAtUtc, bool IsLocked);
