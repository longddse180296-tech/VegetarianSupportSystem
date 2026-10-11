import { apiClient } from '../../../../shared/api/apiClient'
import type {
  AdminArticleFilter,
  AdminArticleItem,
  AdminArticleStats,
} from '../types/adminArticles.types'

interface BackendModerationItem {
  id: string
  contentId: string | null
  version: number
  contentType: 'Article' | 'Video'
  ownerUserId: string
  title: string
  textContent: string
  mediaReference: string | null
  aiFlagStatus: string
  adminReviewStatus: 'Draft' | 'Submitted' | 'PendingAdminReview' | 'Published' | 'RevisionRequested' | 'Rejected' | 'Removed'
  aiSummary: string | null
  aiFlagReason: string | null
  submittedAt: string
  createdAtUtc: string
  updatedAtUtc: string
  isCurrentPublished: boolean
}

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
  try {
    const pageNum = filter.page || 1
    const pageSize = filter.pageSize || 10
    const query = new URLSearchParams()
    query.set('contentType', 'Article')
    query.set('page', String(pageNum))
    query.set('pageSize', String(pageSize))

    const res = await apiClient.get<{
      items: BackendModerationItem[]
      totalCount: number
      page: number
      pageSize: number
    }>(`/api/admin/moderation/submissions?${query.toString()}`, { requiresAuth: true })

    if (res && res.items && res.items.length > 0) {
      const mapped: AdminArticleItem[] = res.items.map((m) => {
        let status: AdminArticleItem['status'] = 'pending'
        let statusLabel = 'Chờ kiểm duyệt'

        if (m.adminReviewStatus === 'Published') {
          status = 'published'
          statusLabel = 'Đang hiển thị'
        } else if (
          m.adminReviewStatus === 'PendingAdminReview' ||
          m.adminReviewStatus === 'Submitted'
        ) {
          status = 'pending'
          statusLabel = 'Chờ kiểm duyệt'
        } else if (
          m.adminReviewStatus === 'Rejected' ||
          m.adminReviewStatus === 'Removed'
        ) {
          status = 'hidden'
          statusLabel = 'Bị từ chối'
        }

        return {
          id: m.id,
          title: m.title,
          wordCount: m.textContent ? m.textContent.split(/\s+/).length : 500,
          readTimeMinutes: Math.max(
            1,
            Math.ceil((m.textContent ? m.textContent.length : 1000) / 500)
          ),
          authorInitials: 'TG',
          authorName: m.ownerUserId || 'Tác giả',
          authorColorClass: 'bg-emerald-100 text-[#1b5e20]',
          category: 'nutrition',
          categoryLabel: 'Dinh dưỡng',
          publishedAt: new Date(m.submittedAt || m.createdAtUtc).toLocaleDateString('vi-VN'),
          readCount: 120,
          voteCount: 15,
          status,
          statusLabel,
          aiFlagReason: m.aiFlagReason || undefined,
        }
      })

      return {
        items: mapped,
        total: res.totalCount,
        page: res.page,
        pageSize: res.pageSize,
        totalPages: Math.ceil(res.totalCount / res.pageSize) || 1,
      }
    }
  } catch (err) {
    console.warn('Backend moderation submissions call failed, using fallback:', err)
  }

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
  const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  if (isGuid) {
    try {
      await apiClient.post(
        `/api/admin/moderation/submissions/${id}/decisions`,
        { decision: 'Approve', reason: 'Nội dung đạt chuẩn xuất bản' },
        { requiresAuth: true }
      )
    } catch (err) {
      console.warn('Approve decision failed:', err)
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 400))
  const target = MOCK_ADMIN_ARTICLES.find((a) => a.id === id)
  if (target) {
    target.status = 'published'
    target.statusLabel = 'Đang hiển thị'
    return { ...target }
  }

  return {
    id,
    title: 'Bài viết đã duyệt',
    wordCount: 1200,
    readTimeMinutes: 5,
    authorInitials: 'TG',
    authorName: 'Tác giả',
    authorColorClass: 'bg-emerald-100 text-[#1b5e20]',
    category: 'nutrition',
    categoryLabel: 'Dinh dưỡng',
    publishedAt: 'Hôm nay',
    readCount: 0,
    voteCount: 0,
    status: 'published',
    statusLabel: 'Đang hiển thị',
  }
}

export async function rejectArticle(id: string, reason: string): Promise<AdminArticleItem> {
  const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  if (isGuid) {
    try {
      await apiClient.post(
        `/api/admin/moderation/submissions/${id}/decisions`,
        { decision: 'Reject', reason },
        { requiresAuth: true }
      )
    } catch (err) {
      console.warn('Reject decision failed:', err)
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 400))
  const target = MOCK_ADMIN_ARTICLES.find((a) => a.id === id)
  if (target) {
    target.status = 'hidden'
    target.statusLabel = 'Bị từ chối'
    target.rejectReason = reason
    return { ...target }
  }

  return {
    id,
    title: 'Bài viết bị từ chối',
    wordCount: 1200,
    readTimeMinutes: 5,
    authorInitials: 'TG',
    authorName: 'Tác giả',
    authorColorClass: 'bg-rose-100 text-rose-800',
    category: 'nutrition',
    categoryLabel: 'Dinh dưỡng',
    publishedAt: 'Hôm nay',
    readCount: 0,
    voteCount: 0,
    status: 'hidden',
    statusLabel: 'Bị từ chối',
    rejectReason: reason,
  }
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
