export type AdminArticleStatus = 'published' | 'pending' | 'hidden'

export interface AdminArticleItem {
  id: string
  title: string
  thumbnailUrl?: string
  wordCount: number
  readTimeMinutes: number
  authorInitials: string
  authorName: string
  authorColorClass?: string
  category: string
  categoryLabel: string
  publishedAt: string
  readCount: number
  voteCount: number
  status: AdminArticleStatus
  statusLabel: string
  rejectReason?: string
}

export interface AdminArticleStats {
  totalCount: number
  publishedCount: number
  pendingCount: number
  hiddenCount: number
  monthlyGrowthText: string
  activeRateText: string
}

export interface AdminArticleFilter {
  keyword?: string
  status?: 'all' | 'published' | 'pending' | 'hidden'
  category?: string
  sortBy?: 'newest' | 'reads' | 'votes'
  page?: number
  pageSize?: number
}

export interface ArticleFormData {
  title: string
  category: string
  content?: string
}
