// Định nghĩa các trạng thái xử lý của Admin trong vòng đời nội dung.
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
