import { apiClient } from '../../../../shared/api/apiClient'
import {
  BACKEND_DIETARY_TYPE_LABELS,
  type BackendDietaryType,
} from '../../../../shared/constants'

export type DietaryType = BackendDietaryType
export const dietLabels: Record<DietaryType, string> = BACKEND_DIETARY_TYPE_LABELS
export interface RecipeInput {
  categoryId: string
  name: string
  description: string | null
  servings: number
  instructions: string
  prepTimeMinutes: number
  cookTimeMinutes: number
  imageUrl: string | null
  caloriesPerServing: number | null
  proteinGramPerServing: number | null
  carbohydrateGramPerServing: number | null
  fatGramPerServing: number | null
  declaredDietaryType: DietaryType | null
  ingredients: Array<{
    ingredientId: string
    quantity: number
    unit: string
    note: string | null
  }>
}
export interface RecipeSummary {
  id: string
  name: string
  categoryId: string
  categoryName: string
  servings: number
  prepTimeMinutes: number
  cookTimeMinutes: number
  imageUrl: string | null
  caloriesPerServing: number | null
  declaredDietaryType: DietaryType | null
  isActive: boolean
  dietaryAssessments: Array<{
    dietaryType: DietaryType
    status: 'Unknown' | 'Compatible' | 'Incompatible'
  }>
}
export type RecipeDetail = Omit<RecipeInput, 'ingredients'> &
  RecipeSummary & {
    ingredients: Array<
      RecipeInput['ingredients'][number] & { name: string; isActive: boolean }
    >
    createdAt: string
    updatedAt: string | null
  }
export const recipeApi = {
  get: (id: string) => apiClient.get<RecipeDetail>(`/api/admin/recipes/${id}`),
  create: (input: RecipeInput) =>
    apiClient.post<RecipeDetail>('/api/admin/recipes', input),
  update: (id: string, input: RecipeInput) =>
    apiClient.put<RecipeDetail>(`/api/admin/recipes/${id}`, input),
  deactivate: (id: string) =>
    apiClient.post<void>(`/api/admin/recipes/${id}/deactivate`),
}
