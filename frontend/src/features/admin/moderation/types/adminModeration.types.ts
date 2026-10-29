// Chức năng: kiểm duyệt nội dung và kết quả kiểm tra AI. Khai báo cấu trúc dữ liệu để các màn hình và hàm xử lý dùng thống nhất.
// Cấu trúc ModerationItemType quy định dữ liệu trao đổi trong kiểm duyệt nội dung và kết quả kiểm tra AI.
export type ModerationItemType = 'article' | 'comment' | 'recipe' | 'video'

// Cấu trúc AiFlagStatus quy định dữ liệu trao đổi trong kiểm duyệt nội dung và kết quả kiểm tra AI.
export type AiFlagStatus =
  | 'NotSubmitted'
  | 'Checking'
  | 'Passed'
  | 'Flagged'
  | 'Partial'
  | 'Failed'

// Cấu trúc AdminApprovalStatus quy định dữ liệu trao đổi trong kiểm duyệt nội dung và kết quả kiểm tra AI.
export type AdminApprovalStatus =
  | 'Draft'
  | 'Submitted'
  | 'PendingAdminReview'
  | 'Published'
  | 'RevisionRequested'
  | 'Rejected'
  | 'Removed'

// Cấu trúc AdminModerationItem quy định dữ liệu trao đổi trong kiểm duyệt nội dung và kết quả kiểm tra AI.
export interface AdminModerationItem {
  id: string
  type: ModerationItemType
  title: string
  authorName: string
  aiFlagStatus: AiFlagStatus
  adminStatus: AdminApprovalStatus
  flaggedReason?: string
  submittedAt: string
}

// Cấu trúc AdminModerationStats quy định dữ liệu trao đổi trong kiểm duyệt nội dung và kết quả kiểm tra AI.
export interface AdminModerationStats {
  totalPending: number
  aiFlagged: number
  publishedToday: number
  rejectedToday: number
}
