export type BackendMealSlot = 'Breakfast' | 'Lunch' | 'Dinner'
export type PlanDiet = 'Vegan' | 'Lacto' | 'Ovo' | 'LactoOvo'

export interface SavedPlanMeal {
  id: string
  dayNumber: number
  slot: BackendMealSlot
  recipeId: string
  recipeName: string
  imageUrl?: string | null
  servings: number
  totalTimeMinutes: number
  caloriesPerServing: number | null
  proteinGramPerServing: number | null
  carbohydrateGramPerServing: number | null
  fatGramPerServing: number | null
}

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

export interface SavedPlanSummary {
  id: string
  name: string
  weekStartDate: string
  mealCount: number
  createdAt: string
}

export interface SavedPlan extends Omit<SavedPlanSummary, 'mealCount'> {
  profileDiet: PlanDiet
  meals: SavedPlanMeal[]
  shoppingItems: PlanShoppingItem[]
  nutrition: { calories: number; proteinGrams: number; carbohydrateGrams: number; fatGrams: number }
  updatedAt: string | null
}

export interface PlanPage {
  items: SavedPlanSummary[]
  page: number
  pageSize: number
  totalCount: number
}

export interface ReplacementRecipe {
  id: string
  name: string
  imageUrl?: string | null
  caloriesPerServing: number | null
  cookTimeMinutes: number
  prepTimeMinutes: number
}
