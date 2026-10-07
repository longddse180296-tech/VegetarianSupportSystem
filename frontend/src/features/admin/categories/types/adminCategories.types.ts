export type CategoryClassification = 'ingredient' | 'recipe'

export interface AdminCategoryItem {
  id: string
  name: string
  slug: string
  iconName: string
  classification: CategoryClassification
  classificationLabel: string
  description: string
  linkedCountText: string
  createdAt: string
  isActive: boolean
  statusLabel: string
}

export interface AdminCategoryStats {
  activeCount: number
  ingredientCategoryCount: number
  recipeCategoryCount: number
}

export interface AdminCategoryFilter {
  keyword?: string
  classification?: 'all' | 'ingredient' | 'recipe'
  status?: 'all' | 'active' | 'inactive'
  sortBy?: 'newest' | 'name'
  page?: number
  pageSize?: number
}

export interface CategoryFormData {
  id?: string
  name: string
  slug: string
  classification: CategoryClassification
  description: string
  isActive: boolean
}
