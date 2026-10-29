// Chức năng: thống kê và góp ý gửi đến Admin. Khai báo cấu trúc dữ liệu để các màn hình và hàm xử lý dùng thống nhất.
// Cấu trúc StatMetric quy định dữ liệu trao đổi trong thống kê và góp ý gửi đến Admin.
export interface StatMetric {
  title: string
  value: number
  badge: string
  badgeType: 'success' | 'info' | 'warning' | 'purple' | 'neutral'
  icon: string
  linkPath: string
}

// Cấu trúc DashboardStats quy định dữ liệu trao đổi trong thống kê và góp ý gửi đến Admin.
export interface DashboardStats {
  members: StatMetric
  articles: StatMetric
  videos: StatMetric
  comments: StatMetric
  categories: StatMetric
}

// Cấu trúc RecentArticleItem quy định dữ liệu trao đổi trong thống kê và góp ý gửi đến Admin.
export interface RecentArticleItem {
  id: string
  title: string
  authorName: string
  publishedAt: string
}

// Cấu trúc RecentVideoItem quy định dữ liệu trao đổi trong thống kê và góp ý gửi đến Admin.
export interface RecentVideoItem {
  id: string
  title: string
  authorName: string
  duration: string
  publishedAt: string
}

// Cấu trúc RecentActivityItem quy định dữ liệu trao đổi trong thống kê và góp ý gửi đến Admin.
export interface RecentActivityItem {
  id: string
  actorName: string
  actorRole?: string
  timeAgo: string
  actionText: string
  targetTitle: string
  type: 'article' | 'video' | 'comment' | 'category' | 'user'
}

// Cấu trúc DashboardOverviewData quy định dữ liệu trao đổi trong thống kê và góp ý gửi đến Admin.
export interface DashboardOverviewData {
  stats: DashboardStats
  recentArticles: RecentArticleItem[]
  recentVideos: RecentVideoItem[]
  recentActivities: RecentActivityItem[]
}
