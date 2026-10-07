export type DietaryMatchLevel = 'suitable' | 'not_suitable' | 'needs_more_info'

export type IngredientCategory =
  | 'protein'
  | 'grain'
  | 'vegetable'
  | 'fruit'
  | 'seasoning'
  | 'dairy_alt'
  | 'unknown'

export interface ScannedIngredient {
  id: string
  name: string
  quantity: string
  confidence: number
  isVegan: boolean
  isAllergen: boolean
  category: IngredientCategory
  notes?: string
}

export interface NutritionFact {
  key: string
  label: string
  value: string
  dailyPercent: string
  trend: 'low' | 'medium' | 'high'
  badge?: string
}

export interface NonVeganIngredient {
  id: string
  name: string
  detectedIn: string
  riskLevel: 'high' | 'medium' | 'low'
  evidence: string
}

export interface DietaryAssessment {
  overallMatch: DietaryMatchLevel
  targetDiet: 'Vegan' | 'Vegetarian' | 'Pescatarian'
  verdictTitle: string
  verdictSubtitle: string
  flags: NonVeganIngredient[]
  confidence: number
  processedAt: string
  imageUrl?: string
  dishName?: string
}

export interface NutritionBreakdown {
  totalCalories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number
  sugarG: number
  sodiumMg: number
  cholesterolMg: number
  vitaminA_IU: number
  vitaminC_MG: number
  calcium_MG: number
  iron_MG: number
}

export interface AlternativeItem {
  id: string
  original: string
  substituteName: string
  substituteType: string
  swapRatio: string
  whyItWorks: string
  flavorMatch: number
  nutritionMatch: number
  imageUrl?: string
  priceHint?: string
  availabilityTag?: string
}

export interface MealplanOption {
  id: string
  day: string
  dayIndex: number
  slots: Array<{
    key: 'breakfast' | 'lunch' | 'dinner' | 'snack'
    label: string
    recipeCount: number
  }>
  totalItems: number
  calTargetMatch: string
  filledPercentage: number
}

export interface FoodScanResult {
  id: string
  scannedAt: string
  dietaryAssessment: DietaryAssessment
  nutritionBreakdown: NutritionBreakdown
  nutritionFacts: NutritionFact[]
  alternatives: AlternativeItem[]
  mealplanOptions: MealplanOption[]
  scannedIngredients: ScannedIngredient[]
}

export interface ScanStatus {
  state: 'idle' | 'uploading' | 'analyzing' | 'ocr' | 'confirming' | 'done' | 'error'
  progress?: number
  message?: string
}
