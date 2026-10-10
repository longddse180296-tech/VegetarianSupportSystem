import React from 'react'
import { MealPlanDetailPage } from './MealPlanDetailPage'

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
  return <MealPlanDetailPage {...props} />
}

export default MealPlanDetail
