// Trả một trang tài khoản thành viên trong màn hình quản trị kèm thông tin phân trang.
namespace Application.Features.Administration;

// MemberPage: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record MemberPage(
    IReadOnlyList<MemberSummary> Items, int Page, int PageSize, int TotalCount,
    int ActiveCount, int LockedCount);
