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
    authorColorClass: 'bg-emerald-100 text-[#1b5e20]',
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
    title: 'Cách làm sữa hạt điều mè đen thơm béo tại nhà không tách nước',
    wordCount: 890,
    readTimeMinutes: 4,
    authorInitials: 'TH',
    authorName: 'Lê Thu Hà',
    authorColorClass: 'bg-emerald-100 text-[#1b5e20]',
    category: 'cooking-tips',
    categoryLabel: 'Mẹo nấu ăn',
    publishedAt: '08/10/2026',
    readCount: 942,
    voteCount: 35,
    status: 'published',
    statusLabel: 'Đang hiển thị',
  },
  {
    id: 'adm-art-3',
    title: 'Bí quyết cân bằng Acid Amin và Vitamin B12 cho người ăn chay trường',
    wordCount: 1750,
    readTimeMinutes: 8,
    authorInitials: 'QT',
    authorName: 'Trần Quốc Tuấn',
    authorColorClass: 'bg-amber-100 text-amber-800',
    category: 'nutrition',
    categoryLabel: 'Dinh dưỡng',
    publishedAt: 'Hôm nay',
    readCount: 0,
    voteCount: 0,
    status: 'pending',
    statusLabel: 'Chờ kiểm duyệt',
  },
  {
    id: 'adm-art-4',
    title: 'Kinh nghiệm chọn nấm tươi ngon và bảo quản đúng cách không bị thâm',
    wordCount: 1050,
    readTimeMinutes: 5,
    authorInitials: 'PB',
    authorName: 'Phạm Quốc Bảo',
    authorColorClass: 'bg-emerald-100 text-[#1b5e20]',
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
    title: 'Chia sẻ thực đơn dưỡng sinh Oshawa hồi phục sức khỏe 14 ngày',
    wordCount: 2200,
    readTimeMinutes: 11,
    authorInitials: 'HM',
    authorName: 'Hoàng Minh',
    authorColorClass: 'bg-amber-100 text-amber-800',
    category: 'lifestyle',
    categoryLabel: 'Lối sống chay',
    publishedAt: 'Hôm qua',
    readCount: 0,
    voteCount: 0,
    status: 'pending',
    statusLabel: 'Chờ kiểm duyệt',
  },
  {
    id: 'adm-art-6',
    title: 'Những sai lầm phổ biến khi mới bắt đầu ăn thuần chay khiến mệt mỏi',
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
    statusLabel: 'Đã tạm ẩn',
  },
]

export async function getAdminArticleStats(): Promise<AdminArticleStats> {
  // Simulate 1.5s network latency per directive
  await new Promise((resolve) => setTimeout(resolve, 1500))
  return {
    totalCount: MOCK_ADMIN_ARTICLES.length,
    publishedCount: MOCK_ADMIN_ARTICLES.filter((a) => a.status === 'published').length,
    pendingCount: MOCK_ADMIN_ARTICLES.filter((a) => a.status === 'pending').length,
    hiddenCount: MOCK_ADMIN_ARTICLES.filter((a) => a.status === 'hidden').length,
    monthlyGrowthText: '+18.5% so với tháng trước',
    activeRateText: '91.2% tỷ lệ duyệt hợp lệ',
  }
}

export async function getAdminArticles(filter: AdminArticleFilter = {}): Promise<{
  items: AdminArticleItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}> {
  // Simulate 1.5s network latency per directive
  await new Promise((resolve) => setTimeout(resolve, 1500))

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

  if (filter.sortBy === 'reads') {
    list.sort((a, b) => b.readCount - a.readCount)
  } else if (filter.sortBy === 'votes') {
    list.sort((a, b) => b.voteCount - a.voteCount)
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

export async function approveArticle(id: string): Promise<AdminArticleItem> {
  // Simulate 1.5s network latency per directive
  await new Promise((resolve) => setTimeout(resolve, 1500))

  const target = MOCK_ADMIN_ARTICLES.find((a) => a.id === id)
  if (!target) throw new Error('Không tìm thấy bài viết.')

  target.status = 'published'
  target.statusLabel = 'Đang hiển thị'
  return { ...target }
}

export async function rejectArticle(id: string, reason: string): Promise<AdminArticleItem> {
  // Simulate 1.5s network latency per directive
  await new Promise((resolve) => setTimeout(resolve, 1500))

  const target = MOCK_ADMIN_ARTICLES.find((a) => a.id === id)
  if (!target) throw new Error('Không tìm thấy bài viết.')

  target.status = 'hidden'
  target.statusLabel = 'Bị từ chối'
  target.rejectReason = reason
  return { ...target }
}

export async function toggleHideArticle(id: string): Promise<AdminArticleItem> {
  // Simulate 1.5s network latency per directive
  await new Promise((resolve) => setTimeout(resolve, 1500))

  const target = MOCK_ADMIN_ARTICLES.find((a) => a.id === id)
  if (!target) throw new Error('Không tìm thấy bài viết.')

  if (target.status === 'published') {
    target.status = 'hidden'
    target.statusLabel = 'Đã tạm ẩn'
  } else {
    target.status = 'published'
    target.statusLabel = 'Đang hiển thị'
  }
  return { ...target }
}

export async function deleteAdminArticle(id: string): Promise<boolean> {
  // Simulate 1.5s network latency per directive
  await new Promise((resolve) => setTimeout(resolve, 1500))

  MOCK_ADMIN_ARTICLES = MOCK_ADMIN_ARTICLES.filter((a) => a.id !== id)
  return true
}

export const adminArticlesApi = {
  list: getAdminArticles,
  getStats: getAdminArticleStats,
  approve: approveArticle,
  reject: rejectArticle,
  toggleHide: toggleHideArticle,
  remove: deleteAdminArticle,
}
