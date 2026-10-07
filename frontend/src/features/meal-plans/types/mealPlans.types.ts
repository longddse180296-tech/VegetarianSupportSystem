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

// --- Personalization Setup Types (Phase 3) ---

export type BiologicalGender = 'male' | 'female'
export type ActivityLevel = 'sedentary' | 'moderate' | 'active'
export type HealthGoal = 'maintain' | 'weight-loss' | 'muscle-gain' | 'detox'

export interface PersonalizationFormValues {
  gender: BiologicalGender
  heightCm: number
  weightKg: number
  age: number
  activityLevel: ActivityLevel
  goal: HealthGoal
  dietType: DietType
  availableIngredients: string[]
  allergens: string[]
  preferences: string[]
}

export interface BmiAnalysisResult {
  bmi: number
  category: string
  categoryClass: string
  estimatedCalories: number
  note: string
}

export interface GeneratedPersonalizedPlan {
  formData: PersonalizationFormValues
  bmiAnalysis: BmiAnalysisResult
  dayPreview: DayPlanOption
  dailyNutrition: {
    calories: number
    targetCalories: number
    percentAchieved: number
    micronutrientsNote: string
    carbsGrams: number
    targetCarbs: number
    proteinGrams: number
    targetProtein: number
  }
  weeklySummary: {
    avgCalories: number
    avgCaloriesNote: string
    pantryUsedPercent: number
    pantryUsedNote: string
    goalMatchPercent: number
    goalMatchNote: string
    uniqueMealsCount: number
    uniqueMealsNote: string
    benefitNote: string
  }
}

// --- Weekly Calendar / My Plan Types (Phase 4) ---

export interface MyWeeklyMealItem {
  id: string
  slot: MealSlot
  slotTime: string
  slotLabel: string
  slotTag: string
  title: string
  description: string
  imageUrl: string
  calories: number
  cookTimeMinutes: number
  protein: number
  recipeId?: string
}

export interface WeeklyCalendarDay {
  id: DayOfWeek
  label: string
  dateStr: string
  fullDate: string
  meals: MyWeeklyMealItem[]
}

export interface MyBmiNutritionMetric {
  id: string
  label: string
  value: string
  subtitle: string
  type: 'calories' | 'protein' | 'carbs' | 'fat' | 'pantry'
  statusBadge?: string
}

export interface SavedMealPlanItem {
  id: string
  goal: HealthGoal
  goalLabel: string
  goalTagColor: 'emerald' | 'teal' | 'blue' | 'indigo' | 'amber'
  savedDate: string
  title: string
  description: string
  daysCount: number
  mealsCount: number
  highlightStat: string
}

export interface WeeklyProTip {
  title: string
  content: string
  actionLabel: string
}

export interface MyWeeklyPlanData {
  weekRange: string
  days: WeeklyCalendarDay[]
  activeDay: DayOfWeek
  bmiMetrics: MyBmiNutritionMetric[]
  savedPlans: SavedMealPlanItem[]
  proTip: WeeklyProTip
}


