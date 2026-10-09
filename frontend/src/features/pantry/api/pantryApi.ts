import type {
  AddIngredientFormState,
  PantryCategory,
  PantryItem,
  PantrySuitability,
  RecipeMatch,
} from '../types/pantry.types'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function makeId(prefix = 'p'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

const DANGER_WORDS = ['mỡ heo', 'mỡ gà', 'nước mắm', 'nước dùng xương', 'gelatin', 'e441', 'cá ngừ']
const WARNING_WORDS = ['phô mai', 'sữa', 'bơ sữa', 'trứng', 'whey', 'casein']

function computeSuitability(name: string): {
  isSuitable: PantrySuitability
  suitableNote: string
} {
  const text = name.toLowerCase().trim()
  if (!text) return { isSuitable: 'unchecked', suitableNote: 'Chưa phân tích.' }
  for (const w of DANGER_WORDS) {
    if (text.includes(w)) {
      return {
        isSuitable: 'unsuitable',
        suitableNote: `Phát hiện từ khóa "${w}" thường là nguồn gốc động vật, không phù hợp với chế độ thuần thực vật theo thông tin phổ biến. Hãy kiểm tra nhãn hoặc nhà sản xuất.`,
      }
    }
  }
  for (const w of WARNING_WORDS) {
    if (text.includes(w)) {
      return {
        isSuitable: 'warning',
        suitableNote: `Từ khóa "${w}" thường có thể không phù hợp với chế độ thuần thực vật nghiêm ngặt, tùy nguồn gốc. Xem nhãn hoặc dùng phiên bản thuần thực vật thay thế.`,
      }
    }
  }
  return {
    isSuitable: 'suitable',
    suitableNote:
      'Theo tên gọi thông thường, nguyên liệu này thường phù hợp với chế độ thuần thực vật. Nếu có phụ gia, hãy kiểm tra nhãn sản phẩm để chắc chắn.',
  }
}

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

export async function getPantryItems(category: PantryCategory | 'all' = 'all'): Promise<PantryItem[]> {
  await delay(500)
  const copy = [...inMemoryPantry]
  if (category === 'all') return copy
  return copy.filter((p) => p.category === category)
}

export async function addPantryItem(form: AddIngredientFormState): Promise<PantryItem> {
  await delay(500)
  const suitability = computeSuitability(form.name)
  const item: PantryItem = {
    id: makeId('item'),
    name: form.name.trim(),
    quantity: Number.isFinite(Number(form.quantity)) ? Math.max(0, Number(form.quantity)) : 0,
    unit: form.unit.trim() || 'g',
    category: (form.category || 'khac') as PantryCategory,
    isSuitable: suitability.isSuitable,
    suitableNote: suitability.suitableNote,
    addedAt: new Date().toISOString(),
  }
  inMemoryPantry = [item, ...inMemoryPantry]
  return item
}

export async function deletePantryItem(id: string): Promise<{ deleted: boolean; remaining: number }> {
  await delay(500)
  const before = inMemoryPantry.length
  inMemoryPantry = inMemoryPantry.filter((p) => p.id !== id)
  return { deleted: inMemoryPantry.length < before, remaining: inMemoryPantry.length }
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
  // Tối thiểu 2 token trùng hoặc 1 token chính của bùm khớp ít nhất 50% token B
  const setA = new Set(a)
  const overlap = b.filter((tok) => setA.has(tok))
  if (overlap.length === 0) return false
  if (overlap.length >= 2) return true
  if (overlap.length / b.length >= 0.5) return true
  // match substring: pantry chứa ingredient hoàn chỉnh
  return a.join(' ').includes(b.join(' ')) || b.join(' ').includes(a.join(' '))
}

export async function getRecipeMatches(pantry: PantryItem[]): Promise<RecipeMatch[]> {
  await delay(500)
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
  // Sắp xếp theo % khớp, nếu khớp 0 và totalMatched=0 -> ẩn bớt
  const filtered = matches
    .filter((m) => m.matchPercent >= 15)
    .sort((a, b) => {
      if (b.matchPercent !== a.matchPercent) return b.matchPercent - a.matchPercent
      return a.timeMin - b.timeMin
    })
  // Đảm bảo có ít nhất 4-5 gợi ý tốt: nếu kết quả dưới 4, thêm top matches (kể cả <15%)
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
