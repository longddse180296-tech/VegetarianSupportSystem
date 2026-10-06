export type MemberStatus = 'active' | 'locked'

export interface MemberSummary {
  id: string
  fullName: string
  tagTitle?: string // e.g. "Thành viên tích cực", "Đầu bếp chay", "Tác giả bài viết"
  email: string
  registeredDate: string
  postCount: number
  videoCount: number
  commentCount: number
  status: MemberStatus
  dietaryType?: string
  lockReason?: string
}

export interface MemberArticle {
  id: string
  title: string
  wordCount: number
  readTimeMinutes: number
  category: string
  publishedDate: string
  voteCount: number
  commentCount: number
}

export interface MemberDetail extends MemberSummary {
  code: string // e.g. "#VS-88902"
  bio?: string
  articles: MemberArticle[]
}

export interface MemberFilter {
  search?: string
  status?: 'all' | 'active' | 'locked'
  sortBy?: 'newest' | 'oldest' | 'most_posts'
  page?: number
  pageSize?: number
}

export interface MemberStats {
  totalMembers: number
  activeMembers: number
  lockedMembers: number
  growthRatePercent: number
  activeRatePercent: number
}
