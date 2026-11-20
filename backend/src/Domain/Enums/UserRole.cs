// Khai báo vai trò tài khoản dùng để phân quyền.
namespace Domain.Enums;

// Guest is an unauthenticated request, not a persisted account role.
// UserRole: định nghĩa các giá trị trạng thái được phép.
public enum UserRole
{
    User,
    Admin
}
