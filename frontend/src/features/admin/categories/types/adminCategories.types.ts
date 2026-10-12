export interface AdminCategoryItem {
  id: string
  name: string
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string | null
}

export interface CategoryFormData { name: string; description: string }
