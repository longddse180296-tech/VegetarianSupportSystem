// Chức năng: video, bản nháp và nội dung công khai. Khai báo cấu trúc dữ liệu để các màn hình và hàm xử lý dùng thống nhất.
// Cấu trúc VideoStatus quy định dữ liệu trao đổi trong video, bản nháp và nội dung công khai.
export type VideoStatus = 'published' | 'pending' | 'hidden'

// Cấu trúc AdminVideoItem quy định dữ liệu trao đổi trong video, bản nháp và nội dung công khai.
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
  rejectReason?: string
}

// Cấu trúc AdminVideoStats quy định dữ liệu trao đổi trong video, bản nháp và nội dung công khai.
export interface AdminVideoStats {
  totalCount: number
  publishedCount: number
  pendingCount: number
  hiddenCount: number
}

// Cấu trúc AdminVideoFilter quy định dữ liệu trao đổi trong video, bản nháp và nội dung công khai.
export interface AdminVideoFilter {
  keyword?: string
  status?: 'all' | 'published' | 'pending' | 'hidden'
  category?: string
  sortBy?: 'newest' | 'duration' | 'title'
  page?: number
  pageSize?: number
}

// Cấu trúc VideoFormData quy định dữ liệu trao đổi trong video, bản nháp và nội dung công khai.
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
