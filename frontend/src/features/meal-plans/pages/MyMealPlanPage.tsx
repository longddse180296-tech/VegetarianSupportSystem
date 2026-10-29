// Chức năng: thực đơn bảy ngày và danh sách đi chợ. Ghép dữ liệu, thao tác và các trạng thái tải/lỗi cho màn hình.
import { MealPlanDetailPage } from './MealPlanDetailPage'

// Lấy hoặc lọc danh sách theo điều kiện và phạm vi hiện tại (MyMealPlanPage); thuộc thực đơn bảy ngày và danh sách đi chợ.
export const MyMealPlanPage = ({ onNavigate }: { onNavigate?: (path: string) => void }) => (
  <MealPlanDetailPage onNavigate={onNavigate} />
)
export default MyMealPlanPage
