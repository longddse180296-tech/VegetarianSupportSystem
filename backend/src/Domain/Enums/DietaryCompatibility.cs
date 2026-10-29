// Chức năng: hạ tầng và quy tắc dùng chung. Tầng Domain mô tả dữ liệu hoặc quy tắc nghiệp vụ, không phụ thuộc HTTP hay cơ sở dữ liệu.
namespace Domain.Enums;

// DietaryCompatibility: định nghĩa các giá trị trạng thái được phép.
public enum DietaryCompatibility
{
    Unknown = 0,
    Compatible = 1,
    Incompatible = 2
}
