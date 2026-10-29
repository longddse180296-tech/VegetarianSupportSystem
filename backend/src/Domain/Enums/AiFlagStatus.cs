// Chức năng: hạ tầng và quy tắc dùng chung. Tầng Domain mô tả dữ liệu hoặc quy tắc nghiệp vụ, không phụ thuộc HTTP hay cơ sở dữ liệu.
namespace Domain.Enums;

// AiFlagStatus: định nghĩa các giá trị trạng thái được phép.
public enum AiFlagStatus
{
    NotSubmitted = 0,
    Checking = 1,
    Passed = 2,
    Flagged = 3,
    Partial = 4,
    Failed = 5
}
