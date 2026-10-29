// Chức năng: thực đơn bảy ngày và danh sách đi chợ. Ghép dữ liệu, thao tác và các trạng thái tải/lỗi cho màn hình.
import React from 'react'
import { PersonalizationSetupPage } from './PersonalizationSetupPage'

// Cấu trúc MealPlanCreateProps quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
export interface MealPlanCreateProps {
  onNavigate?: (path: string) => void
}

/**
 * MealPlanCreate: Wrapper rendering the full Figma PersonalizationSetupPage
 * containing SetupStepper, BodyInfoFormCard, HealthGoalFormCard,
 * PantrySelectionFormCard, DietPreferenceFormCard, and PersonalizationPreviewSection.
 */
export const MealPlanCreate: React.FC<MealPlanCreateProps> = (props) => {
  // Hiển thị giao diện thực đơn bảy ngày và danh sách đi chợ từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
  return <PersonalizationSetupPage {...props} />
}

export default MealPlanCreate
