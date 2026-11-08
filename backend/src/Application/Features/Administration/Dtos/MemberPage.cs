// Chức năng: quản trị tài khoản và thống kê hệ thống. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
namespace Application.Features.Administration;

// MemberPage: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record MemberPage(
    IReadOnlyList<MemberSummary> Items, int Page, int PageSize, int TotalCount,
    int ActiveCount, int LockedCount);
