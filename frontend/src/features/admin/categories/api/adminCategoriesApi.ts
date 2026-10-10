import { apiClient } from '../../../../shared/api/apiClient'
import type {
  AdminCategoryFilter,
  AdminCategoryItem,
  AdminCategoryStats,
  CategoryFormData,
} from '../types/adminCategories.types'

interface BackendCategoryResponse {
  id: string
  name: string
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string | null
}

interface BackendCategoryPage {
  items: BackendCategoryResponse[]
  pageNumber: number
  pageSize: number
  totalCount: number
}

let MOCK_ADMIN_CATEGORIES: AdminCategoryItem[] = [
  // 1. Food Types (4 Chế độ ăn chay chuẩn hệ thống)
  {
    id: 'cat-ft-1',
    name: 'Thuần chay (Vegan)',
    slug: 'thuan-chay-vegan',
    iconName: 'sprout',
    classification: 'food_type',
    classificationLabel: 'Loại ẩm thực chay',
    description: '100% nguồn gốc thực vật; tuyệt đối không dùng thịt cá, trứng, sữa, mật ong hay phụ gia nguồn gốc động vật.',
    linkedCountText: '142 món ăn',
    createdAt: '10/08/2026',
    isActive: true,
    statusLabel: 'Đang sử dụng',
  },
  {
    id: 'cat-ft-2',
    name: 'Chay có sữa (Lacto-vegetarian)',
    slug: 'chay-co-sua-lacto-vegetarian',
    iconName: 'milk',
    classification: 'food_type',
    classificationLabel: 'Loại ẩm thực chay',
    description: 'Bao gồm thực vật và các chế phẩm từ sữa (sữa tươi, phô mai, bơ, sữa chua); không ăn trứng và thịt cá.',
    linkedCountText: '86 món ăn',
    createdAt: '12/08/2026',
    isActive: true,
    statusLabel: 'Đang sử dụng',
  },
  {
    id: 'cat-ft-3',
    name: 'Chay có trứng (Ovo-vegetarian)',
    slug: 'chay-co-trung-ovo-vegetarian',
    iconName: 'egg',
    classification: 'food_type',
    classificationLabel: 'Loại ẩm thực chay',
    description: 'Bao gồm thực vật và trứng gia cầm sạch; không dùng sữa, chế phẩm bơ sữa động vật và thịt cá.',
    linkedCountText: '64 món ăn',
    createdAt: '14/08/2026',
    isActive: true,
    statusLabel: 'Đang sử dụng',
  },
  {
    id: 'cat-ft-4',
    name: 'Chay trứng sữa (Lacto-ovo vegetarian)',
    slug: 'chay-trung-sua-lacto-ovo-vegetarian',
    iconName: 'utensils',
    classification: 'food_type',
    classificationLabel: 'Loại ẩm thực chay',
    description: 'Chế độ ăn chay phổ biến nhất, kết hợp thực vật cùng cả trứng và sữa; tuyệt đối không ăn thịt cá.',
    linkedCountText: '115 món ăn',
    createdAt: '16/08/2026',
    isActive: true,
    statusLabel: 'Đang sử dụng',
  },

  // 2. Recipes (Công thức món ăn)
  {
    id: 'cat-rc-1',
    name: 'Món chính đậm đà',
    slug: 'mon-chinh-dam-da',
    iconName: 'utensils',
    classification: 'recipe',
    classificationLabel: 'Công thức nấu ăn',
    description: 'Các món chay giàu đạm và dinh dưỡng phục vụ bữa trưa và tối',
    linkedCountText: '54 công thức',
    createdAt: '15/08/2026',
    isActive: true,
    statusLabel: 'Đang sử dụng',
  },
  {
    id: 'cat-rc-2',
    name: 'Món nước, Canh & Súp',
    slug: 'mon-nuoc-canh-sup',
    iconName: 'soup',
    classification: 'recipe',
    classificationLabel: 'Công thức nấu ăn',
    description: 'Phở chay, bún nấm riêu chay, canh chua thanh nhiệt và súp rau củ',
    linkedCountText: '32 công thức',
    createdAt: '20/08/2026',
    isActive: true,
    statusLabel: 'Đang sử dụng',
  },
  {
    id: 'cat-rc-3',
    name: 'Món khai vị & Salad',
    slug: 'mon-khai-vi-salad',
    iconName: 'salad',
    classification: 'recipe',
    classificationLabel: 'Công thức nấu ăn',
    description: 'Gỏi cuốn nấm, nộm rong nho, salad hoa quả sốt chanh leo',
    linkedCountText: '26 công thức',
    createdAt: '22/08/2026',
    isActive: true,
    statusLabel: 'Đang sử dụng',
  },

  // 3. Ingredients (Nguyên liệu thực phẩm)
  {
    id: 'cat-ig-1',
    name: 'Rau củ hữu cơ',
    slug: 'rau-cu-huu-co',
    iconName: 'leaf',
    classification: 'ingredient',
    classificationLabel: 'Nguyên liệu chay',
    description: 'Nhóm các loại rau xanh, củ quả tươi sạch giàu vitamin và chất xơ',
    linkedCountText: '48 nguyên liệu',
    createdAt: '25/08/2026',
    isActive: true,
    statusLabel: 'Đang sử dụng',
  },
  {
    id: 'cat-ig-2',
    name: 'Đậu & Hạt giàu Protein',
    slug: 'dau-hat-protein',
    iconName: 'grid',
    classification: 'ingredient',
    classificationLabel: 'Nguyên liệu chay',
    description: 'Đậu nành non, đậu gà, hạt diêm mạch quinoa, hạnh nhân, hạt chia',
    linkedCountText: '35 nguyên liệu',
    createdAt: '28/08/2026',
    isActive: true,
    statusLabel: 'Đang sử dụng',
  },
  {
    id: 'cat-ig-3',
    name: 'Nấm tươi & Nấm khô',
    slug: 'nam-tuoi-kho',
    iconName: 'tree',
    classification: 'ingredient',
    classificationLabel: 'Nguyên liệu chay',
    description: 'Nấm đùi gà, nấm bào ngư, nấm hương, nấm mối đen giàu khoáng chất',
    linkedCountText: '22 nguyên liệu',
    createdAt: '01/09/2026',
    isActive: true,
    statusLabel: 'Đang sử dụng',
  },
  {
    id: 'cat-ig-4',
    name: 'Gia vị thảo mộc & Sốt chay',
    slug: 'gia-vi-thao-moc-sot',
    iconName: 'sparkles',
    classification: 'ingredient',
    classificationLabel: 'Nguyên liệu chay',
    description: 'Hạt nêm nấm hữu cơ, nước tương lên men tự nhiên, dầu mè nguyên chất',
    linkedCountText: '18 nguyên liệu',
    createdAt: '05/09/2026',
    isActive: false,
    statusLabel: 'Ngừng sử dụng',
  },
]

function mapBackendCategory(cat: BackendCategoryResponse): AdminCategoryItem {
  return {
    id: cat.id,
    name: cat.name,
    slug: cat.name.toLowerCase().replace(/\s+/g, '-'),
    iconName: 'utensils',
    classification: 'recipe',
    classificationLabel: 'Công thức nấu ăn',
    description: cat.description || '',
    linkedCountText: '0 món ăn',
    createdAt: new Date(cat.createdAt).toLocaleDateString('vi-VN'),
    isActive: cat.isActive,
    statusLabel: cat.isActive ? 'Đang sử dụng' : 'Ngừng sử dụng',
  }
}

export async function getAdminCategoryStats(): Promise<AdminCategoryStats> {
  try {
    const res = await apiClient.get<BackendCategoryPage>('/api/admin/categories?pageNumber=1&pageSize=100')
    if (res?.items && res.items.length > 0) {
      const activeCount = res.items.filter((c: BackendCategoryResponse) => c.isActive).length
      return {
        activeCount,
        foodTypeCategoryCount: MOCK_ADMIN_CATEGORIES.filter((c) => c.classification === 'food_type').length,
        recipeCategoryCount: res.items.length,
        ingredientCategoryCount: MOCK_ADMIN_CATEGORIES.filter((c) => c.classification === 'ingredient').length,
      }
    }
  } catch {
    // Fall back to mock
  }

  return {
    activeCount: MOCK_ADMIN_CATEGORIES.filter((c) => c.isActive).length,
    foodTypeCategoryCount: MOCK_ADMIN_CATEGORIES.filter((c) => c.classification === 'food_type').length,
    recipeCategoryCount: MOCK_ADMIN_CATEGORIES.filter((c) => c.classification === 'recipe').length,
    ingredientCategoryCount: MOCK_ADMIN_CATEGORIES.filter((c) => c.classification === 'ingredient').length,
  }
}

export async function getAdminCategories(filter: AdminCategoryFilter = {}): Promise<{
  items: AdminCategoryItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}> {
  const page = filter.page || 1
  const pageSize = filter.pageSize || 6

  try {
    const query = new URLSearchParams()
    if (filter.keyword?.trim()) {
      query.set('search', filter.keyword.trim())
    }
    query.set('pageNumber', String(page))
    query.set('pageSize', String(pageSize))

    const res = await apiClient.get<BackendCategoryPage>(`/api/admin/categories?${query.toString()}`)

    if (res?.items && res.items.length > 0) {
      let mapped = res.items.map(mapBackendCategory)

      if (filter.classification && filter.classification !== 'all') {
        mapped = mapped.filter((c) => c.classification === filter.classification)
      }

      if (filter.status && filter.status !== 'all') {
        const isAct = filter.status === 'active'
        mapped = mapped.filter((c) => c.isActive === isAct)
      }

      const total = res.totalCount
      const totalPages = Math.ceil(total / pageSize) || 1

      return {
        items: mapped,
        total,
        page,
        pageSize,
        totalPages,
      }
    }
  } catch {
    // Fall back to local mock data
  }

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
  const labelMap = {
    food_type: 'Loại ẩm thực chay',
    recipe: 'Công thức nấu ăn',
    ingredient: 'Nguyên liệu chay',
  }

  try {
    const res = await apiClient.post<BackendCategoryResponse>('/api/admin/categories', {
      name: data.name,
      description: data.description || null,
    })

    if (res?.id) {
      const created = mapBackendCategory(res)
      created.classification = data.classification
      created.classificationLabel = labelMap[data.classification]
      created.slug = data.slug || created.slug
      created.isActive = data.isActive
      MOCK_ADMIN_CATEGORIES = [created, ...MOCK_ADMIN_CATEGORIES]
      return created
    }
  } catch {
    // Fall back to mock insertion
  }

  const newCat: AdminCategoryItem = {
    id: `cat-${Date.now()}`,
    name: data.name,
    slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
    iconName: data.classification === 'food_type' ? 'sprout' : data.classification === 'ingredient' ? 'leaf' : 'utensils',
    classification: data.classification,
    classificationLabel: labelMap[data.classification],
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
  const labelMap = {
    food_type: 'Loại ẩm thực chay',
    recipe: 'Công thức nấu ăn',
    ingredient: 'Nguyên liệu chay',
  }

  const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

  if (isGuid) {
    try {
      const res = await apiClient.put<BackendCategoryResponse>(`/api/admin/categories/${id}`, {
        name: data.name,
        description: data.description || null,
      })

      if (res?.id) {
        const updated = mapBackendCategory(res)
        updated.classification = data.classification
        updated.classificationLabel = labelMap[data.classification]
        updated.slug = data.slug || updated.slug
        updated.isActive = data.isActive
        const idx = MOCK_ADMIN_CATEGORIES.findIndex((c) => c.id === id)
        if (idx !== -1) {
          MOCK_ADMIN_CATEGORIES[idx] = updated
        }
        return updated
      }
    } catch {
      // Fall back to mock
    }
  }

  const idx = MOCK_ADMIN_CATEGORIES.findIndex((c) => c.id === id)
  if (idx === -1) throw new Error('Không tìm thấy danh mục.')

  const updated: AdminCategoryItem = {
    ...MOCK_ADMIN_CATEGORIES[idx],
    name: data.name,
    slug: data.slug,
    classification: data.classification,
    classificationLabel: labelMap[data.classification],
    description: data.description,
    isActive: data.isActive,
    statusLabel: data.isActive ? 'Đang sử dụng' : 'Ngừng sử dụng',
  }
  MOCK_ADMIN_CATEGORIES[idx] = updated
  return updated
}

export async function toggleAdminCategoryStatus(id: string): Promise<AdminCategoryItem> {
  const target = MOCK_ADMIN_CATEGORIES.find((c) => c.id === id)
  const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

  if (isGuid && target && target.isActive) {
    try {
      await apiClient.patch(`/api/admin/categories/${id}/deactivate`)
    } catch {
      // Continue to local toggle
    }
  }

  if (!target) throw new Error('Không tìm thấy danh mục.')

  target.isActive = !target.isActive
  target.statusLabel = target.isActive ? 'Đang sử dụng' : 'Ngừng sử dụng'
  return { ...target }
}

export async function deleteAdminCategory(id: string): Promise<boolean> {
  MOCK_ADMIN_CATEGORIES = MOCK_ADMIN_CATEGORIES.filter((c) => c.id !== id)
  return true
}
