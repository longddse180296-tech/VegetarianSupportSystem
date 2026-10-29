// Chức năng: hạ tầng và quy tắc dùng chung. Tầng Domain mô tả dữ liệu hoặc quy tắc nghiệp vụ, không phụ thuộc HTTP hay cơ sở dữ liệu.
namespace Domain.Enums;

// AdminReviewStatus: định nghĩa các giá trị trạng thái được phép.
public enum AdminReviewStatus
{
    Draft = 0,
    Submitted = 1,
    PendingAdminReview = 2,
    Published = 3,
    RevisionRequested = 4,
    Rejected = 5,
    Removed = 6
}
