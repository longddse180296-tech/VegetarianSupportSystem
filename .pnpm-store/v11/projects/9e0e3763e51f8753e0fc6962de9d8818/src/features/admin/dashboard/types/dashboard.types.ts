export interface StatMetric {
  title: string
  value: number
  badge: string
  badgeType: 'success' | 'info' | 'warning' | 'purple' | 'neutral'
  icon: string
  linkPath: string
}

export interface DashboardStats {
  members: StatMetric
  articles: StatMetric
  videos: StatMetric
  comments: StatMetric
  categories: StatMetric
}

export interface RecentArticleItem {
  id: string
  title: string
  authorName: string
  publishedAt: string
}

export interface RecentVideoItem {
  id: string
  title: string
  authorName: string
  duration: string
  publishedAt: string
}

export interface RecentActivityItem {
  id: string
  actorName: string
  actorRole?: string
  timeAgo: string
  actionText: string
  targetTitle: string
  type: 'article' | 'video' | 'comment' | 'category' | 'user'
}

export interface DashboardOverviewData {
  stats: DashboardStats
  recentArticles: RecentArticleItem[]
  recentVideos: RecentVideoItem[]
  recentActivities: RecentActivityItem[]
}
