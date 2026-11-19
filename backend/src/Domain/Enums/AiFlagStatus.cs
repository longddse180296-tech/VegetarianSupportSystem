// Khai báo trạng thái kiểm tra hoặc gắn cờ nội dung của AI.
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
