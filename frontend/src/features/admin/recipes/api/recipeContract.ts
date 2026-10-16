import { apiClient } from '../../../../shared/api/apiClient'
export type DietaryType =
  | 'Vegan'
  | 'LactoVegetarian'
  | 'OvoVegetarian'
  | 'LactoOvoVegetarian'
export const dietLabels: Record<DietaryType, string> = {
  Vegan: 'Thuần chay (Vegan)',
  LactoVegetarian: 'Ăn chay có sữa (Lacto)',
  OvoVegetarian: 'Chay có trứng (Ovo)',
  LactoOvoVegetarian: 'Trứng & Sữa (Lacto-ovo)',
}
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
