export type CommentTargetType = 'article' | 'video'

export type CommentStatus = 'published' | 'hidden'

export interface AdminCommentItem {
  id: string
  content: string
  isViolation?: boolean
  violationReason?: string
  authorName: string
  authorEmail: string
  authorInitials: string
  authorAvatarBg?: string
  targetType: CommentTargetType
  targetTitle: string
  targetId: string
  createdAt: string
  status: CommentStatus
  statusLabel: string
}

export interface AdminCommentStats {
  totalCount: number
  publishedCount: number
  hiddenCount: number
}

export interface AdminCommentFilter {
  keyword?: string
  status?: 'all' | 'published' | 'hidden'
  targetType?: 'all' | 'article' | 'video'
  sortBy?: 'newest' | 'oldest'
  page?: number
  pageSize?: number
}
