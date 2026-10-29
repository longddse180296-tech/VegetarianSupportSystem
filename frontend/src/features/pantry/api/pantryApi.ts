// Chức năng: tủ bếp và nguyên liệu sẵn có. Giao tiếp máy chủ và chuyển dữ liệu về kiểu dùng trong tính năng.
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
  { name: 'Đậu hũ chiên', emoji: '🫘', cls: 'bg-[#FEF3C7] text-[#92400E]' },
  { name: 'Đậu hũ non', emoji: '🫘', cls: 'bg-[#FEF3C7] text-[#92400E]' },
  { name: 'Nấm rơm', emoji: '🍄', cls: 'bg-[#FEF3C7] text-[#92400E]' },
  { name: 'Cà chua', emoji: '🍅', cls: 'bg-[#FEF3C7] text-[#92400E]' },
  { name: 'Bí đỏ', emoji: '🎃', cls: 'bg-[#FCE7F3] text-[#9D174D]' },
  { name: 'Đậu cô ve', emoji: '🌰', cls: 'bg-[#FCE7F3] text-[#9D174D]' },
  { name: 'Hạt sen', emoji: '🌰', cls: 'bg-[#FCE7F3] text-[#9D174D]' },
  { name: 'Dầu mè', emoji: '🍱', cls: 'bg-[#FCE7F3] text-[#9D174D]' },
]

export const INGREDIENT_RECIPE_MAP: Record<string, string[]> = {
  'Đậu hũ chiên': ['Đậu hũ sốt cà chua truyền thống', 'Bún bò Huế chay', 'Gỏi ngó sen đậu hũ giòn'],
  'Đậu hũ non': ['Canh chua chay Nam Bộ', 'Canh rong biển hạt sen đậu hũ non', 'Đậu hũ non chiên giòn sốt me chua ngọt', 'Canh cà chua đậu hũ trắng bồng bềnh'],
  'Đậu hũ trắng': ['Bún riêu chay thuần thực vật', 'Canh cà chua đậu hũ trắng bồng bềnh'],
  'Nấm rơm': ['Đậu hũ sốt cà chua truyền thống', 'Bún riêu chay thuần thực vật', 'Trứng hấp nấm rơm và bắp ngọt'],
  'Nấm đùi gà': ['Bún xào trứng kiểu Singapore', 'Mì Ý Carbonara', 'Mì Ý sốt kem nấm', 'Nấm đùi gà kho tiêu xanh', 'Nấm đùi gà xào bơ tỏi', 'Phở nấm chay gia truyền', 'Súp kem nấm'],
  'Nấm đông cô tươi': ['Cải thìa xào nấm đông cô', 'Trứng chưng nấm đông cô sốt tương', 'Phở nấm chay gia truyền'],
  'Nấm kim châm': ['Trứng chiên nấm kim châm giòn thơm'],
  'Nấm bào ngư': ['Chả giò chay giòn rụm', 'Canh chua chay Nam Bộ'],
  'Cà chua': ['Đậu hũ sốt cà chua truyền thống', 'Canh chua chay Nam Bộ', 'Bún riêu chay thuần thực vật', 'Canh cà chua đậu hũ trắng bồng bềnh'],
  'Bí đỏ': ['Súp bí đỏ kem tươi hạnh nhân', 'Canh bí đỏ đậu phộng'],
  'Đậu cô ve': ['Cà ri rau củ Ấn Độ', 'Cơm chiên hoàng bào'],
  'Hạt sen': ['Canh rong biển hạt sen đậu hũ non', 'Cơm chiên ngọc bích hạt sen'],
  'Dầu mè': ['Gỏi ngó sen đậu hũ giòn', 'Bún xào trứng kiểu Singapore', 'Trứng cuộn rong biển mè rang kiểu Nhật', 'Cải thìa xào nấm đông cô'],
  'Rau muống': ['Canh chua chay Nam Bộ', 'Rau muống xào tỏi'],
  'Cải thìa': ['Cải thìa xào nấm đông cô'],
  'Ngó sen tươi': ['Gỏi ngó sen đậu hũ giòn ngọt'],
  'Đậu phộng rang': ['Cà tím nướng mỡ hành đậu phộng', 'Gỏi ngó sen đậu hũ giòn ngọt'],
  'Cà tím': ['Cà tím nướng mỡ hành đậu phộng'],
  'Khoai tây': ['Cà ri rau củ Ấn Độ với bơ và sữa chua', 'Khoai tây nghiền bơ sữa đút lò phô mai', 'Salad Nga chay'],
  'Cà rốt': ['Bún xào trứng kiểu Singapore', 'Cà ri rau củ Ấn Độ', 'Chả giò chay giòn rụm nhân nấm củ quả', 'Gỏi ngó sen đậu hũ giòn ngọt', 'Phở nấm chay gia truyền', 'Salad Nga chay'],
  'Bắp ngọt': ['Bún bò Huế chay', 'Bún riêu chay thuần thực vật', 'Cơm chiên hoàng bào vàng ươm', 'Cơm chiên ngọc bích hạt sen', 'Phở nấm chay', 'Súp ngô ngọt kem sữa tươi'],
  'Gạo thơm': ['Cơm chiên hoàng bào vàng ươm', 'Cơm chiên ngọc bích hạt sen'],
  'Bánh phở tươi': ['Phở nấm chay gia truyền'],
  'Bánh tráng cuốn': ['Chả giò chay giòn rụm nhân nấm củ quả'],
  'Bún tươi': ['Bún bò Huế chay', 'Bún riêu chay thuần thực vật', 'Bún xào trứng kiểu Singapore', 'Mì Ý sốt kem nấm'],
  'Đậu gà': ['Cà ri rau củ Ấn Độ với bơ và sữa chua'],
  'Đậu lăng đỏ': ['Súp đậu lăng đỏ Ấn Độ'],
  'Hạt điều': ['Súp bí đỏ kem tươi hạnh nhân'],
  'Yến mạch': ['Trà sữa yến mạch sữa tươi thanh mát'],
  'Trứng gà tươi': ['Bánh mì kẹp trứng chiên hành thơm nức', 'Salad rau trộn trứng luộc lòng đào', 'Bánh kếp chuối trứng sữa (Pancake)', 'Cơm chiên hoàng bào vàng ươm', 'Khổ qua xào trứng gà', 'Trứng chiên nấm kim châm'],
  'Sữa tươi thanh trùng': ['Bánh kếp chuối trứng sữa (Pancake)', 'Bánh flan caramel', 'Súp ngô ngọt kem sữa tươi', 'Trà sữa yến mạch'],
  'Sữa chua không đường': ['Cà ri rau củ Ấn Độ với bơ và sữa chua', 'Salad rau củ sốt sữa chua mè rang'],
  'Phô mai Mozzarella': ['Bánh mì bơ tỏi phô mai Mozzarella', 'Bông cải xanh đút lò sốt phô mai béo ngậy'],
  'Phô mai Parmesan': ['Mì Ý Carbonara sốt trứng phô mai', 'Mì Ý sốt kem nấm và phô mai Parmesan'],
  'Bơ lạt': ['Bánh kếp chuối trứng sữa (Pancake)', 'Bánh mì bơ tỏi phô mai Mozzarella', 'Khoai tây nghiền bơ sữa đút lò', 'Nấm đùi gà xào bơ tỏi'],
}

// Đọc dữ liệu cần thiết và trả kết quả cho bước xử lý tiếp theo (getRecipesForIngredient); thuộc tủ bếp và nguyên liệu sẵn có.
export function getRecipesForIngredient(name: string): string[] {
  const trimmed = name.trim().toLowerCase()
  for (const [key, recipes] of Object.entries(INGREDIENT_RECIPE_MAP)) {
    if (key.toLowerCase() === trimmed || key.toLowerCase().includes(trimmed) || trimmed.includes(key.toLowerCase())) {
      return recipes
    }
  }
  return []
}

// Đọc dữ liệu cần thiết và trả kết quả cho bước xử lý tiếp theo (getPantryCategories); thuộc tủ bếp và nguyên liệu sẵn có.
export async function getPantryCategories(): Promise<
  Array<{ key: PantryCategory | 'all'; emoji: string; label: string }>
> {
  return CATEGORY_ORDER
}

// Ghi nhận thay đổi dữ liệu và cập nhật kết quả cho bên gọi (getQuickAddChips); thuộc tủ bếp và nguyên liệu sẵn có.
export async function getQuickAddChips(): Promise<
  Array<{ name: string; emoji: string; cls: string }>
> {
  return QUICK_ADD_CHIPS
}

// ---------- 4 Core Vegetarian Diet Types & Evaluation Logic ----------
// Cấu trúc CoreDietType quy định dữ liệu trao đổi trong tủ bếp và nguyên liệu sẵn có.
export type CoreDietType =
  | 'Thuần chay (Vegan)'
  | 'Ăn chay có sữa (Lacto)'
  | 'Chay có trứng (Ovo)'
  | 'Trứng & Sữa (Lacto-ovo)'

// Thực hiện bước xử lý riêng được các thành phần trong tính năng sử dụng (evaluateIngredientForDiet); thuộc tủ bếp và nguyên liệu sẵn có.
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

// Đọc dữ liệu cần thiết và trả kết quả cho bước xử lý tiếp theo (getSubstitutionForIngredient); thuộc tủ bếp và nguyên liệu sẵn có.
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
// Cấu trúc BackendPantryItem quy định dữ liệu trao đổi trong tủ bếp và nguyên liệu sẵn có.
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

// Cấu trúc BackendPantryRecipeSuggestion quy định dữ liệu trao đổi trong tủ bếp và nguyên liệu sẵn có.
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

// Thực hiện bước xử lý riêng được các thành phần trong tính năng sử dụng (inferCategoryFromName); thuộc tủ bếp và nguyên liệu sẵn có.
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

// Chuẩn hóa hoặc chuyển đổi dữ liệu giữa các bước xử lý (mapBackendPantryItem); thuộc tủ bếp và nguyên liệu sẵn có.
function mapBackendPantryItem(backendItem: BackendPantryItem): PantryItem {
  // Chỉ backend đối chiếu đủ nguồn gốc và hồ sơ; chưa có bằng chứng thì giữ trạng thái chưa đủ thông tin.
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

  const note = [backendItem.dietaryNotice,
    backendItem.allergenWarnings?.length ? `Cảnh báo dị ứng: ${backendItem.allergenWarnings.join(', ')}` : null,
    backendItem.avoidedFoodWarnings?.length ? `Thực phẩm cần tránh: ${backendItem.avoidedFoodWarnings.join(', ')}` : null,
  ].filter(Boolean).join(' · ') || 'Chưa đủ thông tin để đánh giá mức độ phù hợp.'

  return {
    id: backendItem.id,
    name: backendItem.name,
    quantity: backendItem.quantity,
    unit: backendItem.unit,
    category: inferCategoryFromName(backendItem.name),
    isSuitable,
    suitableNote: note,
    addedAt: backendItem.createdAt,
  }
}

// Đọc dữ liệu cần thiết và trả kết quả cho bước xử lý tiếp theo (getPantryItems); thuộc tủ bếp và nguyên liệu sẵn có.
export async function getPantryItems(category: PantryCategory | 'all' = 'all', signal?: AbortSignal): Promise<PantryItem[]> {
  const url = '/api/pantry/items'
  try {
    const backendItems = await apiClient.get<BackendPantryItem[]>(url, { signal })
    if (backendItems && Array.isArray(backendItems)) {
      const mapped = backendItems.map(mapBackendPantryItem)
      if (category === 'all') return mapped
      return mapped.filter((p) => p.category === category)
    }
  } catch (err) {
    console.error('[pantryApi.getPantryItems] Lỗi khi gọi API: ' + url, err)
    throw err
  }

  throw new Error('Chưa thể đọc danh sách nguyên liệu. Vui lòng thử tải lại.')
}

// Cấu trúc CatalogIngredient quy định dữ liệu trao đổi trong tủ bếp và nguyên liệu sẵn có.
export interface CatalogIngredient {
  id: string
  name: string
  aliases?: string | null
  defaultUnit?: string | null
  caloriesPer100Gram?: number | null
  origin?: string
  allergens?: string | null
  recipeNames?: string[]
}

// Xóa mục được chọn theo phạm vi và điều kiện của tính năng (removeVietnameseDiacritics); thuộc tủ bếp và nguyên liệu sẵn có.
export function removeVietnameseDiacritics(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
}

let cachedCatalog: CatalogIngredient[] | null = null

// Đọc dữ liệu cần thiết và trả kết quả cho bước xử lý tiếp theo (fetchAllCatalogIngredients); thuộc tủ bếp và nguyên liệu sẵn có.
export async function fetchAllCatalogIngredients(): Promise<CatalogIngredient[]> {
  if (cachedCatalog && cachedCatalog.length > 0) return cachedCatalog
  try {
    const res = await apiClient.get<{ items: CatalogIngredient[] }>(
      '/api/ingredients?pageSize=100',
      { requiresAuth: false },
    )
    if (res?.items && Array.isArray(res.items)) {
      cachedCatalog = res.items.map((ing) => ({
        ...ing,
        recipeNames: getRecipesForIngredient(ing.name),
      }))
      return cachedCatalog
    }
  } catch (err) {
    console.error('[pantryApi.fetchAllCatalogIngredients] Error:', err)
  }
  return []
}

// Lấy hoặc lọc danh sách theo điều kiện và phạm vi hiện tại (searchCatalogIngredients); thuộc tủ bếp và nguyên liệu sẵn có.
export async function searchCatalogIngredients(keyword: string): Promise<CatalogIngredient[]> {
  const term = keyword.trim()
  if (!term) return []

  const catalog = await fetchAllCatalogIngredients()
  const normTerm = removeVietnameseDiacritics(term)

  const matches = catalog.filter((ing) => {
    const normName = removeVietnameseDiacritics(ing.name)
    const normAliases = ing.aliases ? removeVietnameseDiacritics(ing.aliases) : ''
    return normName.includes(normTerm) || normAliases.includes(normTerm)
  })

  if (matches.length > 0) {
    return matches.slice(0, 15)
  }

  try {
    const url = `/api/ingredients?search=${encodeURIComponent(term)}&pageSize=20`
    const res = await apiClient.get<{ items: CatalogIngredient[] }>(url, { requiresAuth: false })
    const items = res?.items || []
    return items.map((ing) => ({
      ...ing,
      recipeNames: getRecipesForIngredient(ing.name),
    }))
  } catch (err) {
    console.error('[pantryApi.searchCatalogIngredients] Error: ' + err)
    return []
  }
}

// Ghi nhận thay đổi dữ liệu và cập nhật kết quả cho bên gọi (addPantryItem); thuộc tủ bếp và nguyên liệu sẵn có.
export async function addPantryItem(
  form: AddIngredientFormState & { ingredientId?: string },
): Promise<PantryItem> {
  const qty = Number(form.quantity)
  const unitStr = form.unit.trim()
  if (!Number.isFinite(qty) || qty <= 0 || !unitStr)
    throw new Error('Vui lòng nhập số lượng lớn hơn 0 và chọn đơn vị trước khi lưu.')

  const payload: { name?: string; ingredientId?: string; quantity: number; unit: string } = {
    quantity: qty,
    unit: unitStr,
  }

  if (form.ingredientId) {
    payload.ingredientId = form.ingredientId
  } else {
    payload.name = form.name.trim()
  }

  const created = await apiClient.post<BackendPantryItem>('/api/pantry/items', payload)

  if (created && created.id) {
    return mapBackendPantryItem(created)
  }

  throw new Error('Không thể thêm nguyên liệu vào tủ bếp.')
}

// Xóa mục được chọn theo phạm vi và điều kiện của tính năng (deletePantryItem); thuộc tủ bếp và nguyên liệu sẵn có.
export async function deletePantryItem(id: string): Promise<{ deleted: boolean; remaining: number }> {
  const url = `/api/pantry/items/${id}`
  try {
    await apiClient.delete(url)
    return { deleted: true, remaining: 0 }
  } catch (err) {
    console.error('[pantryApi.deletePantryItem] Lỗi khi gọi API: ' + url, err)
    throw err
  }
}

// Ghi nhận thay đổi dữ liệu và cập nhật kết quả cho bên gọi (updatePantryItem); thuộc tủ bếp và nguyên liệu sẵn có.
export async function updatePantryItem(
  id: string,
  data: { name: string; quantity?: number; unit?: string },
): Promise<PantryItem | null> {
  const url = `/api/pantry/items/${id}`
  try {
    const updated = await apiClient.put<BackendPantryItem>(url, {
      name: data.name.trim(),
      quantity: data.quantity ?? null,
      unit: data.unit?.trim() || null,
    })
    if (updated && updated.id) {
      return mapBackendPantryItem(updated)
    }
    throw new Error('Chưa nhận được nguyên liệu đã cập nhật. Vui lòng tải lại trước khi thử tiếp.')
  } catch (err) {
    console.error('[pantryApi.updatePantryItem] Lỗi khi gọi API: ' + url, err)
    throw err
  }
}

// Đọc dữ liệu cần thiết và trả kết quả cho bước xử lý tiếp theo (getRecipeMatches); thuộc tủ bếp và nguyên liệu sẵn có.
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
        kcal: s.caloriesPerServing === null ? null : Math.round(s.caloriesPerServing),
        tag: 'Gợi ý từ tủ bếp',
        matchedIngredients: s.availableIngredients.map((i) => i.name),
        totalIngredients: s.availableIngredients.length + s.missingIngredients.length,
        missingList: s.missingIngredients.map((i) => i.name),
        matchPercent: Math.round(Number(s.matchPercent)),
      }))
    }
  } catch (err) {
    console.error('[pantryApi.getRecipeMatches] Lỗi khi gọi API: ' + url, err)
    throw err
  }

  return []
}

// Cấu trúc PantrySubstitutionCandidate quy định dữ liệu trao đổi trong tủ bếp và nguyên liệu sẵn có.
export interface PantrySubstitutionCandidate {
  ingredientId: string
  name: string
  defaultUnit: string | null
  dietaryCompatibility: string | null
  allergenWarnings: string[]
  avoidedFoodWarnings: string[]
}

// Đọc dữ liệu cần thiết và trả kết quả cho bước xử lý tiếp theo (getSubstitutionCandidates); thuộc tủ bếp và nguyên liệu sẵn có.
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
