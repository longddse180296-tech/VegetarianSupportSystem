// ---------- Enums ----------
export type RecipeDietCategory =
  | 'vegan'
  | 'ovo-lacto'
  | 'ovo'
  | 'lacto'
  | 'raw'
  | 'low-fat'
  | 'quick'
  | 'high-protein'

export type RecipeDifficulty = 'easy' | 'medium' | 'hard'

export type RecipeSortOption =
  | 'relevance'
  | 'newest'
  | 'cooktime_asc'
  | 'favorite_desc'

// ---------- Labels ----------
export const DIET_CATEGORY_LABELS: Record<RecipeDietCategory, string> = {
  vegan: 'Thuần thực vật',
  'ovo-lacto': 'Lạc trứng sữa',
  ovo: 'Lạc trứng',
  lacto: 'Lạc sữa',
  raw: 'Thực phẩm sống',
  'low-fat': 'Ít béo',
  quick: 'Nhanh 15-30 phút',
  'high-protein': 'Cao đạm',
}

export const DIFFICULTY_LABELS: Record<RecipeDifficulty, string> = {
  easy: 'Dễ',
  medium: 'Trung bình',
  hard: 'Khó',
}

export const SORT_LABELS: Record<RecipeSortOption, string> = {
  relevance: 'Nổi bật',
  newest: 'Mới nhất',
  cooktime_asc: 'Thời gian nấu ↑',
  favorite_desc: 'Yêu thích nhất',
}

// ---------- Sub-types ----------
export interface RecipeIngredient {
  id?: string
  name: string
  amount: number | string
  unit: string
  note?: string
}

export interface RecipeStep {
  stepNo?: number
  stepNumber?: number
  title?: string
  description?: string
  instruction?: string
  tip?: string
  durationMinutes?: number
}

export interface RecipeNutrition {
  kcal: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG?: number
}

export interface RelatedBlogCard {
  id: string
  title: string
  author: string
  readTime: string
  imageUrl: string
  desc?: string
  excerpt?: string
  tag?: string
  tagCls?: string
}

export interface RelatedVideoCard {
  id: string
  title: string
  channel: string
  duration: string
  imageUrl: string
  videoUrl?: string
}

export interface RelatedRestaurantCard {
  id: string
  name: string
  address: string
  distanceKm: number
  imageUrl: string
}

// ---------- Filter state ----------
export interface RecipeListFilter {
  search: string
  diet: RecipeDietCategory | 'all'
  difficulty: RecipeDifficulty | 'all'
  sort: RecipeSortOption
  favoritesOnly: boolean
}

export const DEFAULT_RECIPE_FILTER: RecipeListFilter = {
  search: '',
  diet: 'all',
  difficulty: 'all',
  sort: 'relevance',
  favoritesOnly: false,
}

// ---------- Main entity ----------
export interface Recipe {
  id: string
  title: string
  description: string
  category?: string
  dietType?: string
  prepTime?: number | string
  cookTime?: number | string
  totalTime?: number | string
  servings?: number
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  plantRatio?: number | string
  imageUrl?: string
  coverImage: string
  cookTimeMinutes: number
  prepTimeMinutes?: number
  servingSize: number
  dietCategory: RecipeDietCategory
  difficulty: RecipeDifficulty
  isFavorite: boolean
  favoriteCount: number
  viewCount: number
  authorName: string
  authorAvatar: string
  tags: string[]
  ingredients: RecipeIngredient[]
  steps: RecipeStep[]
  nutrition: RecipeNutrition
  publishedAt: string
  relatedBlogs?: RelatedBlogCard[]
  relatedVideos?: RelatedVideoCard[]
  relatedRestaurants?: RelatedRestaurantCard[]
}

export interface RecipeListResponse {
  items: Recipe[]
  totalCount: number
  appliedFilter: RecipeListFilter
}
