// Khai báo các quyết định mà Admin có thể ghi cho hồ sơ gửi duyệt.
namespace Domain.Enums;

// ModerationDecisionType: định nghĩa các giá trị trạng thái được phép.
public enum ModerationDecisionType
{
    Approve = 1,
    RequestRevision = 2,
    Reject = 3,
    Remove = 4
}
