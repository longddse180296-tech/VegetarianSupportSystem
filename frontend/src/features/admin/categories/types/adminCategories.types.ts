export type CategoryClassification = 'food_type' | 'recipe' | 'ingredient'

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
  foodTypeCategoryCount: number
  recipeCategoryCount: number
  ingredientCategoryCount: number
}

export interface AdminCategoryFilter {
  keyword?: string
  classification?: 'all' | 'food_type' | 'recipe' | 'ingredient'
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
