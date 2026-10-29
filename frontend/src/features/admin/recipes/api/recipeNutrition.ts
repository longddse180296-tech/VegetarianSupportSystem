// Chức năng: công thức và định lượng nguyên liệu. Giao tiếp máy chủ và chuyển dữ liệu về kiểu dùng trong tính năng.
// Cấu trúc RecipeNutritionInput quy định dữ liệu trao đổi trong công thức và định lượng nguyên liệu.
export interface RecipeNutritionInput {
  servings: number
  ingredients: Array<{ ingredientId: string; quantity: number; unit: string }>
}

// Cấu trúc RecipeNutritionResult quy định dữ liệu trao đổi trong công thức và định lượng nguyên liệu.
export interface RecipeNutritionResult {
  isComplete: boolean
  caloriesPerServing: number | null
  proteinGramPerServing: number | null
  carbohydrateGramPerServing: number | null
  fatGramPerServing: number | null
  issues: Array<{ ingredientId: string | null; message: string }>
}

// Cấu trúc RecipeIngredientOption quy định dữ liệu trao đổi trong công thức và định lượng nguyên liệu.
export interface RecipeIngredientOption {
  id: string
  name: string
  defaultUnit?: string | null
  nutritionBasisUnit?: string
}

// Thực hiện bước xử lý riêng được các thành phần trong tính năng sử dụng (recipeQuantityUnit); thuộc công thức và định lượng nguyên liệu.
export function recipeQuantityUnit(ingredient: RecipeIngredientOption): string {
  const unit = ingredient.defaultUnit?.trim().toLowerCase()
  return unit && ['g', 'kg', 'ml', 'đơn vị'].includes(unit) ? unit : ingredient.nutritionBasisUnit || ''
}
