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

export function evaluateIngredientForDiet(
  name: string,
  diet: CoreDietType,
): { isSuitable: PantrySuitability; note: string } {
  const lower = name.toLowerCase().trim()

  // 0. Nhãn chay / thuần thực vật rõ ràng
  if (/(chay|vegan|thực vật)/.test(lower)) {
    return {
      isSuitable: 'suitable',
      note: 'Sản phẩm thuần thực vật an toàn.',
    }
  }

  // 1. Thịt / hải sản / mỡ động vật / gelatin (Vi phạm cho tất cả 4 chế độ ăn chay)
  const isMeatOrSeafood =
    /(thịt|bò|heo|lợn|gà|vịt|chim|cá|tôm|cua|mực|hàu|dầu hào|sốt dầu hào|sò|ốc|mỡ|bì|pate|xúc xích|chả lụa|giò lụa|nước mắm|mắm tôm|mắm tép|mắm cá|gelatin)/.test(
      lower,
    )
  if (isMeatOrSeafood) {
    return {
      isSuitable: 'unsuitable',
      note: 'Chứa thịt/hải sản/mỡ động vật — không phù hợp ăn chay.',
    }
  }

  // 2. Trứng (Chỉ hợp lệ cho Ovo và Lacto-ovo)
  const isEgg = /(trứng|lòng đỏ|lòng trắng|mayonnaise)/.test(lower)
  if (isEgg) {
    if (diet === 'Chay có trứng (Ovo)' || diet === 'Trứng & Sữa (Lacto-ovo)') {
      return {
        isSuitable: 'suitable',
        note: 'Hợp lệ theo chế độ ăn chay có trứng.',
      }
    }
    return {
      isSuitable: 'unsuitable',
      note: 'Chứa trứng gia cầm — không phù hợp với chế độ ăn này.',
    }
  }

  // 3. Sữa & chế phẩm sữa động vật (Chỉ hợp lệ cho Lacto và Lacto-ovo)
  const isPlantMilkOrButter =
    /(sữa hạt|sữa đậu|sữa hạnh nhân|sữa dừa|sữa yến mạch|bơ đậu phộng|bơ lạc|bơ hạt|trái bơ|quả bơ)/.test(
      lower,
    )
  const isDairy =
    /(sữa bò|sữa đặc|sữa tươi|phô mai|phomai|cheese|váng sữa|whey)/.test(lower) ||
    (/(sữa|bơ)/.test(lower) && !isPlantMilkOrButter)

  if (isDairy) {
    if (diet === 'Ăn chay có sữa (Lacto)' || diet === 'Trứng & Sữa (Lacto-ovo)') {
      return {
        isSuitable: 'suitable',
        note: 'Hợp lệ theo chế độ ăn chay có sữa.',
      }
    }
    return {
      isSuitable: 'unsuitable',
      note: 'Chứa sữa/chế phẩm từ sữa động vật — không phù hợp với chế độ ăn này.',
    }
  }

  // 4. Mật ong (Vi phạm với Thuần chay, hợp lệ với các chế độ còn lại)
  if (/mật ong/.test(lower)) {
    if (diet === 'Thuần chay (Vegan)') {
      return {
        isSuitable: 'unsuitable',
        note: 'Chứa mật ong — không phù hợp với chế độ Thuần chay.',
      }
    }
    return {
      isSuitable: 'suitable',
      note: 'Hợp lệ theo chế độ ăn chay.',
    }
  }

  // 5. Mặc định là nguyên liệu thực vật
  return {
    isSuitable: 'suitable',
    note: 'Nguồn gốc thực vật an toàn.',
  }
}

export function getSubstitutionForIngredient(
  name: string,
  _diet?: CoreDietType,
): {
  replacementName: string
  category: PantryCategory
  icon: string
  description: string
} {
  const lower = name.toLowerCase().trim()

  if (/(trứng|lòng đỏ|lòng trắng|mayonnaise)/.test(lower)) {
    return {
      replacementName: 'Đậu hũ non xào bột nghệ (Tofu Scramble)',
      category: 'dau-mem-san-xuat',
      icon: '🥚',
      description: 'Cung cấp kết cấu mềm xốp và đạm thực vật tương đương trứng gà.',
    }
  }

  if (/(dầu hào|sốt dầu hào|hàu)/.test(lower)) {
    return {
      replacementName: 'Dầu hào chay từ nấm hương',
      category: 'gia-vi',
      icon: '🍄',
      description: 'Đậm đà vị umami tự nhiên từ nấm đông cô cô đặc, chuẩn vị xào truyền thống.',
    }
  }

  if (/(nước mắm|mắm)/.test(lower)) {
    return {
      replacementName: 'Nước mắm chay từ dứa & nấm hương',
      category: 'gia-vi',
      icon: '🍶',
      description: 'Lên men tự nhiên từ dứa tươi và nấm, vị mặn ngọt thanh nhẹ chuẩn vị.',
    }
  }

  if (/(thịt bò|bò)/.test(lower)) {
    return {
      replacementName: 'Nấm đùi gà áp chảo sốt tiêu đen',
      category: 'nam',
      icon: '🥩',
      description: 'Thớ nấm dai giòn đậm đà, giàu chất xơ và đạm thực vật sạch.',
    }
  }

  if (/(thịt gà|gà)/.test(lower)) {
    return {
      replacementName: 'Nấm bào ngư xé sợi & Đậu hũ non',
      category: 'dau-mem-san-xuat',
      icon: '🍗',
      description: 'Vị ngọt thanh và dai ngon tự nhiên, thay thế tuyệt hảo cho món súp và xào.',
    }
  }

  if (/(thịt heo|thịt lợn|thịt|chả lụa|giò lụa|xúc xích|pate|bì|mỡ)/.test(lower)) {
    return {
      replacementName: 'Chả lụa chay từ tàu hũ ky',
      category: 'thuc-pham-che-bien',
      icon: '🥓',
      description: 'Làm từ 100% váng đậu nành nguyên chất, dai giòn thơm ngon.',
    }
  }

  if (/(cá|tôm|cua|mực|hải sản|ốc|sò)/.test(lower)) {
    return {
      replacementName: 'Chả cá chay rong biển & Đậu hũ ky',
      category: 'thuc-pham-che-bien',
      icon: '🐟',
      description: 'Thơm nhẹ hương vị biển từ rong biển lá hữu cơ và đậu nành.',
    }
  }

  if (/(sữa|phô mai|cheese|váng sữa|bơ)/.test(lower)) {
    return {
      replacementName: 'Sữa yến mạch hữu cơ & Bơ thực vật',
      category: 'sua-hat',
      icon: '🥛',
      description: 'Béo bùi tự nhiên từ hạt thực vật nguyên cám, không chứa lactose động vật.',
    }
  }

  if (/(mật ong)/.test(lower)) {
    return {
      replacementName: 'Siro cây phong (Maple Syrup) hoặc Mật mía',
      category: 'gia-vi',
      icon: '🍯',
      description: 'Vị ngọt dịu thơm thoang thoảng từ thực vật, chỉ số đường huyết an toàn.',
    }
  }

  if (/(gelatin)/.test(lower)) {
    return {
      replacementName: 'Bột rau câu Agar-agar từ tảo biển',
      category: 'gia-vi',
      icon: '🍮',
      description: 'Chiết xuất từ rong biển tự nhiên, tạo độ đông giòn thanh mát.',
    }
  }

  return {
    replacementName: 'Nấm hương tươi & Đậu hũ non',
    category: 'dau-mem-san-xuat',
    icon: '🥗',
    description: 'Nguồn đạm thực vật lành mạnh, an toàn và dễ chế biến nhiều món ngon.',
  }
}

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
  const url = '/api/pantry/items'
  try {
    const backendItems = await apiClient.get<BackendPantryItem[]>(url)
    if (backendItems && Array.isArray(backendItems)) {
      const mapped = backendItems.map(mapBackendPantryItem)
      if (category === 'all') return mapped
      return mapped.filter((p) => p.category === category)
    }
  } catch (err) {
    console.error('[pantryApi.getPantryItems] Lỗi khi gọi API: ' + url, err)
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
  const url = '/api/pantry/recipe-suggestions'
  try {
    const suggestions = await apiClient.get<BackendPantryRecipeSuggestion[]>(url)
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
  } catch (err) {
    console.error('[pantryApi.getRecipeMatches] Lỗi khi gọi API: ' + url, err)
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
