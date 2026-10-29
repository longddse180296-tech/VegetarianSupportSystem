// Chức năng: kiểm duyệt nội dung và kết quả kiểm tra AI. Tầng Domain mô tả dữ liệu hoặc quy tắc nghiệp vụ, không phụ thuộc HTTP hay cơ sở dữ liệu.
namespace Domain.Enums;

// ModerationDecisionType: định nghĩa các giá trị trạng thái được phép.
public enum ModerationDecisionType
{
    Approve = 1,
    RequestRevision = 2,
    Reject = 3,
    Remove = 4
}
