// Chức năng: danh mục nội dung. Giao tiếp máy chủ và chuyển dữ liệu về kiểu dùng trong tính năng.
import { apiClient } from '../../../../shared/api/apiClient'
import type { AdminCategoryItem, CategoryFormData, CategoryKind } from '../types/adminCategories.types'

export const adminCategoriesApi = (kind: CategoryKind) => {
  const scope = `kind=${kind}`
  return {
    list: (pageNumber = 1, search = '', signal?: AbortSignal) => {
      const query = new URLSearchParams({ pageNumber: String(pageNumber), pageSize: '10', search })
      return apiClient.get<{ items: AdminCategoryItem[]; totalCount: number }>(`/api/admin/categories?${query}&${scope}`, { signal })
    },
    create: (data: CategoryFormData) => apiClient.post<AdminCategoryItem>(`/api/admin/categories?${scope}`, { name: data.name.trim(), description: data.description.trim() || null }),
    update: (id: string, data: CategoryFormData) => apiClient.put<AdminCategoryItem>(`/api/admin/categories/${id}?${scope}`, { name: data.name.trim(), description: data.description.trim() || null }),
    setActive: (id: string, active: boolean) =>
      apiClient.patch<void>(`/api/admin/categories/${id}/${active ? 'activate' : 'deactivate'}?${scope}`),
  }
}
