// Trả kết quả cập nhật trạng thái tài khoản để API chọn phản hồi phù hợp.
namespace Application.Features.Administration;

// MemberStatusUpdateResult: định nghĩa các giá trị trạng thái được phép.
public enum MemberStatusUpdateResult { Updated, NotFound, AlreadyInState, SelfLock, LastAdmin, ActorInactive }
