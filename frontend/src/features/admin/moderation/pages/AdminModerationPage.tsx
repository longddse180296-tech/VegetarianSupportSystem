// Chức năng: kiểm duyệt nội dung và kết quả kiểm tra AI. Ghép dữ liệu, thao tác và các trạng thái tải/lỗi cho màn hình.
import { useEffect } from 'react'

// Preserve old bookmarks without mounting a combined moderation queue.
// Lấy hoặc lọc danh sách theo điều kiện và phạm vi hiện tại (AdminModerationPage); thuộc kiểm duyệt nội dung và kết quả kiểm tra AI.
export const AdminModerationPage = ({
  onNavigate,
}: {
  onNavigate?: (path: string) => void
}) => {
  // Đồng bộ trạng thái hoặc tác động bên ngoài khi các phụ thuộc thay đổi.
  useEffect(() => {
    if (onNavigate) onNavigate('/admin/articles')
    else window.location.hash = '/admin/articles'
  }, [onNavigate])
  return null
}
export default AdminModerationPage
