// Chức năng: thực đơn bảy ngày và danh sách đi chợ. Khai báo cấu trúc dữ liệu để các màn hình và hàm xử lý dùng thống nhất.
// Cấu trúc DietType quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
export type DietType = 'vegan' | 'lacto' | 'ovo' | 'lacto-ovo'

// Cấu trúc MealSlot quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
export type MealSlot = 'breakfast' | 'lunch' | 'snack' | 'dinner'

// Cấu trúc DietTabOption quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
export interface DietTabOption {
  id: DietType
  name: string
  subName: string
  badge: string
  icon: 'leaf' | 'milk' | 'egg' | 'utensils'
}

// Cấu trúc DietCharacteristic quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
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

// Cấu trúc MealItem quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
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

// Cấu trúc DailyMacroSummary quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
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

// Cấu trúc ShoppingItem quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
export interface ShoppingItem {
  id: string
  name: string
  quantity: string
  isChecked: boolean
}

// Cấu trúc GeneralMealPlanData quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
export interface GeneralMealPlanData {
  dietType: DietType
  characteristic: DietCharacteristic
  meals: MealItem[]
  macroSummary: DailyMacroSummary
  aiAdvice: string
  shoppingList: ShoppingItem[]
}

// --- Recommended Meal Plan Types (Phase 2) ---

// Cấu trúc DayOfWeek quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

// Cấu trúc UserPersonalizationInfo quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
export interface UserPersonalizationInfo {
  bmi: number
  bmiCategory: string
  goal: string
  preferredIngredients: string[]
  allergens: string[]
  mealsPerDay: string
}

// Cấu trúc RecommendedMealItem quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
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

// Cấu trúc MealReplacementOption quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
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

// Cấu trúc DayPlanOption quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
export interface DayPlanOption {
  dayId: DayOfWeek
  label: string
  calories: number
  meals: RecommendedMealItem[]
}

// Cấu trúc RecommendedNutritionSummary quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
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

// Cấu trúc PantryUtilization quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
export interface PantryUtilization {
  availableIngredients: string[]
  buyMoreNote: string
}

// Cấu trúc WeeklyPlanOverview quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
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

// Cấu trúc RecommendedMealPlanData quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
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

// Cấu trúc BiologicalGender quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
export type BiologicalGender = 'male' | 'female'
// Cấu trúc ActivityLevel quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
export type ActivityLevel = 'sedentary' | 'moderate' | 'active'
// Cấu trúc HealthGoal quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
export type HealthGoal = 'maintain' | 'weight-loss' | 'muscle-gain' | 'detox'

// Cấu trúc PersonalizationFormValues quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
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

// Cấu trúc BmiAnalysisResult quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
export interface BmiAnalysisResult {
  bmi: number
  category: string
  categoryClass: string
  estimatedCalories: number
  note: string
}

// Cấu trúc GeneratedPersonalizedPlan quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
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

// Cấu trúc MyWeeklyMealItem quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
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

// Cấu trúc WeeklyCalendarDay quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
export interface WeeklyCalendarDay {
  id: DayOfWeek
  label: string
  dateStr: string
  fullDate: string
  meals: MyWeeklyMealItem[]
}

// Cấu trúc MyBmiNutritionMetric quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
export interface MyBmiNutritionMetric {
  id: string
  label: string
  value: string
  subtitle: string
  type: 'calories' | 'protein' | 'carbs' | 'fat' | 'pantry'
  statusBadge?: string
}

// Cấu trúc SavedMealPlanItem quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
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

// Cấu trúc WeeklyProTip quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
export interface WeeklyProTip {
  title: string
  content: string
  actionLabel: string
}

// Cấu trúc MyWeeklyPlanData quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
export interface MyWeeklyPlanData {
  weekRange: string
  days: WeeklyCalendarDay[]
  activeDay: DayOfWeek
  bmiMetrics: MyBmiNutritionMetric[]
  savedPlans: SavedMealPlanItem[]
  proTip: WeeklyProTip
}

// --- Meal Plan Detail View Types (Phase 5) ---

// Cấu trúc DetailedSwapOption quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
export interface DetailedSwapOption {
  id: string
  matchPercent: number
  title: string
  calories: number
  protein: number
  isSelected?: boolean
}

// Cấu trúc DetailedMealSlot quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
export interface DetailedMealSlot {
  id: string
  slot: MealSlot
  slotLabel: string
  slotTime: string
  calories: number
  title: string
  description?: string
  imageUrl?: string
  carbs: number
  protein: number
  fat: number
  tags: string[]
  plantBasedRate: number
  recipeId?: string
  swapOptions?: DetailedSwapOption[]
}

// Cấu trúc PersonalizationBadgeInfo quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
export interface PersonalizationBadgeInfo {
  bmi: number
  bmiCategory: string
  targetCalories: number
  pantryItems: string[]
  allergens: string[]
  priorityNutrients: string[]
}

// Cấu trúc DailyNutritionRing quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
export interface DailyNutritionRing {
  consumedCalories: number
  targetCalories: number
  percent: number
  carbsPercent: number
  carbsGrams: number
  proteinPercent: number
  proteinGrams: number
  fatPercent: number
  fatGrams: number
}

// Cấu trúc PantrySavingsInfo quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
export interface PantrySavingsInfo {
  savingsAmount: string
  pantryRatio: number
  availableIngredients: string[]
}

// Cấu trúc GroceryItemToday quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
export interface GroceryItemToday {
  id: string
  name: string
  quantity: string
  isChecked: boolean
}

// Cấu trúc WeeklyOverviewStat quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
export interface WeeklyOverviewStat {
  avgCalories: string
  avgCaloriesNote: string
  avgProtein: string
  avgProteinNote: string
  totalMeals: string
  totalMealsNote: string
  pantryRatio: string
  pantryRatioNote: string
  bmiMatchRatio: string
  bmiMatchRatioNote: string
}

// Cấu trúc MealPlanDetailData quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
export interface MealPlanDetailData {
  id: string
  dietType: DietType
  personalization: PersonalizationBadgeInfo
  activeDay: DayOfWeek
  dayCalories: Record<DayOfWeek, number>
  meals: DetailedMealSlot[]
  dailyNutrition: DailyNutritionRing
  pantry: PantrySavingsInfo
  todayGroceries: GroceryItemToday[]
  aiAdvice: string
  weeklyOverview: WeeklyOverviewStat
}


