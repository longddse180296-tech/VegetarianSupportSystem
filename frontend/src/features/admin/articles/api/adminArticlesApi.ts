import type {
  AdminArticleFilter,
  AdminArticleItem,
  AdminArticleStats,
} from '../types/adminArticles.types'

let MOCK_ADMIN_ARTICLES: AdminArticleItem[] = [
  {
    id: 'adm-art-1',
    title: 'Top 7 nguồn Protein thực vật hoàn hảo cho người mới ăn chay',
    wordCount: 1420,
    readTimeMinutes: 6,
    authorInitials: 'MA',
    authorName: 'Nguyễn Minh Anh',
    authorColorClass: 'bg-emerald-100 text-emerald-800',
    category: 'nutrition',
    categoryLabel: 'Dinh dưỡng',
    publishedAt: '10/10/2026',
    readCount: 1840,
    voteCount: 48,
    status: 'published',
    statusLabel: 'Đang hiển thị',
  },
  {
    id: 'adm-art-2',
    title: 'Cách làm sữa hạt điều mè đen thơm béo tại nhà',
    wordCount: 890,
    readTimeMinutes: 4,
    authorInitials: 'TH',
    authorName: 'Lê Thu Hà',
    authorColorClass: 'bg-emerald-100 text-emerald-800',
    category: 'cooking-tips',
    categoryLabel: 'Mẹo nấu ăn',
    publishedAt: '02/10/2026',
    readCount: 942,
    voteCount: 35,
    status: 'published',
    statusLabel: 'Đang hiển thị',
  },
  {
    id: 'adm-art-3',
    title: 'Thực đơn thuần chay 7 ngày thanh lọc cơ thể hiệu quả',
    wordCount: 2100,
    readTimeMinutes: 10,
    authorInitials: 'GH',
    authorName: 'Trần Gia Huy',
    authorColorClass: 'bg-slate-100 text-slate-800',
    category: 'lifestyle',
    categoryLabel: 'Lối sống chay',
    publishedAt: '24/09/2026',
    readCount: 3250,
    voteCount: 62,
    status: 'published',
    statusLabel: 'Đang hiển thị',
  },
  {
    id: 'adm-art-4',
    title: 'Kinh nghiệm chọn nấm tươi ngon và bảo quản đúng cách',
    wordCount: 1050,
    readTimeMinutes: 5,
    authorInitials: 'PB',
    authorName: 'Phạm Quốc Bảo',
    authorColorClass: 'bg-emerald-100 text-emerald-800',
    category: 'ingredients',
    categoryLabel: 'Nguyên liệu',
    publishedAt: '15/09/2026',
    readCount: 720,
    voteCount: 19,
    status: 'published',
    statusLabel: 'Đang hiển thị',
  },
  {
    id: 'adm-art-5',
    title: 'Những sai lầm phổ biến khi mới bắt đầu ăn thuần chay',
    wordCount: 640,
    readTimeMinutes: 3,
    authorInitials: 'BT',
    authorName: 'Bùi Anh Tuấn',
    authorColorClass: 'bg-rose-100 text-rose-800',
    category: 'health',
    categoryLabel: 'Sức khỏe',
    publishedAt: '10/09/2026',
    readCount: 310,
    voteCount: 8,
    status: 'hidden',
    statusLabel: 'Đã ẩn / gỡ',
  },
  {
    id: 'adm-art-6',
    title: 'Gợi ý 5 bữa sáng chay giàu năng lượng cho người bận rộn',
    wordCount: 1300,
    readTimeMinutes: 6,
    authorInitials: 'PT',
    authorName: 'Đặng Phương Thảo',
    authorColorClass: 'bg-emerald-100 text-emerald-800',
    category: 'nutrition',
    categoryLabel: 'Dinh dưỡng',
    publishedAt: '05/09/2026',
    readCount: 1410,
    voteCount: 41,
    status: 'published',
    statusLabel: 'Đang hiển thị',
  },
]

export async function getAdminArticleStats(): Promise<AdminArticleStats> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return {
    totalCount: 64,
    publishedCount: 58,
    hiddenCount: 6,
    monthlyGrowthText: '+8% tháng này',
    activeRateText: '90.6% hoạt động',
  }
}

export async function getAdminArticles(filter: AdminArticleFilter = {}): Promise<{
  items: AdminArticleItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  let list = [...MOCK_ADMIN_ARTICLES]

  if (filter.status && filter.status !== 'all') {
    list = list.filter((a) => a.status === filter.status)
  }

  if (filter.category && filter.category !== 'all') {
    list = list.filter((a) => a.category === filter.category)
  }

  if (filter.keyword?.trim()) {
    const q = filter.keyword.toLowerCase().trim()
    list = list.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.authorName.toLowerCase().includes(q) ||
        a.categoryLabel.toLowerCase().includes(q)
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

export async function toggleHideArticle(id: string): Promise<AdminArticleItem> {
  await new Promise((resolve) => setTimeout(resolve, 400))
  const target = MOCK_ADMIN_ARTICLES.find((a) => a.id === id)
  if (!target) throw new Error('Không tìm thấy bài viết.')

  target.status = target.status === 'published' ? 'hidden' : 'published'
  target.statusLabel = target.status === 'published' ? 'Đang hiển thị' : 'Đã ẩn / gỡ'
  return { ...target }
}

export async function deleteAdminArticle(id: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 400))
  MOCK_ADMIN_ARTICLES = MOCK_ADMIN_ARTICLES.filter((a) => a.id !== id)
  return true
}
