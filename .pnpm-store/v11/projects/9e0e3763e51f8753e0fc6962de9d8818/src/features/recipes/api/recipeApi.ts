import { apiClient } from '../../../shared/api/apiClient'
import type { SelectOption } from '../../../shared/components'
import type {
  Recipe,
  RecipeDietCategory,
  RecipeDifficulty,
  RecipeIngredient,
  RecipeListFilter,
  RecipeListResponse,
  RecipeSortOption,
  RecipeStep,
  RelatedBlogCard,
  RelatedRestaurantCard,
  RelatedVideoCard,
} from '../types/recipe.types'
import { DEFAULT_RECIPE_FILTER, DIET_CATEGORY_LABELS, SORT_LABELS } from '../types/recipe.types'

export async function getRelatedArticles(_recipeId: string): Promise<RelatedBlogCard[]> {
  try {
    const res = await apiClient.get<{
      items: Array<{
        id: string
        title: string
        description?: string
        imageUrl?: string
        authorName?: string
      }>
    }>('/api/articles?pageSize=3', { requiresAuth: false })
    if (res?.items && Array.isArray(res.items)) {
      return res.items.slice(0, 3).map((a) => ({
        id: a.id,
        title: a.title,
        excerpt: a.description || 'Bài viết chia sẻ kinh nghiệm dinh dưỡng và lối sống ăn chay an lành.',
        imageUrl:
          a.imageUrl ||
          'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80',
        author: a.authorName || 'Bếp Chay An Yên',
        readTime: '5 phút đọc',
        publishedAt: 'Mới đăng',
        tags: ['Ăn chay', 'Sức khỏe'],
      }))
    }
  } catch {
    // API error
  }
  return []
}

export async function getRelatedVideos(_recipeId: string): Promise<RelatedVideoCard[]> {
  try {
    const res = await apiClient.get<{
      items: Array<{
        id: string
        title: string
        thumbnailUrl?: string
      }>
    }>('/api/videos?pageSize=3', { requiresAuth: false })
    if (res?.items && Array.isArray(res.items)) {
      return res.items.slice(0, 3).map((v) => ({
        id: v.id,
        title: v.title,
        imageUrl:
          v.thumbnailUrl ||
          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
        duration: '15:00',
        channel: 'Bếp Chay An Nhiên',
      }))
    }
  } catch {
    // API error
  }
  return []
}

export async function getRelatedRestaurants(_recipeId: string): Promise<RelatedRestaurantCard[]> {
  try {
    const res = await apiClient.get<{
      items: Array<{
        id: string
        name: string
        address: string
        imageUrl?: string
        distanceKm?: number
      }>
    }>('/api/restaurants?pageSize=2', { requiresAuth: false })
    if (res?.items && Array.isArray(res.items)) {
      return res.items.slice(0, 2).map((r) => ({
        id: r.id,
        name: r.name,
        address: r.address,
        imageUrl:
          r.imageUrl ||
          'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80',
        distanceKm: r.distanceKm ? Number(r.distanceKm) : 1.5,
      }))
    }
  } catch {
    // API error
  }
  return []
}

// ---------- Filter options ----------
export interface DietPillOption {
  value: string
  label: string
  cls?: string
}

export interface CategoryPillOption {
  value: string
  label: string
}

export interface RecipeFilterOptions {
  categoryPills: CategoryPillOption[]
  dietPills: DietPillOption[]
  cookTimeOptions: SelectOption[]
  kcalOptions: SelectOption[]
  sortOptions: SelectOption[]
}

const CATEGORY_PILLS: CategoryPillOption[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'main', label: 'Món chính' },
  { value: 'salad', label: 'Salad' },
  { value: 'soup', label: 'Món nước' },
  { value: 'drink', label: 'Đồ uống' },
  { value: 'dessert', label: 'Tráng miệng' },
]

const DIET_PILLS: DietPillOption[] = [
  { value: 'all', label: 'Thuần chay (Vegan)', cls: 'bg-[#E6F3EC] text-[#2E7D32] border-[#C8E6C9]' },
  { value: 'lacto', label: 'Ăn chay có sữa (Lacto)', cls: 'bg-[#E6F3EC] text-[#2E7D32] border-[#C8E6C9]' },
  { value: 'ovo', label: 'Chay có trứng (Ovo)', cls: 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]' },
  { value: 'ovo-lacto', label: 'Trứng & Sữa (Lacto-ovo)', cls: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]' },
]

const COOKTIME_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'Tất cả thời gian' },
  { value: 'lt15', label: '< 15 phút (siêu nhanh)' },
  { value: '15-30', label: '15 - 30 phút' },
  { value: '30-45', label: '30 - 45 phút' },
  { value: 'gt45', label: '> 45 phút (chậm)' },
]

const KCAL_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'Tất cả mức calo' },
  { value: 'lt200', label: '< 200 Kcal (thấp năng lượng)' },
  { value: '200-350', label: '200 - 350 Kcal (cân đối)' },
  { value: '350-500', label: '350 - 500 Kcal (bữa chính)' },
  { value: 'gt500', label: '> 500 Kcal (năng lượng cao)' },
]

export function getRecipeFilterOptions(): RecipeFilterOptions {
  const SORT_OPTIONS: SelectOption[] = (
    Object.keys(SORT_LABELS) as RecipeSortOption[]
  ).map((k) => ({ value: k, label: SORT_LABELS[k] }))
  return {
    categoryPills: CATEGORY_PILLS,
    dietPills: DIET_PILLS,
    cookTimeOptions: COOKTIME_OPTIONS,
    kcalOptions: KCAL_OPTIONS,
    sortOptions: SORT_OPTIONS,
  }
}

// ---------- Real Backend Interfaces & Adapters ----------
interface BackendRecipeSummary {
  id: string
  name: string
  categoryId: string
  categoryName: string
  servings: number
  prepTimeMinutes: number
  cookTimeMinutes: number
  imageUrl: string | null
  caloriesPerServing: number | null
  isActive: boolean
  dietaryAssessments?: Array<{ dietaryType: number; status: number }>
}

interface BackendRecipeResponse {
  id: string
  categoryId: string
  name: string
  description: string | null
  servings: number
  instructions: string
  prepTimeMinutes: number
  cookTimeMinutes: number
  imageUrl: string | null
  caloriesPerServing: number | null
  proteinGramPerServing: number | null
  carbohydrateGramPerServing: number | null
  fatGramPerServing: number | null
  isActive: boolean
  createdAt: string
  updatedAt: string | null
  categoryName: string
  ingredients?: Array<{ ingredientId: string; name: string; isActive: boolean; quantity: number; unit: string; note: string | null }>
  dietaryAssessments?: Array<{ dietaryType: number; status: number }>
}

interface BackendRecipePage {
  items: BackendRecipeSummary[]
  pageNumber: number
  pageSize: number
  totalCount: number
}

function mapDietCategory(assessments?: Array<{ dietaryType: number; status: number }>): RecipeDietCategory {
  if (!assessments) return 'vegan'
  const isCompatible = (type: number) => assessments.some((a) => a.dietaryType === type && a.status === 1)
  if (isCompatible(1)) return 'vegan'
  if (isCompatible(4)) return 'ovo-lacto'
  if (isCompatible(2)) return 'lacto'
  if (isCompatible(3)) return 'ovo'
  return 'vegan'
}

function mapSummaryToRecipe(summary: BackendRecipeSummary): Recipe {
  const cookMin = summary.cookTimeMinutes || 20
  const prepMin = summary.prepTimeMinutes || 10
  const difficulty: RecipeDifficulty = cookMin <= 20 ? 'easy' : cookMin <= 40 ? 'medium' : 'hard'
  const dietCat = mapDietCategory(summary.dietaryAssessments)
  const fallbackImg =
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'
  const img = summary.imageUrl || fallbackImg

  return {
    id: summary.id,
    title: summary.name,
    description: `Công thức ${summary.name} chuẩn vị, dinh dưỡng cân bằng và thanh đạm.`,
    category: summary.categoryName,
    dietType: DIET_CATEGORY_LABELS[dietCat] || 'Thuần thực vật',
    prepTime: `${prepMin} phút`,
    cookTime: `${cookMin} phút`,
    totalTime: `${prepMin + cookMin} phút`,
    servings: summary.servings || 2,
    calories: summary.caloriesPerServing ? Math.round(summary.caloriesPerServing) : 320,
    imageUrl: img,
    coverImage: img,
    cookTimeMinutes: cookMin,
    prepTimeMinutes: prepMin,
    servingSize: summary.servings || 2,
    dietCategory: dietCat,
    difficulty,
    isFavorite: false,
    favoriteCount: 0,
    viewCount: 0,
    authorName: 'Bếp Chay An Yên',
    authorAvatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    tags: [summary.categoryName, DIET_CATEGORY_LABELS[dietCat]].filter(Boolean),
    ingredients: [],
    steps: [],
    nutrition: {
      kcal: summary.caloriesPerServing ? Math.round(summary.caloriesPerServing) : 320,
      proteinG: 15,
      carbsG: 35,
      fatG: 10,
    },
    publishedAt: new Date().toISOString(),
    relatedBlogs: [],
    relatedVideos: [],
    relatedRestaurants: [],
  }
}

function mapDetailToRecipe(detail: BackendRecipeResponse): Recipe {
  const cookMin = detail.cookTimeMinutes || 20
  const prepMin = detail.prepTimeMinutes || 10
  const difficulty: RecipeDifficulty = cookMin <= 20 ? 'easy' : cookMin <= 40 ? 'medium' : 'hard'
  const dietCat = mapDietCategory(detail.dietaryAssessments)
  const fallbackImg =
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'
  const img = detail.imageUrl || fallbackImg

  const rawSteps = detail.instructions
    ? detail.instructions
        .split(/\r?\n+/)
        .map((s) => s.trim())
        .filter(Boolean)
    : []
  const steps: RecipeStep[] = rawSteps.map((line, idx) => ({
    stepNo: idx + 1,
    stepNumber: idx + 1,
    title: `Bước ${idx + 1}`,
    description: line.replace(/^\d+[.)]\s*/, ''),
    instruction: line.replace(/^\d+[.)]\s*/, ''),
  }))

  const ingredients: RecipeIngredient[] = (detail.ingredients || []).map((ing) => ({
    id: ing.ingredientId,
    name: ing.name,
    amount: ing.quantity,
    unit: ing.unit,
    note: ing.note || '',
  }))

  return {
    id: detail.id,
    title: detail.name,
    description: detail.description || `Công thức ${detail.name} thanh đạm, dinh dưỡng cân bằng.`,
    category: detail.categoryName,
    dietType: DIET_CATEGORY_LABELS[dietCat] || 'Thuần thực vật',
    prepTime: `${prepMin} phút`,
    cookTime: `${cookMin} phút`,
    totalTime: `${prepMin + cookMin} phút`,
    servings: detail.servings || 2,
    calories: detail.caloriesPerServing ? Math.round(detail.caloriesPerServing) : 320,
    protein: detail.proteinGramPerServing ? Math.round(detail.proteinGramPerServing) : 15,
    carbs: detail.carbohydrateGramPerServing ? Math.round(detail.carbohydrateGramPerServing) : 35,
    fat: detail.fatGramPerServing ? Math.round(detail.fatGramPerServing) : 10,
    plantRatio: '100%',
    imageUrl: img,
    coverImage: img,
    cookTimeMinutes: cookMin,
    prepTimeMinutes: prepMin,
    servingSize: detail.servings || 2,
    dietCategory: dietCat,
    difficulty,
    isFavorite: false,
    favoriteCount: 0,
    viewCount: 0,
    authorName: 'Bếp Chay An Yên',
    authorAvatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    tags: [detail.categoryName, DIET_CATEGORY_LABELS[dietCat]].filter(Boolean),
    ingredients,
    steps,
    nutrition: {
      kcal: detail.caloriesPerServing ? Math.round(detail.caloriesPerServing) : 320,
      proteinG: detail.proteinGramPerServing ? Math.round(detail.proteinGramPerServing) : 15,
      carbsG: detail.carbohydrateGramPerServing ? Math.round(detail.carbohydrateGramPerServing) : 35,
      fatG: detail.fatGramPerServing ? Math.round(detail.fatGramPerServing) : 10,
    },
    publishedAt: detail.createdAt,
    relatedBlogs: [],
    relatedVideos: [],
    relatedRestaurants: [],
  }
}

// ---------- Public API ----------
export async function getRecipes(
  inputFilter: Partial<RecipeListFilter> = {},
): Promise<RecipeListResponse> {
  const applied: RecipeListFilter = { ...DEFAULT_RECIPE_FILTER, ...inputFilter }

  const dietMap: Record<string, number> = {
    vegan: 1,
    lacto: 2,
    ovo: 3,
    'ovo-lacto': 4,
  }

  const params = new URLSearchParams()
  if (applied.search?.trim()) params.set('search', applied.search.trim())
  if (applied.diet !== 'all' && dietMap[applied.diet]) {
    params.set('dietaryType', String(dietMap[applied.diet]))
  }
  params.set('pageNumber', '1')
  params.set('pageSize', '50')

  try {
    const res = await apiClient.get<BackendRecipePage>(`/api/recipes?${params.toString()}`, {
      requiresAuth: false,
    })
    if (res && Array.isArray(res.items)) {
      const items = res.items.map(mapSummaryToRecipe)
      return {
        items,
        totalCount: res.totalCount ?? items.length,
        appliedFilter: applied,
      }
    }
  } catch {
    // API error
  }

  return {
    items: [],
    totalCount: 0,
    appliedFilter: applied,
  }
}

export async function getRecipeDetail(id: string): Promise<Recipe | null> {
  try {
    const detail = await apiClient.get<BackendRecipeResponse>(`/api/recipes/${id}`, {
      requiresAuth: false,
    })
    if (detail && detail.id) {
      return mapDetailToRecipe(detail)
    }
  } catch {
    // Not found
  }

  return null
}

export async function toggleFavorite(
  id: string,
  nextState?: boolean,
): Promise<{ id: string; isFavorite: boolean; favoriteCount: number }> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  let isFavorite = nextState ?? true
  if (isUuid) {
    try {
      if (nextState !== false) {
        await apiClient.post('/api/favorites', { targetType: 'Recipe', targetId: id })
        isFavorite = true
      } else {
        const favs = await apiClient.get<{
          items: Array<{ id: string; targetId: string }>
        }>('/api/favorites?targetType=Recipe&pageSize=100')
        const matched = favs?.items?.find((f) => f.targetId.toLowerCase() === id.toLowerCase())
        if (matched?.id) {
          await apiClient.delete(`/api/favorites/${matched.id}`)
        }
        isFavorite = false
      }
    } catch {
      // Offline/unauthorized
    }
  }

  return { id, isFavorite, favoriteCount: isFavorite ? 1 : 0 }
}
