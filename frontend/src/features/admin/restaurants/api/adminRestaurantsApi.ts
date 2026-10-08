import { apiClient } from '../../../../shared/api/apiClient'
import type { AdminRestaurantItem } from '../types/adminRestaurants.types'

export const adminRestaurantsApi = {
  list: (filter: { keyword?: string; district?: string } = {}) => {
    const qs = new URLSearchParams()
    if (filter.keyword) qs.set('keyword', filter.keyword)
    if (filter.district) qs.set('district', filter.district)
    return apiClient.get<{ items: AdminRestaurantItem[]; totalCount: number }>(
      `/api/admin/restaurants?${qs.toString()}`,
    )
  },
  verify: (id: string) => apiClient.post<void>(`/api/admin/restaurants/${id}/verify`),
  remove: (id: string) => apiClient.delete<void>(`/api/admin/restaurants/${id}`),
  update: (id: string, payload: Partial<AdminRestaurantItem>) =>
    apiClient.put<AdminRestaurantItem>(`/api/admin/restaurants/${id}`, payload),
}
