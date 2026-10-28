// Chức năng: bài viết và phiên bản gửi duyệt. Ghép dữ liệu, thao tác và các trạng thái tải/lỗi cho màn hình.
import { ModerationWorkspace } from '../../moderation/components/ModerationWorkspace'
// Lấy hoặc lọc danh sách theo điều kiện và phạm vi hiện tại (AdminArticlesPage); thuộc bài viết và phiên bản gửi duyệt.
export const AdminArticlesPage = ({
  onNavigate,
}: {
  onNavigate?: (path: string) => void
}) => <ModerationWorkspace contentType="Article" onNavigate={onNavigate} />
export default AdminArticlesPage
