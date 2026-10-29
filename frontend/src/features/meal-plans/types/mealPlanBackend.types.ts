// Chức năng: thực đơn bảy ngày và danh sách đi chợ. Khai báo cấu trúc dữ liệu để các màn hình và hàm xử lý dùng thống nhất.
// Cấu trúc BackendMealSlot quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
export type BackendMealSlot = 'Breakfast' | 'Lunch' | 'Dinner'
// Cấu trúc PlanDiet quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
export type PlanDiet = 'Vegan' | 'Lacto' | 'Ovo' | 'LactoOvo'

// Cấu trúc SavedPlanMeal quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
export interface SavedPlanMeal {
  id: string
  dayNumber: number
  slot: BackendMealSlot
  recipeId: string
  recipeName: string
  imageUrl?: string | null
  servings: number
  swapCount: number
  totalTimeMinutes: number
  caloriesPerServing: number | null
  proteinGramPerServing: number | null
  carbohydrateGramPerServing: number | null
  fatGramPerServing: number | null
  ingredientNames: string[]
}

// Cấu trúc PlanShoppingItem quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
export interface PlanShoppingItem {
  id: string
  ingredientId: string
  ingredientName: string
  requiredQuantity: number
  pantryQuantity: number
  quantityToBuy: number
  unit: string
  isPurchased: boolean
}

// Cấu trúc SavedPlanSummary quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
export interface SavedPlanSummary {
  id: string
  name: string
  weekStartDate: string
  mealCount: number
  createdAt: string
}

// Cấu trúc SavedPlan quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
export interface SavedPlan extends Omit<SavedPlanSummary, 'mealCount'> {
  profileDiet: PlanDiet
  meals: SavedPlanMeal[]
  shoppingItems: PlanShoppingItem[]
  nutrition: { calories: number; proteinGrams: number; carbohydrateGrams: number; fatGrams: number }
  updatedAt: string | null
}

// Cấu trúc PlanPage quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
export interface PlanPage {
  items: SavedPlanSummary[]
  page: number
  pageSize: number
  totalCount: number
}

// Cấu trúc ReplacementRecipe quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
export interface ReplacementRecipe {
  id: string
  name: string
  imageUrl?: string | null
  caloriesPerServing: number | null
  proteinGramPerServing: number | null
  carbohydrateGramPerServing: number | null
  fatGramPerServing: number | null
  ingredientNames: string[]
  cookTimeMinutes: number
  prepTimeMinutes: number
}
