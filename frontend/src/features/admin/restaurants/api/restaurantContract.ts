import { apiClient } from '../../../../shared/api/apiClient'
import type { DietaryType } from '../../recipes/api/recipeContract'
export interface RestaurantInput {
  name: string
  description: string | null
  address: string
  district: string | null
  latitude: number | null
  longitude: number | null
  contactPhone: string | null
  websiteUrl: string | null
  openingHours: string | null
  priceFromVnd: number | null
  priceToVnd: number | null
  imageUrl: string | null
  source: string | null
  dietaryTypes: DietaryType[]
  amenities: string[]
  relatedRecipeIds: string[]
}
export interface RestaurantSummary {
  id: string
  name: string
  address: string
  district: string | null
  imageUrl: string | null
  priceFromVnd: number | null
  priceToVnd: number | null
  isActive: boolean
  dietaryTypes: DietaryType[]
  amenities: string[]
}
export type RestaurantDetail = Omit<RestaurantInput, 'relatedRecipeIds'> &
  RestaurantSummary & {
    dataUpdatedAt: string
    createdAt: string
    updatedAt: string | null
    relatedRecipes: Array<{ id: string; name: string; imageUrl: string | null }>
  }
export const restaurantApi = {
  get: (id: string) =>
    apiClient.get<RestaurantDetail>(`/api/admin/restaurants/${id}`),
  create: (input: RestaurantInput) =>
    apiClient.post<RestaurantDetail>('/api/admin/restaurants', input),
  update: (id: string, input: RestaurantInput) =>
    apiClient.put<RestaurantDetail>(`/api/admin/restaurants/${id}`, input),
  deactivate: (id: string) =>
    apiClient.post<void>(`/api/admin/restaurants/${id}/deactivate`),
}
