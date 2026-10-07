export type DietType = 'vegan' | 'lacto' | 'ovo' | 'lacto-ovo'

export type MealSlot = 'breakfast' | 'lunch' | 'snack' | 'dinner'

export interface DietTabOption {
  id: DietType
  name: string
  subName: string
  badge: string
  icon: 'leaf' | 'milk' | 'egg' | 'utensils'
}

export interface DietCharacteristic {
  title: string
  certBadge: string
  description: string
  targetKcal: number
  targetProtein: number
  targetCarbs: number
  targetFat: number
  targetFiber: number
  targetMicronutrients: string
}

export interface MealItem {
  id: string
  slot: MealSlot
  slotTime: string
  slotLabel: string
  title: string
  description: string
  imageUrl: string
  calories: number
  protein: number
  fat: number
  carbs: number
  tags: string[]
  matchRate: number
  matchNote?: string
  recipeId?: string
}

export interface DailyMacroSummary {
  calories: number
  targetCalories: number
  percentAchieved: number
  statusNote: string
  carbsPercent: number
  carbsGrams: number
  proteinPercent: number
  proteinGrams: number
  fatPercent: number
  fatGrams: number
}

export interface ShoppingItem {
  id: string
  name: string
  quantity: string
  isChecked: boolean
}

export interface GeneralMealPlanData {
  dietType: DietType
  characteristic: DietCharacteristic
  meals: MealItem[]
  macroSummary: DailyMacroSummary
  aiAdvice: string
  shoppingList: ShoppingItem[]
}

// --- Recommended Meal Plan Types (Phase 2) ---

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

export interface UserPersonalizationInfo {
  bmi: number
  bmiCategory: string
  goal: string
  preferredIngredients: string[]
  allergens: string[]
  mealsPerDay: string
}

export interface RecommendedMealItem {
  id: string
  slot: MealSlot
  slotTime: string
  slotLabel: string
  categoryTag: string
  title: string
  isOptimal?: boolean
  calories: number
  protein: number
  cookTimeMinutes: number
  description: string
  imageUrl?: string
  recipeId?: string
}

export interface MealReplacementOption {
  id: string
  label: string
  matchRate: number
  title: string
  calories: number
  protein: number
  cookTimeMinutes: number
  description: string
}

export interface DayPlanOption {
  dayId: DayOfWeek
  label: string
  calories: number
  meals: RecommendedMealItem[]
}

export interface RecommendedNutritionSummary {
  caloriesConsumed: number
  targetCalories: number
  energyPercentNote: string
  proteinConsumed: number
  targetProtein: number
  proteinNote: string
  carbsGrams: number
  carbsNote: string
  fatGrams: number
  fatNote: string
}

export interface PantryUtilization {
  availableIngredients: string[]
  buyMoreNote: string
}

export interface WeeklyPlanOverview {
  avgCalories: number
  avgCaloriesNote: string
  avgProtein: number
  avgProteinNote: string
  uniqueMealCount: number
  uniqueMealNote: string
  pantryUsedPercent: number
  pantryUsedNote: string
  goalMatchPercent: number
  goalMatchNote: string
}

export interface RecommendedMealPlanData {
  userInfo: UserPersonalizationInfo
  days: DayPlanOption[]
  activeDay: DayOfWeek
  replacements: Record<string, MealReplacementOption[]>
  nutritionSummary: RecommendedNutritionSummary
  pantryUtilization: PantryUtilization
  weeklyOverview: WeeklyPlanOverview
  aiExplanation: string
}

