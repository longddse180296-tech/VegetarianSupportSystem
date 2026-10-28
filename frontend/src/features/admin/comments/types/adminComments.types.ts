// Chức năng: bình luận và tương tác cộng đồng. Khai báo cấu trúc dữ liệu để các màn hình và hàm xử lý dùng thống nhất.
// Cấu trúc CommentTargetType quy định dữ liệu trao đổi trong bình luận và tương tác cộng đồng.
export type CommentTargetType = 'article' | 'video'

// Cấu trúc CommentStatus quy định dữ liệu trao đổi trong bình luận và tương tác cộng đồng.
export type CommentStatus = 'published' | 'hidden'

// Cấu trúc AdminCommentItem quy định dữ liệu trao đổi trong bình luận và tương tác cộng đồng.
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

// Cấu trúc AdminCommentStats quy định dữ liệu trao đổi trong bình luận và tương tác cộng đồng.
export interface AdminCommentStats {
  totalCount: number
  publishedCount: number
  hiddenCount: number
}

// Cấu trúc AdminCommentFilter quy định dữ liệu trao đổi trong bình luận và tương tác cộng đồng.
export interface AdminCommentFilter {
  keyword?: string
  status?: 'all' | 'published' | 'hidden'
  targetType?: 'all' | 'article' | 'video'
  sortBy?: 'newest' | 'oldest'
  page?: number
  pageSize?: number
}
