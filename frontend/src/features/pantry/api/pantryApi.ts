import { apiClient } from '../../../shared/api/apiClient'
import type {
  AddIngredientFormState,
  PantryCategory,
  PantryItem,
  PantrySuitability,
  RecipeMatch,
} from '../types/pantry.types'

/* ============ CATEGORY ORDER & STATIC HELPER DATA (moved from PantryPage) ============ */

export const CATEGORY_ORDER: Array<{ key: PantryCategory | 'all'; emoji: string; label: string }> = [
  { key: 'all', emoji: '🥗', label: 'Tất cả' },
  { key: 'rau-cu-qua', emoji: '🥬', label: 'Rau củ' },
  { key: 'dau-mem-san-xuat', emoji: '🫘', label: 'Đậu & đậu phụ' },
  { key: 'hat-ngu-coc', emoji: '🌾', label: 'Hạt & ngũ cốc' },
  { key: 'gia-vi', emoji: '🧂', label: 'Gia vị' },
  { key: 'nam', emoji: '🍄', label: 'Nấm' },
  { key: 'trai-cay', emoji: '🍎', label: 'Trái cây' },
  { key: 'sua-hat', emoji: '🥛', label: 'Sữa hạt' },
  { key: 'thuc-pham-che-bien', emoji: '🍱', label: 'TP chế biến' },
  { key: 'khac', emoji: '📦', label: 'Khác' },
]

export const QUICK_ADD_CHIPS: Array<{ name: string; emoji: string; cls: string }> = [
  { name: 'Đậu hũ', emoji: '🫘', cls: 'bg-[#FEF3C7] text-[#92400E]' },
  { name: 'Nấm rơm', emoji: '🍄', cls: 'bg-[#FEF3C7] text-[#92400E]' },
  { name: 'Cà chua', emoji: '🍅', cls: 'bg-[#FEF3C7] text-[#92400E]' },
  { name: 'Bí đỏ', emoji: '🎃', cls: 'bg-[#FCE7F3] text-[#9D174D]' },
  { name: 'Đậu cô ve', emoji: '🌰', cls: 'bg-[#FCE7F3] text-[#9D174D]' },
  { name: 'Hạt sen', emoji: '🌰', cls: 'bg-[#FCE7F3] text-[#9D174D]' },
  { name: 'Dầu hào', emoji: '🍱', cls: 'bg-[#FCE7F3] text-[#9D174D]' },
  { name: 'Trứng gà', emoji: '🥚', cls: 'bg-[#FEF3C7] text-[#92400E]' },
]

export async function getPantryCategories(): Promise<
  Array<{ key: PantryCategory | 'all'; emoji: string; label: string }>
> {
  await new Promise((r) => setTimeout(r, 500))
  return CATEGORY_ORDER
}

export async function getQuickAddChips(): Promise<
  Array<{ name: string; emoji: string; cls: string }>
> {
  await new Promise((r) => setTimeout(r, 500))
  return QUICK_ADD_CHIPS
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Note: Pantry items are fetched directly from Backend API (/api/pantry/items)

const INITIAL_PANTRY: PantryItem[] = [
  {
    id: 'init-1',
    name: 'Đậu phụ tươi (vớ giấy)',
    quantity: 400,
    unit: 'g',
    category: 'dau-mem-san-xuat',
    isSuitable: 'suitable',
    suitableNote:
      'Đậu phụ truyền thống làm từ sữa đậu nành, thường phù hợp với chế độ thuần thực vật. Nếu sản phẩm có keo đông đặc, hãy xem kỹ thành phần phụ gia.',
    addedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
  },
  {
    id: 'init-2',
    name: 'Cà chua bi hữu cơ',
    quantity: 250,
    unit: 'g',
    category: 'rau-cu-qua',
    isSuitable: 'suitable',
    suitableNote: 'Rau củ tươi, phù hợp thuần thực vật.',
    addedAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
  },
  {
    id: 'init-3',
    name: 'Gạo lứt huyết rồng',
    quantity: 1,
    unit: 'kg',
    category: 'hat-ngu-coc',
    isSuitable: 'suitable',
    suitableNote: 'Ngũ cốc nguyên hạt, an toàn với chế độ thuần thực vật.',
    addedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'init-4',
    name: 'Nấm hương khô',
    quantity: 80,
    unit: 'g',
    category: 'nam',
    isSuitable: 'suitable',
    suitableNote: 'Nấm là nguồn umami thuần thực vật phổ biến.',
    addedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'init-5',
    name: 'Hạt chia đen hữu cơ',
    quantity: 200,
    unit: 'g',
    category: 'hat-ngu-coc',
    isSuitable: 'suitable',
    suitableNote: 'Thay thế trứng trong làm bánh, cung cấp omega-3 thực vật.',
    addedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'init-6',
    name: 'Sữa chua thực vật (hạt điều)',
    quantity: 500,
    unit: 'ml',
    category: 'sua-hat',
    isSuitable: 'warning',
    suitableNote:
      'Sản phẩm thường là thuần thực vật nhưng có thể chứa sữa hoặc casein ẩn. Kiểm tra kỹ nhãn sản phẩm trước khi sử dụng.',
    addedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
]

// Công thức tham chiếu với danh sách nguyên liệu cần, dùng để tính % khớp
interface ReferenceRecipe {
  id: string
  title: string
  subtitle: string
  cover: string
  timeMin: number
  kcal: number
  tag: string
  ingredients: string[]
}

const REFERENCE_RECIPES: ReferenceRecipe[] = [
  {
    id: 'dau-hu-xot-ca-chua',
    title: 'Đậu Hũ Xốt Cà Chua Nấm Hương',
    subtitle: '20 phút · Dễ · Bữa trưa',
    cover:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Vegan%20tofu%20stir%20fry%20tomato%20sauce%20shiitake%20mushroom%20scallion%20top%20view%20family%20meal&image_size=square',
    timeMin: 20,
    kcal: 480,
    tag: 'Lunch · Vegan',
    ingredients: [
      'Đậu phụ',
      'Cà chua',
      'Nấm hương',
      'Gạo lứt',
      'Hành lá',
      'Dầu nành',
      'Tiêu',
      'Muối',
      'Đường nâu',
    ],
  },
  {
    id: 'chia-pudding-cam',
    title: 'Chia Pudding Cam & Thơm',
    subtitle: '10 phút + 3h ngủ đông · Bữa sáng',
    cover:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Vegan%20chia%20pudding%20with%20orange%20pineapple%20coconut%20cream%20topping%20clean%20morning%20light%20top%20view&image_size=square',
    timeMin: 10,
    kcal: 330,
    tag: 'Breakfast · Meal prep',
    ingredients: [
      'Hạt chia',
      'Sữa hạt điều',
      'Cà chua',
      'Cam',
      'Thơm',
      'Mật ong',
      'Quế',
    ],
  },
  {
    id: 'com-lut-nam-cai',
    title: 'Cơm Lứt Rang Nấm & Rau Cải',
    subtitle: '12 phút · Tận dụng cơm nguội',
    cover:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Vegan%20brown%20rice%20mushroom%20stir%20fry%20kale%20scallion%20wok%20style%20top%20view&image_size=square',
    timeMin: 12,
    kcal: 520,
    tag: 'Save time · Lunch',
    ingredients: [
      'Gạo lứt',
      'Nấm hương',
      'Rau cải',
      'Cà chua',
      'Hành tây',
      'Tỏi',
      'Dầu nành',
      'Xì dầu nấm',
    ],
  },
  {
    id: 'salad-dau-hu-chia',
    title: 'Salad Đậu Hũ Hạt Chia Vinaigrette',
    subtitle: '15 phút · Cool · Low calo',
    cover:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Vegan%20tofu%20chia%20salad%20greens%20cherry%20tomato%20vinaigrette%20dressing%20bright%20top%20view&image_size=square',
    timeMin: 15,
    kcal: 290,
    tag: 'Salad · Summer',
    ingredients: [
      'Đậu phụ',
      'Hạt chia',
      'Cà chua',
      'Rau xà lách',
      'Hạt điều',
      'Giấm táo',
      'Dầu olive',
      'Đường nâu',
    ],
  },
  {
    id: 'sua-chua-lam-banh',
    title: 'Sữa Chua Hạt Điều Phủ Trái Cây',
    subtitle: '5 phút · Dessert · Bữa phụ',
    cover:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Vegan%20cashew%20yogurt%20bowl%20berries%20granola%20mint%20leaf%20top%20view%20clean%20aesthetic&image_size=square',
    timeMin: 5,
    kcal: 260,
    tag: 'Snack · Chill',
    ingredients: [
      'Sữa chua thực vật',
      'Quế',
      'Cam',
      'Hạt chia',
      'Granola',
      'Dâu tây',
    ],
  },
  {
    id: 'sup-ca-chua-nam',
    title: 'Canh Chua Nấm Đậu Phụ Thuần Thực Vật',
    subtitle: '25 phút · Ẩm thực · 4 người',
    cover:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Vegan%20vietnamese%20canh%20chua%20tofu%20pineapple%20tomato%20mushroom%20herbs%20bright%20bowl&image_size=square',
    timeMin: 25,
    kcal: 210,
    tag: 'Vietnamese · Soup',
    ingredients: [
      'Đậu phụ',
      'Cà chua',
      'Thơm',
      'Nấm hương',
      'Giấm táo',
      'Tamarind',
      'Rau ngò',
      'Đậu bắp',
    ],
  },
]

let inMemoryPantry: PantryItem[] = [...INITIAL_PANTRY]

// ---------- Real Backend Interfaces & Adapters ----------
interface BackendPantryItem {
  id: string
  ingredientId: string | null
  name: string
  isCatalogMatched: boolean
  quantity: number | null
  unit: string | null
  profileDiet: string | null
  dietaryCompatibility: 'Compatible' | 'Incompatible' | 'Unknown' | null
  dietaryNotice: string | null
  allergenWarnings: string[]
  avoidedFoodWarnings: string[]
  createdAt: string
  updatedAt: string | null
}

interface BackendPantryRecipeSuggestion {
  recipeId: string
  recipeName: string
  imageUrl: string | null
  servings: number
  totalTimeMinutes: number
  caloriesPerServing: number | null
  matchPercent: number
  availableIngredients: Array<{ ingredientId: string; name: string; quantity: number; unit: string; isAvailable: boolean }>
  missingIngredients: Array<{ ingredientId: string; name: string; quantity: number; unit: string; isAvailable: boolean }>
}

function inferCategoryFromName(name: string): PantryCategory {
  const lower = name.toLowerCase()
  if (/(cải|rau|xà lách|cà chua|bí|cà rốt|dưa|ngò|hành|tỏi)/.test(lower)) return 'rau-cu-qua'
  if (/(đậu|tofu|tàu hũ)/.test(lower)) return 'dau-mem-san-xuat'
  if (/(hạt|gạo|yến mạch|chia|mè|đậu xanh|đậu đỏ)/.test(lower)) return 'hat-ngu-coc'
  if (/(nấm|nấm hương|mộc nhĩ)/.test(lower)) return 'nam'
  if (/(muối|tiêu|đường|dầu|nước tương|xì dầu|giấm)/.test(lower)) return 'gia-vi'
  if (/(sữa|sữa hạt|sữa chua)/.test(lower)) return 'sua-hat'
  if (/(cam|chuối|táo|xoài|thơm|dứa)/.test(lower)) return 'trai-cay'
  if (/(chả|xúc xích|nem)/.test(lower)) return 'thuc-pham-che-bien'
  return 'khac'
}

function mapBackendPantryItem(backendItem: BackendPantryItem): PantryItem {
  let isSuitable: PantrySuitability = 'suitable'
  if (backendItem.dietaryCompatibility === 'Incompatible') {
    isSuitable = 'unsuitable'
  } else if (
    (backendItem.allergenWarnings && backendItem.allergenWarnings.length > 0) ||
    (backendItem.avoidedFoodWarnings && backendItem.avoidedFoodWarnings.length > 0)
  ) {
    isSuitable = 'warning'
  } else if (!backendItem.isCatalogMatched) {
    isSuitable = 'unchecked'
  }

  let note = backendItem.dietaryNotice || 'Đã kiểm tra kho nguyên liệu cá nhân'
  if (backendItem.allergenWarnings && backendItem.allergenWarnings.length > 0) {
    note = `Cảnh báo dị ứng: ${backendItem.allergenWarnings.join(', ')}`
  }

  return {
    id: backendItem.id,
    name: backendItem.name,
    quantity: backendItem.quantity ? Number(backendItem.quantity) : 1,
    unit: backendItem.unit || 'g',
    category: inferCategoryFromName(backendItem.name),
    isSuitable,
    suitableNote: note,
    addedAt: backendItem.createdAt,
  }
}

export async function getPantryItems(category: PantryCategory | 'all' = 'all'): Promise<PantryItem[]> {
  try {
    const backendItems = await apiClient.get<BackendPantryItem[]>('/api/pantry/items')
    if (backendItems && Array.isArray(backendItems)) {
      const mapped = backendItems.map(mapBackendPantryItem)
      inMemoryPantry = mapped
      if (category === 'all') return mapped
      return mapped.filter((p) => p.category === category)
    }
  } catch {
    // Return empty list if not logged in or error
  }

  return []
}

export async function addPantryItem(form: AddIngredientFormState): Promise<PantryItem> {
  const qty =
    Number.isFinite(Number(form.quantity)) && Number(form.quantity) > 0 ? Number(form.quantity) : 1
  const unitStr = form.unit.trim() || 'g'

  const created = await apiClient.post<BackendPantryItem>('/api/pantry/items', {
    name: form.name.trim(),
    quantity: qty,
    unit: unitStr,
  })

  if (created && created.id) {
    const mapped = mapBackendPantryItem(created)
    inMemoryPantry = [mapped, ...inMemoryPantry]
    return mapped
  }

  throw new Error('Không thể thêm nguyên liệu vào tủ bếp.')
}

export async function deletePantryItem(id: string): Promise<{ deleted: boolean; remaining: number }> {
  try {
    await apiClient.delete(`/api/pantry/items/${id}`)
    inMemoryPantry = inMemoryPantry.filter((p) => p.id !== id)
    return { deleted: true, remaining: inMemoryPantry.length }
  } catch {
    return { deleted: false, remaining: inMemoryPantry.length }
  }
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

function matchScore(pantryItemName: string, recipeIngredient: string): boolean {
  const a = tokenize(pantryItemName)
  const b = tokenize(recipeIngredient)
  if (a.length === 0 || b.length === 0) return false
  const setA = new Set(a)
  const overlap = b.filter((tok) => setA.has(tok))
  if (overlap.length === 0) return false
  if (overlap.length >= 2) return true
  if (overlap.length / b.length >= 0.5) return true
  return a.join(' ').includes(b.join(' ')) || b.join(' ').includes(a.join(' '))
}

export async function getRecipeMatches(pantry: PantryItem[]): Promise<RecipeMatch[]> {
  try {
    const suggestions = await apiClient.get<BackendPantryRecipeSuggestion[]>(
      '/api/pantry/recipe-suggestions',
    )
    if (suggestions && Array.isArray(suggestions) && suggestions.length > 0) {
      return suggestions.map((s) => ({
        id: s.recipeId,
        title: s.recipeName,
        subtitle: `${s.totalTimeMinutes} phút · ${s.servings} khẩu phần`,
        cover:
          s.imageUrl ||
          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
        timeMin: s.totalTimeMinutes,
        kcal: s.caloriesPerServing ? Math.round(s.caloriesPerServing) : 350,
        tag: 'Gợi ý từ tủ bếp',
        matchedIngredients: s.availableIngredients.map((i) => i.name),
        totalIngredients: s.availableIngredients.length + s.missingIngredients.length,
        missingList: s.missingIngredients.map((i) => i.name),
        matchPercent: Math.round(Number(s.matchPercent)),
      }))
    }
  } catch {
    // Fallback to client algorithm
  }

  await delay(300)
  const matches: RecipeMatch[] = REFERENCE_RECIPES.map((r) => {
    const matched: string[] = []
    r.ingredients.forEach((ing) => {
      const found = pantry.find((p) => matchScore(p.name, ing))
      if (found) matched.push(ing)
    })
    const uniqMatched = Array.from(new Set(matched))
    const missing = r.ingredients.filter((ing) => !uniqMatched.includes(ing))
    const total = r.ingredients.length
    const matchPercent = total === 0 ? 0 : Math.round((uniqMatched.length / total) * 100)
    return {
      id: r.id,
      title: r.title,
      subtitle: r.subtitle,
      cover: r.cover,
      timeMin: r.timeMin,
      kcal: r.kcal,
      tag: r.tag,
      matchedIngredients: uniqMatched,
      totalIngredients: total,
      missingList: missing,
      matchPercent,
    }
  })

  const filtered = matches
    .filter((m) => m.matchPercent >= 15)
    .sort((a, b) => {
      if (b.matchPercent !== a.matchPercent) return b.matchPercent - a.matchPercent
      return a.timeMin - b.timeMin
    })

  if (filtered.length < 4) {
    const extras = matches
      .filter((m) => !filtered.includes(m))
      .sort((a, b) => b.matchPercent - a.matchPercent)
      .slice(0, 4 - filtered.length)
    return [...filtered, ...extras].sort(
      (a, b) => b.matchPercent - a.matchPercent || a.timeMin - b.timeMin,
    )
  }
  return filtered
}

export interface PantrySubstitutionCandidate {
  ingredientId: string
  name: string
  defaultUnit: string | null
  dietaryCompatibility: string | null
  allergenWarnings: string[]
  avoidedFoodWarnings: string[]
}

export async function getSubstitutionCandidates(
  pantryItemId: string,
): Promise<PantrySubstitutionCandidate[]> {
  try {
    const res = await apiClient.get<PantrySubstitutionCandidate[]>(
      `/api/pantry/items/${pantryItemId}/substitution-candidates`,
    )
    if (res && Array.isArray(res)) return res
  } catch {
    // API error
  }
  return []
}

