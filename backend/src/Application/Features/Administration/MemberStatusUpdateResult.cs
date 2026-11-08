// Chức năng: quản trị tài khoản và thống kê hệ thống. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
namespace Application.Features.Administration;

// MemberStatusUpdateResult: định nghĩa các giá trị trạng thái được phép.
public enum MemberStatusUpdateResult { Updated, NotFound, AlreadyInState, SelfLock, LastAdmin, ActorInactive }
