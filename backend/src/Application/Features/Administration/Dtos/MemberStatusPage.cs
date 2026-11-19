// Trả một trang trạng thái tài khoản và lịch sử khóa hoặc mở khóa kèm thông tin phân trang.
namespace Application.Features.Administration;

// MemberStatusPage: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record MemberStatusPage(
    IReadOnlyList<MemberStatusEntry> Items, int Page, int PageSize, int TotalCount);
