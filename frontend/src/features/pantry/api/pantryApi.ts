import { apiClient } from '../../../shared/api/apiClient'
import type {
  AddIngredientFormState,
  PantryCategory,
  PantryItem,
  PantrySuitability,
  RecipeMatch,
} from '../types/pantry.types'

/* ============ CATEGORY ORDER & STATIC HELPER DATA ============ */

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
  { name: 'Dầu mè', emoji: '🍱', cls: 'bg-[#FCE7F3] text-[#9D174D]' },
]

export async function getPantryCategories(): Promise<
  Array<{ key: PantryCategory | 'all'; emoji: string; label: string }>
> {
  return CATEGORY_ORDER
}

export async function getQuickAddChips(): Promise<
  Array<{ name: string; emoji: string; cls: string }>
> {
  return QUICK_ADD_CHIPS
}

// ---------- 4 Core Vegetarian Diet Types & Evaluation Logic ----------
export type CoreDietType =
  | 'Thuần chay (Vegan)'
  | 'Ăn chay có sữa (Lacto)'
  | 'Chay có trứng (Ovo)'
  | 'Trứng & Sữa (Lacto-ovo)'

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
  let isSuitable: PantrySuitability = backendItem.dietaryCompatibility === 'Compatible' ? 'suitable' : 'unchecked'
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
  const items = await apiClient.get<BackendPantryItem[]>('/api/pantry/items')
  const mapped = items.map(mapBackendPantryItem)
  return category === 'all' ? mapped : mapped.filter((item) => item.category === category)
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
    return mapBackendPantryItem(created)
  }

  throw new Error('Không thể thêm nguyên liệu vào tủ bếp.')
}

export async function deletePantryItem(id: string): Promise<{ deleted: boolean; remaining: number }> {
  const url = `/api/pantry/items/${id}`
  try {
    await apiClient.delete(url)
    return { deleted: true, remaining: 0 }
  } catch (err) {
    console.error('[pantryApi.deletePantryItem] Lỗi khi gọi API: ' + url, err)
    return { deleted: false, remaining: 0 }
  }
}

export async function updatePantryItem(
  id: string,
  data: { name: string; quantity?: number; unit?: string },
): Promise<PantryItem | null> {
  const url = `/api/pantry/items/${id}`
  try {
    const updated = await apiClient.put<BackendPantryItem>(url, {
      name: data.name.trim(),
      quantity: data.quantity ?? 1,
      unit: data.unit?.trim() || 'g',
    })
    if (updated && updated.id) {
      return mapBackendPantryItem(updated)
    }
    return null
  } catch (err) {
    console.error('[pantryApi.updatePantryItem] Lỗi khi gọi API: ' + url, err)
    return null
  }
}

export async function getRecipeMatches(_pantry: PantryItem[]): Promise<RecipeMatch[]> {
  const suggestions = await apiClient.get<BackendPantryRecipeSuggestion[]>(
    '/api/pantry/recipe-suggestions',
  )
  if (suggestions && Array.isArray(suggestions) && suggestions.length > 0) {
    return suggestions.map((s) => ({
      id: s.recipeId,
      title: s.recipeName,
      subtitle: `${s.totalTimeMinutes} phút · ${s.servings} khẩu phần`,
      cover:
        s.imageUrl ?? '',
      timeMin: s.totalTimeMinutes,
      kcal: s.caloriesPerServing == null ? null : Math.round(s.caloriesPerServing),
      tag: 'Gợi ý từ tủ bếp',
      matchedIngredients: s.availableIngredients.map((i) => i.name),
      totalIngredients: s.availableIngredients.length + s.missingIngredients.length,
      missingList: s.missingIngredients.map((i) => i.name),
      matchPercent: Math.round(Number(s.matchPercent)),
    }))
  }

  return []
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
  const url = `/api/pantry/items/${pantryItemId}/substitution-candidates`
  try {
    const res = await apiClient.get<PantrySubstitutionCandidate[]>(url)
    if (res && Array.isArray(res)) return res
  } catch (err) {
    console.error('[pantryApi.getSubstitutionCandidates] Lỗi khi gọi API: ' + url, err)
  }
  return []
}
