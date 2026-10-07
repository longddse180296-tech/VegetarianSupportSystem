export type VideoStatus = 'published' | 'hidden'

export interface AdminVideoItem {
  id: string
  title: string
  videoUrl: string
  thumbnailUrl?: string
  resolution: string
  authorName: string
  authorInitials: string
  authorAvatarBg?: string
  category: string
  categoryLabel: string
  publishedAt: string
  duration: string
  status: VideoStatus
  statusLabel: string
  description?: string
}

export interface AdminVideoStats {
  totalCount: number
  publishedCount: number
  hiddenCount: number
}

export interface AdminVideoFilter {
  keyword?: string
  status?: 'all' | 'published' | 'hidden'
  category?: string
  sortBy?: 'newest' | 'duration' | 'title'
  page?: number
  pageSize?: number
}

export interface VideoFormData {
  id?: string
  title: string
  videoUrl: string
  thumbnailUrl?: string
  category: string
  duration: string
  resolution: string
  description?: string
  isPublished: boolean
}
