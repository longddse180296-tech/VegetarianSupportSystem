// Chức năng: danh mục nguyên liệu và dữ liệu dinh dưỡng. Khai báo cấu trúc dữ liệu để các màn hình và hàm xử lý dùng thống nhất.
// Cấu trúc IngredientOrigin quy định dữ liệu trao đổi trong danh mục nguyên liệu và dữ liệu dinh dưỡng.
export type IngredientOrigin = 'Unknown' | 'Plant' | 'Animal'

// Cấu trúc IngredientInput quy định dữ liệu trao đổi trong danh mục nguyên liệu và dữ liệu dinh dưỡng.
export interface IngredientInput {
  name: string
  aliases: string | null
  origin: IngredientOrigin
  containsEgg: boolean
  containsMilk: boolean
  containsHoney: boolean
  containsOtherAnimalProducts: boolean | null
  allergens: string | null
  defaultUnit: string | null
  calories: number | null
  proteinGram: number | null
  carbohydrateGram: number | null
  fatGram: number | null
  source: string | null
}

// Cấu trúc AdminIngredientItem quy định dữ liệu trao đổi trong danh mục nguyên liệu và dữ liệu dinh dưỡng.
export interface AdminIngredientItem extends IngredientInput {
  id: string
  isActive: boolean
  createdAt: string
  updatedAt: string | null
  nutritionBasisQuantity: number
  nutritionBasisUnit: string
}
