// Chức năng: công thức và định lượng nguyên liệu. Khai báo cấu trúc dữ liệu để các màn hình và hàm xử lý dùng thống nhất.
// ---------- Enums ----------
// Cấu trúc RecipeDietCategory quy định dữ liệu trao đổi trong công thức và định lượng nguyên liệu.
export type RecipeDietCategory =
  | 'vegan'
  | 'ovo-lacto'
  | 'ovo'
  | 'lacto'
  | 'raw'
  | 'low-fat'
  | 'quick'
  | 'high-protein'

// Cấu trúc RecipeDifficulty quy định dữ liệu trao đổi trong công thức và định lượng nguyên liệu.
export type RecipeDifficulty = 'easy' | 'medium' | 'hard'

// Cấu trúc RecipeSortOption quy định dữ liệu trao đổi trong công thức và định lượng nguyên liệu.
export type RecipeSortOption =
  | 'relevance'
  | 'newest'
  | 'cooktime_asc'
  | 'favorite_desc'

// ---------- Labels ----------
export const DIET_CATEGORY_LABELS: Record<RecipeDietCategory, string> = {
  vegan: 'Thuần chay (Vegan)',
  'ovo-lacto': 'Trứng & Sữa (Lacto-ovo)',
  ovo: 'Chay có trứng (Ovo)',
  lacto: 'Ăn chay có sữa (Lacto)',
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
// Cấu trúc RecipeIngredient quy định dữ liệu trao đổi trong công thức và định lượng nguyên liệu.
export interface RecipeIngredient {
  id?: string
  name: string
  amount: number | string
  unit: string
  note?: string
}

// Cấu trúc RecipeStep quy định dữ liệu trao đổi trong công thức và định lượng nguyên liệu.
export interface RecipeStep {
  stepNo?: number
  stepNumber?: number
  title?: string
  description?: string
  instruction?: string
  tip?: string
  durationMinutes?: number
}

// Cấu trúc RecipeNutrition quy định dữ liệu trao đổi trong công thức và định lượng nguyên liệu.
export interface RecipeNutrition {
  kcal: number | null
  proteinG: number | null
  carbsG: number | null
  fatG: number | null
  fiberG?: number
}

// Cấu trúc RelatedBlogCard quy định dữ liệu trao đổi trong công thức và định lượng nguyên liệu.
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

// Cấu trúc RelatedVideoCard quy định dữ liệu trao đổi trong công thức và định lượng nguyên liệu.
export interface RelatedVideoCard {
  id: string
  title: string
  channel: string
  duration: string
  imageUrl: string
  videoUrl?: string
}

// Cấu trúc RelatedRestaurantCard quy định dữ liệu trao đổi trong công thức và định lượng nguyên liệu.
export interface RelatedRestaurantCard {
  id: string
  name: string
  address: string
  distanceKm: number | null
  imageUrl: string
}

// ---------- Filter state ----------
// Cấu trúc RecipeListFilter quy định dữ liệu trao đổi trong công thức và định lượng nguyên liệu.
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
// Cấu trúc Recipe quy định dữ liệu trao đổi trong công thức và định lượng nguyên liệu.
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
  dietCategory?: RecipeDietCategory
  compatibleDietCategories?: RecipeDietCategory[]
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

// Cấu trúc RecipeListResponse quy định dữ liệu trao đổi trong công thức và định lượng nguyên liệu.
export interface RecipeListResponse {
  items: Recipe[]
  totalCount: number
  appliedFilter: RecipeListFilter
}
