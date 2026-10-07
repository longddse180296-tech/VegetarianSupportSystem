import type {
  AdminCategoryFilter,
  AdminCategoryItem,
  AdminCategoryStats,
  CategoryFormData,
} from '../types/adminCategories.types'

let MOCK_ADMIN_CATEGORIES: AdminCategoryItem[] = [
  {
    id: 'cat-1',
    name: 'Rau củ',
    slug: 'rau-cu',
    iconName: 'leaf',
    classification: 'ingredient',
    classificationLabel: 'Loại thực phẩm',
    description: 'Nhóm các nguyên liệu từ rau xanh, củ quả tươi tự nhiên',
    linkedCountText: '28 nguyên liệu',
    createdAt: '12/08/2026',
    isActive: true,
    statusLabel: 'Đang sử dụng',
  },
  {
    id: 'cat-2',
    name: 'Món chính',
    slug: 'mon-chinh',
    iconName: 'utensils',
    classification: 'recipe',
    classificationLabel: 'Công thức',
    description: 'Các món chay giàu dinh dưỡng cho bữa trưa và tối',
    linkedCountText: '35 công thức',
    createdAt: '15/08/2026',
    isActive: true,
    statusLabel: 'Đang sử dụng',
  },
  {
    id: 'cat-3',
    name: 'Đậu & Hạt dinh dưỡng',
    slug: 'dau-hat-dinh-duong',
    iconName: 'grid',
    classification: 'ingredient',
    classificationLabel: 'Loại thực phẩm',
    description: 'Nguồn protein thực vật: đậu nành, đậu gà, hạt điều, óc chó',
    linkedCountText: '19 nguyên liệu',
    createdAt: '18/08/2026',
    isActive: true,
    statusLabel: 'Đang sử dụng',
  },
  {
    id: 'cat-4',
    name: 'Món nước',
    slug: 'mon-nuoc',
    iconName: 'soup',
    classification: 'recipe',
    classificationLabel: 'Công thức',
    description: 'Canh chua, phở chay, bún nấm và các món súp thanh đạm',
    linkedCountText: '16 công thức',
    createdAt: '20/08/2026',
    isActive: true,
    statusLabel: 'Đang sử dụng',
  },
  {
    id: 'cat-5',
    name: 'Nấm tươi & Nấm khô',
    slug: 'nam-tuoi-nam-kho',
    iconName: 'tree',
    classification: 'ingredient',
    classificationLabel: 'Loại thực phẩm',
    description: 'Đa dạng các loại nấm đùi gà, bào ngư, đông cô, nấm hương',
    linkedCountText: '14 nguyên liệu',
    createdAt: '25/08/2026',
    isActive: true,
    statusLabel: 'Đang sử dụng',
  },
  {
    id: 'cat-6',
    name: 'Món khai vị & Salad',
    slug: 'mon-khai-vi-salad',
    iconName: 'salad',
    classification: 'recipe',
    classificationLabel: 'Công thức',
    description: 'Gỏi cuốn chay, salad hoa quả, nộm rong nho thanh mát',
    linkedCountText: '12 công thức',
    createdAt: '01/09/2026',
    isActive: false,
    statusLabel: 'Ngừng sử dụng',
  },
]

export async function getAdminCategoryStats(): Promise<AdminCategoryStats> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return {
    activeCount: 12,
    ingredientCategoryCount: 6,
    recipeCategoryCount: 6,
  }
}

export async function getAdminCategories(filter: AdminCategoryFilter = {}): Promise<{
  items: AdminCategoryItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  let list = [...MOCK_ADMIN_CATEGORIES]

  if (filter.classification && filter.classification !== 'all') {
    list = list.filter((c) => c.classification === filter.classification)
  }

  if (filter.status && filter.status !== 'all') {
    const isAct = filter.status === 'active'
    list = list.filter((c) => c.isActive === isAct)
  }

  if (filter.keyword?.trim()) {
    const q = filter.keyword.toLowerCase().trim()
    list = list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    )
  }

  const page = filter.page || 1
  const pageSize = filter.pageSize || 6
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

export async function createAdminCategory(data: CategoryFormData): Promise<AdminCategoryItem> {
  await new Promise((resolve) => setTimeout(resolve, 600))
  const newCat: AdminCategoryItem = {
    id: `cat-${Date.now()}`,
    name: data.name,
    slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
    iconName: data.classification === 'ingredient' ? 'leaf' : 'utensils',
    classification: data.classification,
    classificationLabel: data.classification === 'ingredient' ? 'Loại thực phẩm' : 'Công thức',
    description: data.description,
    linkedCountText: '0 liên kết',
    createdAt: 'Hôm nay',
    isActive: data.isActive,
    statusLabel: data.isActive ? 'Đang sử dụng' : 'Ngừng sử dụng',
  }
  MOCK_ADMIN_CATEGORIES = [newCat, ...MOCK_ADMIN_CATEGORIES]
  return newCat
}

export async function updateAdminCategory(
  id: string,
  data: CategoryFormData
): Promise<AdminCategoryItem> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  const idx = MOCK_ADMIN_CATEGORIES.findIndex((c) => c.id === id)
  if (idx === -1) throw new Error('Không tìm thấy danh mục.')

  const updated: AdminCategoryItem = {
    ...MOCK_ADMIN_CATEGORIES[idx],
    name: data.name,
    slug: data.slug,
    classification: data.classification,
    classificationLabel: data.classification === 'ingredient' ? 'Loại thực phẩm' : 'Công thức',
    description: data.description,
    isActive: data.isActive,
    statusLabel: data.isActive ? 'Đang sử dụng' : 'Ngừng sử dụng',
  }
  MOCK_ADMIN_CATEGORIES[idx] = updated
  return updated
}

export async function toggleAdminCategoryStatus(id: string): Promise<AdminCategoryItem> {
  await new Promise((resolve) => setTimeout(resolve, 400))
  const target = MOCK_ADMIN_CATEGORIES.find((c) => c.id === id)
  if (!target) throw new Error('Không tìm thấy danh mục.')

  target.isActive = !target.isActive
  target.statusLabel = target.isActive ? 'Đang sử dụng' : 'Ngừng sử dụng'
  return { ...target }
}

export async function deleteAdminCategory(id: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  MOCK_ADMIN_CATEGORIES = MOCK_ADMIN_CATEGORIES.filter((c) => c.id !== id)
  return true
}
