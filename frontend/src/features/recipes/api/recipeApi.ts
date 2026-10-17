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
import { DEFAULT_RECIPE_FILTER, SORT_LABELS } from '../types/recipe.types'

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
        excerpt: a.description ?? '',
        imageUrl:
          a.imageUrl ?? '',
        author: a.authorName ?? '',
        readTime: '',
        publishedAt: '',
        tags: [],
      }))
    }
  } catch (err) {
    console.error('[recipeApi.getRelatedArticles] Lỗi khi gọi /api/articles?pageSize=3', err);
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
          v.thumbnailUrl ?? '',
        duration: '',
        channel: '',
      }))
    }
  } catch (err) {
    console.error('[recipeApi.getRelatedVideos] Lỗi khi gọi /api/videos?pageSize=3', err);
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
          r.imageUrl ?? '',
        distanceKm: r.distanceKm == null ? null : Number(r.distanceKm),
      }))
    }
  } catch (err) {
    console.error('[recipeApi.getRelatedRestaurants] Lỗi khi gọi /api/restaurants?pageSize=2', err);
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
  { value: 'all', label: 'Tất cả' },
  { value: 'vegan', label: 'Thuần chay (Vegan)', cls: 'bg-[#E6F3EC] text-[#2E7D32] border-[#C8E6C9]' },
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

// ---------- 4 Core Vegetarian Diet Types ----------
export type CoreDietType =
  | 'Thuần chay (Vegan)'
  | 'Ăn chay có sữa (Lacto)'
  | 'Chay có trứng (Ovo)'
  | 'Trứng & Sữa (Lacto-ovo)'

export function resolveDietType(
  assessments?: Array<{ dietaryType: number | string; status: number | string }>,
  _title?: string,
): { dietType: string; dietCategory: RecipeDietCategory } {
  if (assessments && assessments.length > 0) {
    const isCompatible = (typeNum: number, typeName: string) =>
      assessments.some(
        (a) =>
          (a.dietaryType === typeNum ||
            String(a.dietaryType).toLowerCase() === typeName.toLowerCase()) &&
          (a.status === 1 || String(a.status).toLowerCase() === 'compatible'),
      )

    // Vegan is strictest
    if (isCompatible(1, 'Vegan')) {
      return { dietType: 'Thuần chay (Vegan)', dietCategory: 'vegan' }
    }

    const isLacto = isCompatible(2, 'LactoVegetarian')
    const isOvo = isCompatible(3, 'OvoVegetarian')
    const isLactoOvo = isCompatible(4, 'LactoOvoVegetarian')

    if (isLacto && !isOvo) {
      return { dietType: 'Ăn chay có sữa (Lacto)', dietCategory: 'lacto' }
    }
    if (isOvo && !isLacto) {
      return { dietType: 'Chay có trứng (Ovo)', dietCategory: 'ovo' }
    }
    if (isLactoOvo || (isLacto && isOvo)) {
      return { dietType: 'Trứng & Sữa (Lacto-ovo)', dietCategory: 'ovo-lacto' }
    }
  }

  return { dietType: 'Chưa đủ thông tin', dietCategory: 'unknown' }
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
  dietaryAssessments?: Array<{ dietaryType: number | string; status: number | string }>
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
  dietaryAssessments?: Array<{ dietaryType: number | string; status: number | string }>
}

interface BackendRecipePage {
  items: BackendRecipeSummary[]
  pageNumber: number
  pageSize: number
  totalCount: number
}

const DIVERSE_RECIPE_IMAGES = [
  'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=800&q=80',
]

function getFallbackRecipeImage(id: string, name?: string): string {
  const str = `${id}-${name || ''}`
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return DIVERSE_RECIPE_IMAGES[Math.abs(hash) % DIVERSE_RECIPE_IMAGES.length]
}

function mapSummaryToRecipe(summary: BackendRecipeSummary): Recipe {
  const cookMin = summary.cookTimeMinutes
  const prepMin = summary.prepTimeMinutes
  const difficulty: RecipeDifficulty = cookMin <= 20 ? 'easy' : cookMin <= 40 ? 'medium' : 'hard'
  const { dietType, dietCategory } = resolveDietType(summary.dietaryAssessments, summary.name)
  const img =
    summary.imageUrl && !summary.imageUrl.includes('photo-1546069901-ba9599a7e63c')
      ? summary.imageUrl
      : getFallbackRecipeImage(summary.id, summary.name)

  return {
    id: summary.id,
    title: summary.name,
    description: '',
    category: summary.categoryName,
    dietType,
    prepTime: `${prepMin} phút`,
    cookTime: `${cookMin} phút`,
    totalTime: `${prepMin + cookMin} phút`,
    servings: summary.servings,
    calories: summary.caloriesPerServing == null ? null : Math.round(summary.caloriesPerServing),
    imageUrl: img,
    coverImage: img,
    cookTimeMinutes: cookMin,
    prepTimeMinutes: prepMin,
    servingSize: summary.servings,
    dietCategory,
    difficulty,
    isFavorite: false,
    favoriteCount: 0,
    viewCount: 0,
    authorName: '',
    authorAvatar: '',
    tags: [summary.categoryName, dietType].filter(Boolean),
    ingredients: [],
    steps: [],
    nutrition: {
      kcal: summary.caloriesPerServing == null ? null : Math.round(summary.caloriesPerServing),
      proteinG: null,
      carbsG: null,
      fatG: null,
    },
    publishedAt: '',
    relatedBlogs: [],
    relatedVideos: [],
    relatedRestaurants: [],
  }
}

function mapDetailToRecipe(detail: BackendRecipeResponse): Recipe {
  const cookMin = detail.cookTimeMinutes
  const prepMin = detail.prepTimeMinutes
  const difficulty: RecipeDifficulty = cookMin <= 20 ? 'easy' : cookMin <= 40 ? 'medium' : 'hard'
  const { dietType, dietCategory } = resolveDietType(detail.dietaryAssessments, detail.name)
  const img =
    detail.imageUrl && !detail.imageUrl.includes('photo-1546069901-ba9599a7e63c')
      ? detail.imageUrl
      : getFallbackRecipeImage(detail.id, detail.name)

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

  const rawDesc = detail.description || ''
  const isMockDesc =
    rawDesc.includes('minh họa để kiểm thử') ||
    rawDesc.includes('không phải dữ liệu dinh dưỡng đã xác minh')
  const description = isMockDesc
    ? `Công thức ${detail.name} thanh đạm, dinh dưỡng cân bằng.`
    : rawDesc || `Công thức ${detail.name} thanh đạm, dinh dưỡng cân bằng.`

  return {
    id: detail.id,
    title: detail.name,
    description,
    category: detail.categoryName,
    dietType,
    prepTime: `${prepMin} phút`,
    cookTime: `${cookMin} phút`,
    totalTime: `${prepMin + cookMin} phút`,
    servings: detail.servings,
    calories: detail.caloriesPerServing == null ? null : Math.round(detail.caloriesPerServing),
    protein: detail.proteinGramPerServing == null ? null : Math.round(detail.proteinGramPerServing),
    carbs: detail.carbohydrateGramPerServing == null ? null : Math.round(detail.carbohydrateGramPerServing),
    fat: detail.fatGramPerServing == null ? null : Math.round(detail.fatGramPerServing),
    imageUrl: img,
    coverImage: img,
    cookTimeMinutes: cookMin,
    prepTimeMinutes: prepMin,
    servingSize: detail.servings,
    dietCategory,
    difficulty,
    isFavorite: false,
    favoriteCount: 0,
    viewCount: 0,
    authorName: '',
    authorAvatar: '',
    tags: [detail.categoryName, dietType].filter(Boolean),
    ingredients,
    steps,
    nutrition: {
      kcal: detail.caloriesPerServing == null ? null : Math.round(detail.caloriesPerServing),
      proteinG: detail.proteinGramPerServing == null ? null : Math.round(detail.proteinGramPerServing),
      carbsG: detail.carbohydrateGramPerServing == null ? null : Math.round(detail.carbohydrateGramPerServing),
      fatG: detail.fatGramPerServing == null ? null : Math.round(detail.fatGramPerServing),
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

  const res = await apiClient.get<BackendRecipePage>(`/api/recipes?${params.toString()}`, { requiresAuth: false })
  const items = res.items.map(mapSummaryToRecipe)
  return { items, totalCount: res.totalCount, appliedFilter: applied }
}

export async function getRecipeDetail(id: string): Promise<Recipe | null> {
  const url = `/api/recipes/${id}`
  try {
    const detail = await apiClient.get<BackendRecipeResponse>(url, {
      requiresAuth: false,
    })
    if (detail && detail.id) {
      return mapDetailToRecipe(detail)
    }
  } catch (err) {
    console.error(`[recipeApi.getRecipeDetail] Lỗi khi gọi API: ${url}`, err)
    return null
  }

  return null
}

export async function toggleFavorite(
  id: string,
  nextState?: boolean,
): Promise<{ id: string; isFavorite: boolean; favoriteCount: number }> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  if (!isUuid) throw new Error('Công thức không có ID hợp lệ.')
  let isFavorite = nextState ?? true
  if (isUuid) {
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
  }

  return { id, isFavorite, favoriteCount: isFavorite ? 1 : 0 }
}
