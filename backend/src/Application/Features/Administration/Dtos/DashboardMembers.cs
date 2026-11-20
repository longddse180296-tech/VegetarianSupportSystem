// Định nghĩa dữ liệu về số liệu tài khoản thành viên trên dashboard để các bước xử lý dùng chung.
namespace Application.Features.Administration;

// DashboardMembers: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record DashboardMembers(int Registered, int Active, int Locked);
