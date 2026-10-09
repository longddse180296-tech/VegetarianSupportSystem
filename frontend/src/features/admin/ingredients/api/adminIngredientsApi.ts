import type {
  AdminIngredientItem,
  AdminIngredientFilter,
  AdminIngredientStats,
} from '../types/adminIngredients.types'

let MOCK_INGREDIENTS: AdminIngredientItem[] = [
  {
    id: 'ing-1',
    name: 'Nước hầm xương động vật (Bone Broth)',
    category: 'Gia vị & Nước dùng',
    eNumber: '—',
    vegan: false,
    lactoVegan: false,
    dangerLevel: 'danger',
    description: 'Chứa chiết xuất tủy và xương thịt động vật, tuyệt đối cấm trong ẩm thực chay',
  },
  {
    id: 'ing-2',
    name: 'Gelatin thực phẩm (E441)',
    category: 'Phụ gia tạo gel',
    eNumber: 'E441',
    vegan: false,
    lactoVegan: false,
    dangerLevel: 'danger',
    description: 'Chiết xuất từ collagen da, gân và xương lợn/bò; cần thay bằng bột Agar-Agar (rau câu)',
  },
  {
    id: 'ing-3',
    name: 'Đậu hũ non (Silken Tofu)',
    category: 'Đạm thực vật',
    eNumber: '—',
    vegan: true,
    lactoVegan: true,
    dangerLevel: 'safe',
    description: 'Đậu nành tự nhiên kết tủa đường nho GDL, giàu protein và canxi lành mạnh',
  },
  {
    id: 'ing-4',
    name: 'Sữa tươi thanh trùng & Bơ sữa',
    category: 'Sữa & Chế phẩm',
    eNumber: '—',
    vegan: false,
    lactoVegan: true,
    dangerLevel: 'warning',
    description: 'Nguồn gốc bơ sữa bò, chấp nhận trong phái Lacto-vegetarian nhưng không thuần chay (Vegan)',
  },
  {
    id: 'ing-5',
    name: 'Bột rau câu Agar-Agar (E406)',
    category: 'Phụ gia tạo gel',
    eNumber: 'E406',
    vegan: true,
    lactoVegan: true,
    dangerLevel: 'safe',
    description: 'Chiết xuất từ tảo biển đỏ tự nhiên 100% thuần thực vật, thay thế hoàn hảo cho Gelatin',
  },
  {
    id: 'ing-6',
    name: 'Dầu hào nấm hương hữu cơ',
    category: 'Gia vị & Nước dùng',
    eNumber: '—',
    vegan: true,
    lactoVegan: true,
    dangerLevel: 'safe',
    description: 'Chiết xuất từ nấm hương hữu cơ lên men, không chứa hàu hoặc động vật thân mềm',
  },
  {
    id: 'ing-7',
    name: 'Hạt nêm thịt heo / Gà cô đặc',
    category: 'Gia vị & Nước dùng',
    eNumber: 'E621/E631',
    vegan: false,
    lactoVegan: false,
    dangerLevel: 'danger',
    description: 'Chứa bột thịt và mỡ động vật ẩn, cần thay bằng hạt nêm rau củ nấm',
  },
  {
    id: 'ing-8',
    name: 'Hạt chia & Hạt diêm mạch Quinoa',
    category: 'Hạt dinh dưỡng',
    eNumber: '—',
    vegan: true,
    lactoVegan: true,
    dangerLevel: 'safe',
    description: 'Nguồn Omega-3 thực vật và protein hoàn chỉnh gồm 9 loại acid amin thiết yếu',
  },
]

export async function getAdminIngredientStats(): Promise<AdminIngredientStats> {
  // Simulate 1.5s network latency per directive
  await new Promise((resolve) => setTimeout(resolve, 1500))
  return {
    total: MOCK_INGREDIENTS.length,
    safe: MOCK_INGREDIENTS.filter((i) => i.dangerLevel === 'safe').length,
    warning: MOCK_INGREDIENTS.filter((i) => i.dangerLevel === 'warning').length,
    danger: MOCK_INGREDIENTS.filter((i) => i.dangerLevel === 'danger').length,
  }
}

export async function getAdminIngredients(
  filter: AdminIngredientFilter = {},
  page = 1,
  pageSize = 6
): Promise<{
  items: AdminIngredientItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}> {
  // Simulate 1.5s network latency per directive
  await new Promise((resolve) => setTimeout(resolve, 1500))

  let list = [...MOCK_INGREDIENTS]

  if (filter.dangerLevel && filter.dangerLevel !== 'all') {
    list = list.filter((i) => i.dangerLevel === filter.dangerLevel)
  }

  if (filter.category && filter.category !== 'all') {
    list = list.filter((i) => i.category === filter.category)
  }

  if (filter.keyword?.trim()) {
    const q = filter.keyword.toLowerCase().trim()
    list = list.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.eNumber.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
    )
  }

  const total = list.length
  const totalPages = Math.ceil(total / pageSize) || 1
  const startIndex = (page - 1) * pageSize
  const items = list.slice(startIndex, startIndex + pageSize)

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
  }
}

export async function createAdminIngredient(
  payload: Omit<AdminIngredientItem, 'id'>
): Promise<AdminIngredientItem> {
  // Simulate 1.5s network latency per directive
  await new Promise((resolve) => setTimeout(resolve, 1500))

  const newIng: AdminIngredientItem = {
    id: `ing-${Date.now()}`,
    ...payload,
  }
  MOCK_INGREDIENTS = [newIng, ...MOCK_INGREDIENTS]
  return newIng
}

export async function updateAdminIngredient(
  id: string,
  payload: Partial<AdminIngredientItem>
): Promise<AdminIngredientItem> {
  // Simulate 1.5s network latency per directive
  await new Promise((resolve) => setTimeout(resolve, 1500))

  const idx = MOCK_INGREDIENTS.findIndex((i) => i.id === id)
  if (idx === -1) throw new Error('Không tìm thấy nguyên liệu.')

  const updated: AdminIngredientItem = {
    ...MOCK_INGREDIENTS[idx],
    ...payload,
  }
  MOCK_INGREDIENTS[idx] = updated
  return updated
}

export async function deleteAdminIngredient(id: string): Promise<boolean> {
  // Simulate 1.5s network latency per directive
  await new Promise((resolve) => setTimeout(resolve, 1500))

  MOCK_INGREDIENTS = MOCK_INGREDIENTS.filter((i) => i.id !== id)
  return true
}

export const adminIngredientsApi = {
  list: getAdminIngredients,
  getStats: getAdminIngredientStats,
  create: createAdminIngredient,
  update: updateAdminIngredient,
  remove: deleteAdminIngredient,
}
