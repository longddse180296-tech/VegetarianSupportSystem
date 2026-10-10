import React from 'react'
import { PersonalizationSetupPage } from './PersonalizationSetupPage'

export interface MealPlanCreateProps {
  onNavigate?: (path: string) => void
}

/**
 * MealPlanCreate: Wrapper rendering the full Figma PersonalizationSetupPage
 * containing SetupStepper, BodyInfoFormCard, HealthGoalFormCard,
 * PantrySelectionFormCard, DietPreferenceFormCard, and PersonalizationPreviewSection.
 */
export const MealPlanCreate: React.FC<MealPlanCreateProps> = (props) => {
  return <PersonalizationSetupPage {...props} />
}

export default MealPlanCreate
