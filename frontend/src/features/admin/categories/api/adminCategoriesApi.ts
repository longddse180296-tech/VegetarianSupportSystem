import { apiClient } from '../../../../shared/api/apiClient'
import type { AdminCategoryItem, CategoryFormData } from '../types/adminCategories.types'

export const adminCategoriesApi = {
  list: (pageNumber = 1, search = '', signal?: AbortSignal) => {
    const query = new URLSearchParams({ pageNumber: String(pageNumber), pageSize: '10', search })
    return apiClient.get<{ items: AdminCategoryItem[]; totalCount: number }>(`/api/admin/categories?${query}`, { signal })
  },
  create: (data: CategoryFormData) => apiClient.post<AdminCategoryItem>('/api/admin/categories', { name: data.name.trim(), description: data.description.trim() || null }),
  update: (id: string, data: CategoryFormData) => apiClient.put<AdminCategoryItem>(`/api/admin/categories/${id}`, { name: data.name.trim(), description: data.description.trim() || null }),
  deactivate: (id: string) => apiClient.patch<void>(`/api/admin/categories/${id}/deactivate`),
}
