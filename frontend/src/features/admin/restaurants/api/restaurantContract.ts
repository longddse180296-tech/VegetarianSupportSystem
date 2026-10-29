// Chức năng: tra cứu và quản lý nhà hàng. Giao tiếp máy chủ và chuyển dữ liệu về kiểu dùng trong tính năng.
import { apiClient } from '../../../../shared/api/apiClient'
import type { DietaryType } from '../../recipes/api/recipeContract'

// Cấu trúc RestaurantFeaturedDishInput quy định dữ liệu trao đổi trong tra cứu và quản lý nhà hàng.
export interface RestaurantFeaturedDishInput {
  name: string
  imageUrl: string | null
}

// Cấu trúc RestaurantFeaturedDish quy định dữ liệu trao đổi trong tra cứu và quản lý nhà hàng.
export interface RestaurantFeaturedDish extends RestaurantFeaturedDishInput {
  id: string
  displayOrder: number
}

// Cấu trúc RestaurantInput quy định dữ liệu trao đổi trong tra cứu và quản lý nhà hàng.
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
  featuredDishes: RestaurantFeaturedDishInput[]
}
// Cấu trúc RestaurantSummary quy định dữ liệu trao đổi trong tra cứu và quản lý nhà hàng.
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
  dietaryType: DietaryType | null
  amenities: string[]
}
// Cấu trúc RestaurantDetail quy định dữ liệu trao đổi trong tra cứu và quản lý nhà hàng.
export type RestaurantDetail = RestaurantInput &
  RestaurantSummary & {
    dataUpdatedAt: string
    createdAt: string
    updatedAt: string | null
    featuredDishes: RestaurantFeaturedDish[]
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
  activate: (id: string) =>
    apiClient.post<void>(`/api/admin/restaurants/${id}/activate`),
}
