import { apiClient } from '../../../../shared/api/apiClient'
import type { AdminIngredientItem, AdminIngredientFilter } from '../types/adminIngredients.types'

export const adminIngredientsApi = {
  list: (filter: AdminIngredientFilter = {}) => {
    const qs = new URLSearchParams()
    if (filter.keyword) qs.set('keyword', filter.keyword)
    if (filter.dangerLevel && filter.dangerLevel !== 'all') qs.set('dangerLevel', filter.dangerLevel)
    if (filter.category) qs.set('category', filter.category)
    return apiClient.get<{ items: AdminIngredientItem[]; totalCount: number }>(
      `/api/admin/ingredients?${qs.toString()}`,
    )
  },

  create: (payload: Omit<AdminIngredientItem, 'id'>) =>
    apiClient.post<AdminIngredientItem>('/api/admin/ingredients', payload),

  update: (id: string, payload: Partial<AdminIngredientItem>) =>
    apiClient.put<AdminIngredientItem>(`/api/admin/ingredients/${id}`, payload),

  remove: (id: string) => apiClient.delete<void>(`/api/admin/ingredients/${id}`),
}
