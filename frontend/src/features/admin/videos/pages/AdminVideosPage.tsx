// Chức năng: video, bản nháp và nội dung công khai. Ghép dữ liệu, thao tác và các trạng thái tải/lỗi cho màn hình.
import { ModerationWorkspace } from '../../moderation/components/ModerationWorkspace'
// Lấy hoặc lọc danh sách theo điều kiện và phạm vi hiện tại (AdminVideosPage); thuộc video, bản nháp và nội dung công khai.
export const AdminVideosPage = ({
  onNavigate,
}: {
  onNavigate?: (path: string) => void
}) => <ModerationWorkspace contentType="Video" onNavigate={onNavigate} />
export default AdminVideosPage
