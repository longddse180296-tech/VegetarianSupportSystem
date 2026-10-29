// Chức năng: hạ tầng và quy tắc dùng chung. Tầng Domain mô tả dữ liệu hoặc quy tắc nghiệp vụ, không phụ thuộc HTTP hay cơ sở dữ liệu.
namespace Domain.Enums;

// Guest is an unauthenticated request, not a persisted account role.
// UserRole: định nghĩa các giá trị trạng thái được phép.
public enum UserRole
{
    User,
    Admin
}
