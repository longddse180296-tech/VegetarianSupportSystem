// Trả thông tin chi tiết về tài khoản thành viên trong màn hình quản trị.
namespace Application.Features.Administration;

// MemberDetail: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record MemberDetail(
    string Id, string FullName, string Email, string Role, DateTimeOffset JoinedAtUtc,
    bool IsLocked, string? CurrentLockReason, DateTimeOffset? LockedAtUtc);
