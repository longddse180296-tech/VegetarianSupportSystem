// Chức năng: thực đơn bảy ngày và danh sách đi chợ. Ghép dữ liệu, thao tác và các trạng thái tải/lỗi cho màn hình.
import React from 'react'
import { MealPlanDetailPage } from './MealPlanDetailPage'

// Cấu trúc MealPlanDetailProps quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
export interface MealPlanDetailProps {
  onNavigate?: (path: string) => void
  planId?: string
}

/**
 * MealPlanDetail: Wrapper rendering the full Figma MealPlanDetailPage
 * containing DietSchoolTabs, PersonalizationBadgeBar, DetailDaySelector,
 * DetailedMealSlotCard, DetailRightSidebar, DetailWeeklyOverview, and DetailBottomBar.
 */
export const MealPlanDetail: React.FC<MealPlanDetailProps> = (props) => {
  // Hiển thị giao diện thực đơn bảy ngày và danh sách đi chợ từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
  return <MealPlanDetailPage {...props} />
}

export default MealPlanDetail
