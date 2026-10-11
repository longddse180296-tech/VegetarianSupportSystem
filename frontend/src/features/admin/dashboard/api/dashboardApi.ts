import { apiClient } from '../../../../shared/api/apiClient'
import type { DashboardOverviewData, RecentActivityItem } from '../types/dashboard.types'

interface BackendCatalogCount {
  total: number
  active: number
}

interface BackendCoreData {
  categories: BackendCatalogCount
  ingredients: BackendCatalogCount
  recipes: BackendCatalogCount
  restaurants: BackendCatalogCount
}

interface BackendMembers {
  registered: number
  active: number
  locked: number
}

interface BackendContent {
  publishedArticles: number
  publishedVideos: number
  comments: number | null
}

interface BackendModerationQueue {
  articles: number
  videos: number
  total: number
}

interface BackendActivity {
  type: string
  entityId: string
  title: string
  actorUserId?: string | null
  actorName?: string | null
  occurredAtUtc: string
}

interface BackendDashboardOverview {
  members: BackendMembers
  coreData: BackendCoreData
  content: BackendContent
  pendingAdminReview: BackendModerationQueue
  recentActivity: BackendActivity[]
}

function formatTimeAgo(utcDateStr: string): string {
  try {
    const diffMs = Date.now() - new Date(utcDateStr).getTime()
    const diffSec = Math.floor(diffMs / 1000)
    if (diffSec < 60) return 'Vừa xong'
    const diffMin = Math.floor(diffSec / 60)
    if (diffMin < 60) return `${diffMin} phút trước`
    const diffHour = Math.floor(diffMin / 60)
    if (diffHour < 24) return `${diffHour} giờ trước`
    const diffDay = Math.floor(diffHour / 24)
    if (diffDay < 30) return `${diffDay} ngày trước`
    return new Date(utcDateStr).toLocaleDateString('vi-VN')
  } catch {
    return 'Gần đây'
  }
}

function mapActivity(act: BackendActivity, index: number): RecentActivityItem {
  const typeLower = act.type.toLowerCase()
  let actType: RecentActivityItem['type'] = 'user'
  let actionText = 'Đã thực hiện thao tác:'

  if (typeLower.includes('article')) {
    actType = 'article'
    actionText = typeLower.includes('submit')
      ? 'Đã gửi bài viết kiểm duyệt:'
      : typeLower.includes('approve')
      ? 'Đã phê duyệt bài viết:'
      : 'Thao tác trên bài viết:'
  } else if (typeLower.includes('video')) {
    actType = 'video'
    actionText = typeLower.includes('submit')
      ? 'Đã gửi video kiểm duyệt:'
      : 'Thao tác trên video:'
  } else if (typeLower.includes('comment')) {
    actType = 'comment'
    actionText = 'Bình luận trên hệ thống:'
  } else if (typeLower.includes('category')) {
    actType = 'category'
    actionText = 'Đã cập nhật danh mục:'
  } else if (typeLower.includes('member')) {
    actType = 'user'
    actionText = typeLower.includes('register')
      ? 'Đăng ký thành viên mới:'
      : typeLower.includes('lock')
      ? 'Đã khóa tài khoản thành viên:'
      : 'Đã mở khóa tài khoản:'
  }

  return {
    id: act.entityId || `act-${index}`,
    actorName: act.actorName || 'Hệ thống',
    timeAgo: formatTimeAgo(act.occurredAtUtc),
    actionText,
    targetTitle: act.title ? `“${act.title}”` : '',
    type: actType,
  }
}

export const MOCK_DASHBOARD_DATA: DashboardOverviewData = {
  stats: {
    members: {
      title: 'Thành viên đã đăng ký',
      value: 128,
      badge: '+12%',
      badgeType: 'success',
      icon: 'users',
      linkPath: '/admin/members',
    },
    articles: {
      title: 'Bài viết đã đăng',
      value: 64,
      badge: '+4 MỚI',
      badgeType: 'info',
      icon: 'file-text',
      linkPath: '/admin/articles',
    },
    videos: {
      title: 'Video hướng dẫn',
      value: 35,
      badge: '+2 MỚI',
      badgeType: 'warning',
      icon: 'video',
      linkPath: '/admin/videos',
    },
    comments: {
      title: 'Bình luận cộng đồng',
      value: 412,
      badge: '+28 TUẦN',
      badgeType: 'purple',
      icon: 'message-square',
      linkPath: '/admin/comments',
    },
    categories: {
      title: 'Danh mục nội dung',
      value: 12,
      badge: 'ỔN ĐỊNH',
      badgeType: 'neutral',
      icon: 'layers',
      linkPath: '/admin/categories',
    },
  },
  recentArticles: [
    {
      id: 'ra-1',
      title: 'Kinh nghiệm bổ sung Protein thực vật cho người mới...',
      authorName: 'Nguyễn Minh Anh',
      publishedAt: '14/10/2024',
    },
    {
      id: 'ra-2',
      title: 'Cách chuẩn bị Meal Prep chay tiện lợi cho cả tuần...',
      authorName: 'Lê Thu Hà',
      publishedAt: '28/09/2024',
    },
  ],
  recentVideos: [
    {
      id: 'rv-1',
      title: 'Đậu hũ sốt nấm hương đậm đà thơm ngọt',
      authorName: 'Trần Gia Huy',
      duration: '08:45',
      publishedAt: '12/10/2024',
    },
  ],
  recentActivities: [
    {
      id: 'act-1',
      actorName: 'Nguyễn Minh Anh',
      timeAgo: '10 phút trước',
      actionText: 'Đã đăng bài viết mới:',
      targetTitle: '“Kinh nghiệm bổ sung Protein thực vật”',
      type: 'article',
    },
  ],
}

/**
 * Fetch Admin Dashboard Overview Data
 * Real backend API: GET /api/admin/dashboard
 */
export async function getDashboardOverview(): Promise<DashboardOverviewData> {
    const data = await apiClient.get<BackendDashboardOverview>('/api/admin/dashboard')

    return {
      stats: {
        members: {
          title: 'Thành viên đã đăng ký',
          value: data.members.registered,
          badge: `${data.members.active} hoạt động`,
          badgeType: 'success',
          icon: 'users',
          linkPath: '/admin/members',
        },
        articles: {
          title: 'Bài viết đã xuất bản',
          value: data.content.publishedArticles,
          badge: data.pendingAdminReview.articles > 0 ? `${data.pendingAdminReview.articles} CHỜ DUYỆT` : 'ĐÃ ĐỒNG BỘ',
          badgeType: data.pendingAdminReview.articles > 0 ? 'warning' : 'info',
          icon: 'file-text',
          linkPath: '/admin/articles',
        },
        videos: {
          title: 'Video hướng dẫn',
          value: data.content.publishedVideos,
          badge: data.pendingAdminReview.videos > 0 ? `${data.pendingAdminReview.videos} CHỜ DUYỆT` : 'ỔN ĐỊNH',
          badgeType: data.pendingAdminReview.videos > 0 ? 'warning' : 'neutral',
          icon: 'video',
          linkPath: '/admin/videos',
        },
        comments: {
          title: 'Bình luận cộng đồng',
          value: data.content.comments ?? 0,
          badge: 'HIỂN THỊ',
          badgeType: 'purple',
          icon: 'message-square',
          linkPath: '/admin/comments',
        },
        categories: {
          title: 'Danh mục công thức',
          value: data.coreData.categories.total,
          badge: `${data.coreData.categories.active} ĐANG DÙNG`,
          badgeType: 'neutral',
          icon: 'layers',
          linkPath: '/admin/categories',
        },
      },
      recentArticles: [],
      recentVideos: [],
      recentActivities: data.recentActivity.map(mapActivity),
    }
}
