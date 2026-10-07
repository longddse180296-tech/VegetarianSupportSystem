export type IngredientCategory =
  | 'protein'
  | 'grain'
  | 'vegetable'
  | 'fruit'
  | 'fat_oil'
  | 'spice'
  | 'sweetener'
  | 'other'

export interface PantryIngredient {
  id: string
  name: string
  quantityGram?: number
  category: IngredientCategory
  unit?: string
}

export type VeganAssessment = 'vegan_safe' | 'not_vegan' | 'ovo_lacto_only' | 'unknown'

export interface CheckedIngredient extends PantryIngredient {
  assessment: VeganAssessment
  evidence?: string
  canKeepFor?: 'ovo_lacto' | 'vegan' | 'none'
}

export interface SwapSuggestion {
  id: string
  targetIngredientId: string
  originalName: string
  substituteName: string
  substituteType: string
  swapRatio: string
  whyItWorks: string
  flavorMatch: number
  nutritionMatch: number
  priceHint?: string
  availabilityTag?: string
  applied?: boolean
}

export interface NutritionPerServing {
  calories: number
  proteinG: number
  carbsG: number
  goodFatG: number
}

export interface PantryRecipeSuggestion {
  id: string
  title: string
  subtitle: string
  coverImageUrl: string
  cookTimeMin: number
  badges: Array<{ label: string; variant: 'success' | 'info' | 'warning' }>
  matchedIngredientIds: string[]
  ingredientSummary: string
  nutrition: NutritionPerServing
  isVeganVerified: boolean
  veganConfidence: number
}

export interface ExpertInsight {
  title: string
  badge?: string
  body: string
  pros?: string[]
  cons?: string[]
}

export interface PantryAiSuggestionResult {
  resultId: string
  generatedAtISO: string
  aiVersion: string
  dietModeLabel: string
  dietModeDescription: string
  availableIngredients: PantryIngredient[]
  maxIngredientsInPantry: number
  checkedIngredients: CheckedIngredient[]
  veganAssessmentSummary: {
    safeCount: number
    warnCount: number
    flaggedCount: number
    safePercent: number
  }
  swaps: SwapSuggestion[]
  autoReplaceAll?: boolean
  recipeSuggestions: PantryRecipeSuggestion[]
  recipeSortDefault: 'match' | 'quickest' | 'nutri_score' | 'cheapest'
  expertInsight: ExpertInsight
}

export interface AddIngredientRequest {
  name: string
  quantityGram?: number
  category?: IngredientCategory
}

export const CATEGORY_LABELS: Record<IngredientCategory, string> = {
  protein: 'Đạm',
  grain: 'Ngũ cốc',
  vegetable: 'Rau củ',
  fruit: 'Trái cây',
  fat_oil: 'Dầu / Mỡ',
  spice: 'Gia vị',
  sweetener: 'Đường / Ngọt',
  other: 'Khác',
}

export const ASSESSMENT_LABELS: Record<VeganAssessment, string> = {
  vegan_safe: '100% An toàn Vegan',
  not_vegan: 'Món gốc động vật - Loại bỏ',
  ovo_lacto_only: 'Không hợp với Thuần chay (Vegan)',
  unknown: 'Cần kiểm tra lại',
}
