export type RecipeDiet = 'vegan' | 'lacto-vegetarian' | 'ovo-vegetarian' | 'flexitarian'

export interface AdminRecipeItem {
  id: string
  title: string
  authorName: string
  category: string
  diet: RecipeDiet
  caloriesKcal: number
  proteinGram: number
  prepTimeMin: number
  cookTimeMin: number
  status: 'draft' | 'published' | 'hidden'
  veganProgressPercent: number
  publishedAt?: string
  thumbnailUrl?: string
}

export interface AdminRecipeStats {
  total: number
  published: number
  draft: number
  hidden: number
}

export interface AdminRecipeFilter {
  keyword?: string
  status?: 'all' | AdminRecipeItem['status']
  category?: string
  diet?: RecipeDiet | 'all'
}
