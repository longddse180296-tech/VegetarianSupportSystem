import { apiClient } from '../../../../shared/api/apiClient'
import type { AdminRecipeItem, AdminRecipeFilter } from '../types/adminRecipes.types'

export const adminRecipesApi = {
  list: (filter: AdminRecipeFilter = {}) => {
    const qs = new URLSearchParams()
    if (filter.keyword) qs.set('keyword', filter.keyword)
    if (filter.status && filter.status !== 'all') qs.set('status', filter.status)
    if (filter.category) qs.set('category', filter.category)
    if (filter.diet && filter.diet !== 'all') qs.set('diet', filter.diet)
    return apiClient.get<{ items: AdminRecipeItem[]; totalCount: number }>(
      `/api/admin/recipes?${qs.toString()}`,
    )
  },
  create: (payload: Omit<AdminRecipeItem, 'id'>) =>
    apiClient.post<AdminRecipeItem>('/api/admin/recipes', payload),
  update: (id: string, payload: Partial<AdminRecipeItem>) =>
    apiClient.put<AdminRecipeItem>(`/api/admin/recipes/${id}`, payload),
  publish: (id: string) => apiClient.post<void>(`/api/admin/recipes/${id}/publish`),
  remove: (id: string) => apiClient.delete<void>(`/api/admin/recipes/${id}`),
}
