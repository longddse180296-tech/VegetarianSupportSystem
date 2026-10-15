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
  title?: string,
): { dietType: CoreDietType; dietCategory: RecipeDietCategory } {
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

  // Fallback heuristics by title if assessments is empty or unknown
  if (title) {
    const lower = title.toLowerCase()
    const hasEgg = lower.includes('trứng')
    const hasMilk = lower.includes('sữa') || lower.includes('phô mai') || lower.includes('bơ')
    if (hasEgg && hasMilk) {
      return { dietType: 'Trứng & Sữa (Lacto-ovo)', dietCategory: 'ovo-lacto' }
    }
    if (hasMilk) {
      return { dietType: 'Ăn chay có sữa (Lacto)', dietCategory: 'lacto' }
    }
    if (hasEgg) {
      return { dietType: 'Chay có trứng (Ovo)', dietCategory: 'ovo' }
    }
  }

  return { dietType: 'Thuần chay (Vegan)', dietCategory: 'vegan' }
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

function mapSummaryToRecipe(summary: BackendRecipeSummary): Recipe {
  const cookMin = summary.cookTimeMinutes || 20
  const prepMin = summary.prepTimeMinutes || 10
  const difficulty: RecipeDifficulty = cookMin <= 20 ? 'easy' : cookMin <= 40 ? 'medium' : 'hard'
  const { dietType, dietCategory } = resolveDietType(summary.dietaryAssessments, summary.name)
  const fallbackImg =
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'
  const img = summary.imageUrl || fallbackImg

  return {
    id: summary.id,
    title: summary.name,
    description: `Công thức ${summary.name} chuẩn vị, dinh dưỡng cân bằng và thanh đạm.`,
    category: summary.categoryName,
    dietType,
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
    dietCategory,
    difficulty,
    isFavorite: false,
    favoriteCount: 0,
    viewCount: 0,
    authorName: 'Bếp Chay An Yên',
    authorAvatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    tags: [summary.categoryName, dietType].filter(Boolean),
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
  const { dietType, dietCategory } = resolveDietType(detail.dietaryAssessments, detail.name)
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
    dietType,
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
    dietCategory,
    difficulty,
    isFavorite: false,
    favoriteCount: 0,
    viewCount: 0,
    authorName: 'Bếp Chay An Yên',
    authorAvatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    tags: [detail.categoryName, dietType].filter(Boolean),
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

// ---------- Mock Recipes Fallback Data (4 Core Diet Types) ----------
export const MOCK_RECIPES: Recipe[] = [
  {
    id: '10000000-0000-0000-0000-000000000201',
    title: 'Cơm đậu hũ sốt nấm hương',
    description: 'Món ăn thuần chay đậm đà từ đậu hũ non mềm mịn sốt cùng nấm hương tươi và tiêu đen cay nhẹ.',
    category: 'Món chính',
    dietType: 'Thuần chay (Vegan)',
    dietCategory: 'vegan',
    difficulty: 'easy',
    prepTimeMinutes: 10,
    cookTimeMinutes: 20,
    prepTime: '10 phút',
    cookTime: '20 phút',
    totalTime: '30 phút',
    servings: 2,
    servingSize: 2,
    calories: 320,
    protein: 18,
    carbs: 35,
    fat: 9,
    plantRatio: '100%',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    coverImage: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    isFavorite: false,
    favoriteCount: 128,
    viewCount: 1420,
    authorName: 'Bếp Chay An Yên',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    tags: ['Món chính', 'Thuần chay (Vegan)', 'Giàu đạm thực vật'],
    ingredients: [
      { id: '1', name: 'Đậu hũ non', amount: 300, unit: 'g', note: 'cắt miếng vuông vừa ăn' },
      { id: '2', name: 'Nấm hương tươi', amount: 100, unit: 'g', note: 'rửa sạch, cắt lát' },
      { id: '3', name: 'Hành boaro', amount: 20, unit: 'g', note: 'băm nhỏ' },
      { id: '4', name: 'Nước tương chay', amount: 2, unit: 'muỗng canh', note: 'loại ngon' },
      { id: '5', name: 'Dầu hào chay', amount: 1, unit: 'muỗng canh' },
      { id: '6', name: 'Dầu mè', amount: 1, unit: 'muỗng cà phê' },
    ],
    steps: [
      {
        stepNo: 1,
        title: 'Sơ chế nguyên liệu',
        description: 'Đậu hũ ngâm nước muối loãng 5 phút, vớt ra thấm ráo nước rồi áp chảo vàng nhẹ các mặt.',
      },
      {
        stepNo: 2,
        title: 'Xào nấm và làm sốt',
        description: 'Phi thơm hành boaro với chút dầu ăn, cho nấm hương vào xào chín tới trong 3 phút, sau đó cho nước tương và dầu hào chay vào đảo đều.',
      },
      {
        stepNo: 3,
        title: 'Rim đậu hũ',
        description: 'Cho đậu hũ vào chảo sốt nấm, hạ nhỏ lửa rim 5-7 phút cho ngấm gia vị. Rắc thêm chút tiêu và rưới dầu mè trước khi tắt bếp.',
      },
    ],
    nutrition: {
      kcal: 320,
      proteinG: 18,
      carbsG: 35,
      fatG: 9,
      fiberG: 5,
    },
    publishedAt: '2026-03-15T08:00:00Z',
    relatedBlogs: [],
    relatedVideos: [],
    relatedRestaurants: [],
  },
  {
    id: '10000000-0000-0000-0000-000000000203',
    title: 'Cháo sữa yến mạch hạt sen',
    description: 'Cháo sữa ấm áp bổ dưỡng kết hợp yến mạch thơm bùi, hạt sen ngọt mát và sữa tươi thanh nhẹ.',
    category: 'Món phụ',
    dietType: 'Ăn chay có sữa (Lacto)',
    dietCategory: 'lacto',
    difficulty: 'easy',
    prepTimeMinutes: 5,
    cookTimeMinutes: 25,
    prepTime: '5 phút',
    cookTime: '25 phút',
    totalTime: '30 phút',
    servings: 2,
    servingSize: 2,
    calories: 250,
    protein: 12,
    carbs: 42,
    fat: 6,
    plantRatio: '95%',
    imageUrl: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80',
    coverImage: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80',
    isFavorite: false,
    favoriteCount: 94,
    viewCount: 890,
    authorName: 'Bếp Chay An Yên',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    tags: ['Món phụ', 'Ăn chay có sữa (Lacto)', 'Yến mạch'],
    ingredients: [
      { id: '1', name: 'Yến mạch cán dẹt', amount: 80, unit: 'g' },
      { id: '2', name: 'Sữa tươi thanh trùng', amount: 200, unit: 'ml', note: 'không đường hoặc ít đường' },
      { id: '3', name: 'Hạt sen tươi', amount: 50, unit: 'g', note: 'bỏ tâm sen' },
      { id: '4', name: 'Nước lọc', amount: 250, unit: 'ml' },
      { id: '5', name: 'Muối hồng', amount: 1, unit: 'nhúm nhỏ' },
    ],
    steps: [
      {
        stepNo: 1,
        title: 'Nấu mềm hạt sen',
        description: 'Cho hạt sen và nước lọc vào nồi đun sôi, hạ lửa nhỏ hầm 15 phút cho đến khi hạt sen chín mềm bùi.',
      },
      {
        stepNo: 2,
        title: 'Nấu yến mạch',
        description: 'Cho yến mạch vào nồi hạt sen, khuấy đều trên lửa vừa trong 5 phút đến khi cháo sánh mịn.',
      },
      {
        stepNo: 3,
        title: 'Hòa quyện sữa tươi',
        description: 'Rót sữa tươi vào cháo, nêm nhúm muối nhỏ, đun liu riu thêm 2 phút rồi múc ra bát thưởng thức khi còn ấm.',
      },
    ],
    nutrition: {
      kcal: 250,
      proteinG: 12,
      carbsG: 42,
      fatG: 6,
      fiberG: 4,
    },
    publishedAt: '2026-03-20T08:00:00Z',
    relatedBlogs: [],
    relatedVideos: [],
    relatedRestaurants: [],
  },
  {
    id: '10000000-0000-0000-0000-000000000202',
    title: 'Cơm trứng cuộn rong biển',
    description: 'Món ăn chay có trứng thơm lừng, lớp trứng vàng óng cuộn cùng rong biển giòn tan và cơm dẻo thơm.',
    category: 'Món chính',
    dietType: 'Chay có trứng (Ovo)',
    dietCategory: 'ovo',
    difficulty: 'easy',
    prepTimeMinutes: 5,
    cookTimeMinutes: 15,
    prepTime: '5 phút',
    cookTime: '15 phút',
    totalTime: '20 phút',
    servings: 1,
    servingSize: 1,
    calories: 350,
    protein: 16,
    carbs: 45,
    fat: 11,
    plantRatio: '85%',
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    coverImage: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    isFavorite: false,
    favoriteCount: 112,
    viewCount: 1100,
    authorName: 'Bếp Chay An Yên',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    tags: ['Món chính', 'Chay có trứng (Ovo)', 'Tiện lợi'],
    ingredients: [
      { id: '1', name: 'Trứng gà', amount: 2, unit: 'quả' },
      { id: '2', name: 'Cơm trắng', amount: 1, unit: 'chén nhỏ' },
      { id: '3', name: 'Lá rong biển nướng', amount: 2, unit: 'lá' },
      { id: '4', name: 'Hành hoa', amount: 10, unit: 'g', note: 'thái nhỏ' },
      { id: '5', name: 'Gia vị chay', amount: 1, unit: 'chút xíu' },
    ],
    steps: [
      {
        stepNo: 1,
        title: 'Đánh trứng',
        description: 'Đập trứng ra bát, cho hành hoa và chút hạt nêm chay vào đánh đều tay.',
      },
      {
        stepNo: 2,
        title: 'Rán và cuộn',
        description: 'Quét dầu vào chảo chống dính, đổ một lớp trứng mỏng rồi đặt lá rong biển lên trên và cuộn tròn khéo léo.',
      },
      {
        stepNo: 3,
        title: 'Hoàn thiện đĩa cơm',
        description: 'Cắt cuộn trứng thành từng khoanh đều tay và xếp bên cạnh chén cơm nóng.',
      },
    ],
    nutrition: {
      kcal: 350,
      proteinG: 16,
      carbsG: 45,
      fatG: 11,
      fiberG: 2,
    },
    publishedAt: '2026-03-25T08:00:00Z',
    relatedBlogs: [],
    relatedVideos: [],
    relatedRestaurants: [],
  },
  {
    id: '10000000-0000-0000-0000-000000000204',
    title: 'Trứng sữa hấp nấm phô mai',
    description: 'Sự kết hợp hoàn hảo giữa vị béo ngậy của sữa tươi, độ mịn mượt của trứng hấp và hương thơm nấm tươi.',
    category: 'Món phụ',
    dietType: 'Trứng & Sữa (Lacto-ovo)',
    dietCategory: 'ovo-lacto',
    difficulty: 'easy',
    prepTimeMinutes: 5,
    cookTimeMinutes: 15,
    prepTime: '5 phút',
    cookTime: '15 phút',
    totalTime: '20 phút',
    servings: 2,
    servingSize: 2,
    calories: 200,
    protein: 14,
    carbs: 8,
    fat: 12,
    plantRatio: '60%',
    imageUrl: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&w=800&q=80',
    coverImage: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&w=800&q=80',
    isFavorite: false,
    favoriteCount: 76,
    viewCount: 650,
    authorName: 'Bếp Chay An Yên',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    tags: ['Món phụ', 'Trứng & Sữa (Lacto-ovo)', 'Mềm mịn'],
    ingredients: [
      { id: '1', name: 'Trứng gà', amount: 2, unit: 'quả' },
      { id: '2', name: 'Sữa tươi không đường', amount: 150, unit: 'ml' },
      { id: '3', name: 'Nấm đùi gà baby', amount: 50, unit: 'g', note: 'xắt hạt lựu' },
      { id: '4', name: 'Phô mai sợi', amount: 20, unit: 'g' },
    ],
    steps: [
      {
        stepNo: 1,
        title: 'Khuấy hỗn hợp trứng sữa',
        description: 'Đánh tan trứng cùng sữa tươi, lọc qua rây để trứng mịn mượt không bị bọt khí.',
      },
      {
        stepNo: 2,
        title: 'Thêm nấm và phô mai',
        description: 'Xếp nấm vào thố chịu nhiệt, rót hỗn hợp trứng sữa vào rồi rắc phô mai lên trên mặt.',
      },
      {
        stepNo: 3,
        title: 'Hấp cách thủy',
        description: 'Đậy nắp thố và hấp lửa vừa trong 12-15 phút đến khi trứng đông mịn như thạch.',
      },
    ],
    nutrition: {
      kcal: 200,
      proteinG: 14,
      carbsG: 8,
      fatG: 12,
      fiberG: 1,
    },
    publishedAt: '2026-03-28T08:00:00Z',
    relatedBlogs: [],
    relatedVideos: [],
    relatedRestaurants: [],
  },
  {
    id: '10000000-0000-0000-0000-000000000205',
    title: 'Sữa ấm mật ong quế',
    description: 'Thức uống an thần nhẹ nhàng giúp thư giãn buổi tối với sữa tươi ấm béo ngậy và mật ong ngọt thanh.',
    category: 'Đồ uống',
    dietType: 'Ăn chay có sữa (Lacto)',
    dietCategory: 'lacto',
    difficulty: 'easy',
    prepTimeMinutes: 5,
    cookTimeMinutes: 5,
    prepTime: '5 phút',
    cookTime: '5 phút',
    totalTime: '10 phút',
    servings: 1,
    servingSize: 1,
    calories: 150,
    protein: 8,
    carbs: 22,
    fat: 5,
    plantRatio: '70%',
    imageUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80',
    coverImage: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80',
    isFavorite: false,
    favoriteCount: 65,
    viewCount: 540,
    authorName: 'Bếp Chay An Yên',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    tags: ['Đồ uống', 'Ăn chay có sữa (Lacto)', 'Thư giãn'],
    ingredients: [
      { id: '1', name: 'Sữa tươi nguyên kem', amount: 200, unit: 'ml' },
      { id: '2', name: 'Mật ong nguyên chất', amount: 1, unit: 'muỗng canh' },
      { id: '3', name: 'Bột quế', amount: 1, unit: 'nhúm nhỏ' },
    ],
    steps: [
      {
        stepNo: 1,
        title: 'Hâm nóng sữa',
        description: 'Cho sữa vào nồi nhỏ đun trên lửa liu riu đến khoảng 60 độ C (không để sôi sùng sục).',
      },
      {
        stepNo: 2,
        title: 'Khuấy mật ong',
        description: 'Rót sữa ra ly, cho mật ong vào khuấy đều cho tan hoàn toàn.',
      },
      {
        stepNo: 3,
        title: 'Thưởng thức',
        description: 'Rắc một chút bột quế lên trên lớp bọt sữa và thưởng thức ngay khi còn ấm.',
      },
    ],
    nutrition: {
      kcal: 150,
      proteinG: 8,
      carbsG: 22,
      fatG: 5,
      fiberG: 0,
    },
    publishedAt: '2026-03-30T08:00:00Z',
    relatedBlogs: [],
    relatedVideos: [],
    relatedRestaurants: [],
  },
  {
    id: 'dau-hu-sot-nam',
    title: 'Đậu hũ sốt nấm hương',
    description: 'Món ăn thuần chay đậm đà từ đậu hũ non mềm mịn sốt cùng nấm hương tươi và tiêu đen cay nhẹ.',
    category: 'Món chính',
    dietType: 'Thuần chay (Vegan)',
    dietCategory: 'vegan',
    difficulty: 'easy',
    prepTimeMinutes: 10,
    cookTimeMinutes: 20,
    prepTime: '10 phút',
    cookTime: '20 phút',
    totalTime: '30 phút',
    servings: 2,
    servingSize: 2,
    calories: 320,
    protein: 18,
    carbs: 35,
    fat: 9,
    plantRatio: '100%',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    coverImage: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    isFavorite: false,
    favoriteCount: 128,
    viewCount: 1420,
    authorName: 'Bếp Chay An Yên',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    tags: ['Món chính', 'Thuần chay (Vegan)', 'Giàu đạm thực vật'],
    ingredients: [
      { id: '1', name: 'Đậu hũ non', amount: 300, unit: 'g', note: 'cắt miếng vuông vừa ăn' },
      { id: '2', name: 'Nấm hương tươi', amount: 100, unit: 'g', note: 'rửa sạch, cắt lát' },
      { id: '3', name: 'Hành boaro', amount: 20, unit: 'g', note: 'băm nhỏ' },
      { id: '4', name: 'Nước tương chay', amount: 2, unit: 'muỗng canh' },
      { id: '5', name: 'Dầu hào chay', amount: 1, unit: 'muỗng canh' },
      { id: '6', name: 'Dầu mè', amount: 1, unit: 'muỗng cà phê' },
    ],
    steps: [
      {
        stepNo: 1,
        title: 'Sơ chế nguyên liệu',
        description: 'Đậu hũ ngâm nước muối loãng 5 phút, vớt ra thấm ráo nước rồi áp chảo vàng nhẹ các mặt.',
      },
      {
        stepNo: 2,
        title: 'Xào nấm và làm sốt',
        description: 'Phi thơm hành boaro với chút dầu ăn, cho nấm hương vào xào chín tới trong 3 phút, sau đó cho nước tương và dầu hào chay vào đảo đều.',
      },
      {
        stepNo: 3,
        title: 'Rim đậu hũ',
        description: 'Cho đậu hũ vào chảo sốt nấm, hạ nhỏ lửa rim 5-7 phút cho ngấm gia vị. Rắc thêm chút tiêu và rưới dầu mè trước khi tắt bếp.',
      },
    ],
    nutrition: {
      kcal: 320,
      proteinG: 18,
      carbsG: 35,
      fatG: 9,
      fiberG: 5,
    },
    publishedAt: '2026-03-15T08:00:00Z',
    relatedBlogs: [],
    relatedVideos: [],
    relatedRestaurants: [],
  },
]

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
    if (res && Array.isArray(res.items) && res.items.length > 0) {
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

  // Fallback to MOCK_RECIPES
  let filtered = [...MOCK_RECIPES]
  if (applied.search?.trim()) {
    const q = applied.search.toLowerCase()
    filtered = filtered.filter((r) => r.title.toLowerCase().includes(q))
  }
  if (applied.diet !== 'all') {
    filtered = filtered.filter((r) => r.dietCategory === applied.diet)
  }

  return {
    items: filtered,
    totalCount: filtered.length,
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
    // API error
  }

  // Fallback to mock recipes by id, suffix or title
  const cleanId = id.toLowerCase()
  const matched =
    MOCK_RECIPES.find(
      (m) =>
        m.id.toLowerCase() === cleanId ||
        cleanId.endsWith(m.id.toLowerCase()) ||
        m.id.toLowerCase().endsWith(cleanId),
    ) || MOCK_RECIPES[0]

  return matched ? { ...matched } : null
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
