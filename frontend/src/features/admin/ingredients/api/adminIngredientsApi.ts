import { apiClient } from '../../../../shared/api/apiClient'
import type { AdminIngredientItem, IngredientInput } from '../types/adminIngredients.types'

export const adminIngredientsApi = {
  list: (pageNumber = 1, search = '', signal?: AbortSignal) => {
    const query = new URLSearchParams({ pageNumber: String(pageNumber), pageSize: '10', search })
    return apiClient.get<{ items: AdminIngredientItem[]; totalCount: number }>(`/api/admin/ingredients?${query}`, { signal })
  },
  create: (input: IngredientInput) => apiClient.post<AdminIngredientItem>('/api/admin/ingredients', input),
  update: (id: string, input: IngredientInput) => apiClient.put<AdminIngredientItem>(`/api/admin/ingredients/${id}`, input),
  deactivate: (id: string) => apiClient.post<void>(`/api/admin/ingredients/${id}/deactivate`),
}
