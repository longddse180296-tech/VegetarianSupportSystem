export type ModerationItemType = 'article' | 'comment' | 'recipe' | 'video'

export type AiFlagStatus =
  | 'NotSubmitted'
  | 'Checking'
  | 'Passed'
  | 'Flagged'
  | 'Partial'
  | 'Failed'

export type AdminApprovalStatus =
  | 'Draft'
  | 'Submitted'
  | 'PendingAdminReview'
  | 'Published'
  | 'RevisionRequested'
  | 'Rejected'
  | 'Removed'

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

export interface AdminModerationStats {
  totalPending: number
  aiFlagged: number
  publishedToday: number
  rejectedToday: number
}
