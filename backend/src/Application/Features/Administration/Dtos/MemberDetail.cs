// Chức năng: quản trị tài khoản và thống kê hệ thống. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
namespace Application.Features.Administration;

// MemberDetail: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record MemberDetail(
    string Id, string FullName, string Email, string Role, DateTimeOffset JoinedAtUtc,
    bool IsLocked, string? CurrentLockReason, DateTimeOffset? LockedAtUtc);
