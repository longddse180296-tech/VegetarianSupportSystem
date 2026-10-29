// Chức năng: video, bản nháp và nội dung công khai. Khai báo cấu trúc dữ liệu để các màn hình và hàm xử lý dùng thống nhất.
// ---------- Enums & Union Types ----------
// Cấu trúc ModerationStatus quy định dữ liệu trao đổi trong video, bản nháp và nội dung công khai.
export type ModerationStatus = 'pending_ai' | 'flagged_by_ai' | 'approved' | 'rejected'

// Cấu trúc VideoModerationStatus quy định dữ liệu trao đổi trong video, bản nháp và nội dung công khai.
export type VideoModerationStatus =
  | ModerationStatus
  | 'ai_checking'
  | 'pending_admin'
  | 'published'

// Cấu trúc VideoCategory quy định dữ liệu trao đổi trong video, bản nháp và nội dung công khai.
export type VideoCategory =
  | 'cooking-tutorial'
  | 'ingredient-guide'
  | 'vegan-lifestyle'
  | 'meal-prep'
  | 'restaurant-review'
  | 'health-tips'
  | 'quick-recipe'
  | 'festival-food'

// Cấu trúc VideoSortOption quy định dữ liệu trao đổi trong video, bản nháp và nội dung công khai.
export type VideoSortOption =
  | 'trending'
  | 'newest'
  | 'duration_asc'
  | 'most_liked'

// Cấu trúc CoreDietType quy định dữ liệu trao đổi trong video, bản nháp và nội dung công khai.
export type CoreDietType =
  | 'Thuần chay (Vegan)'
  | 'Ăn chay có sữa (Lacto)'
  | 'Chay có trứng (Ovo)'
  | 'Trứng & Sữa (Lacto-ovo)'

// ---------- Labels ----------
export const MODERATION_STATUS_LABELS: Record<VideoModerationStatus, string> = {
  pending_ai: 'AI đang kiểm tra',
  ai_checking: 'AI đang kiểm tra',
  flagged_by_ai: 'AI gắn cờ vi phạm',
  pending_admin: 'Chờ Admin duyệt',
  approved: 'Đã xuất bản',
  published: 'Đã xuất bản',
  rejected: 'Bị từ chối',
}

export const CATEGORY_LABELS: Record<VideoCategory, string> = {
  'cooking-tutorial': 'Hướng dẫn nấu ăn',
  'ingredient-guide': 'Hướng dẫn chọn nguyên liệu',
  'vegan-lifestyle': 'Lối sống thuần thực vật',
  'meal-prep': 'Chuẩn bị bữa ăn (meal prep)',
  'restaurant-review': 'Review nhà hàng chay',
  'health-tips': 'Mẹo sức khỏe & dinh dưỡng',
  'quick-recipe': 'Công thức nhanh dưới 30 phút',
  'festival-food': 'Món ăn lễ hội & giỗ tổ',
}

export const SORT_LABELS: Record<VideoSortOption, string> = {
  trending: 'Xu hướng',
  newest: 'Mới nhất',
  duration_asc: 'Thời lượng ngắn nhất',
  most_liked: 'Yêu thích nhất',
}

// ---------- Sub-entities ----------
// Cấu trúc VideoAuthor quy định dữ liệu trao đổi trong video, bản nháp và nội dung công khai.
export interface VideoAuthor {
  name: string
  role?: string
  avatar: string
  followers?: string | number
  verified?: boolean
}

// Cấu trúc VideoComment quy định dữ liệu trao đổi trong video, bản nháp và nội dung công khai.
export interface VideoComment {
  id: string
  authorName: string
  authorAvatar: string
  authorBadge?: 'Thành viên tích cực' | 'Chuyên gia xác thực' | 'Tác giả' | string
  createdAt: string
  content: string
  likes: number
  replies?: VideoComment[]
}

// ---------- Main Video Entity (Task 5 requirement) ----------
// Cấu trúc Video quy định dữ liệu trao đổi trong video, bản nháp và nội dung công khai.
export interface Video {
  id: string
  title: string
  description: string
  category: VideoCategory | string
  dietType?: CoreDietType | string
  videoUrl: string
  thumbnailUrl: string
  duration?: string
  durationSeconds: number
  hasAudio?: boolean | null
  metadataStatus?: 'Processing' | 'Ready' | 'Unavailable'
  views?: string | number
  viewCount: number
  author?: VideoAuthor
  creatorName: string
  creatorAvatar: string
  createdAt: string
  likes?: number
  likeCount: number
  shares?: number
  moderationStatus: VideoModerationStatus
  flagReason?: string
  aiFlagNote?: string
  adminNote?: string
  ingredients?: string[]
  steps?: string[]
  comments?: VideoComment[]
  tags: string[]
  isFeatured?: boolean
}

// Backward-compatible alias
// Cấu trúc VideoItem quy định dữ liệu trao đổi trong video, bản nháp và nội dung công khai.
export type VideoItem = Video

// ---------- Form & Filter states ----------
// Cấu trúc UploadVideoFormState quy định dữ liệu trao đổi trong video, bản nháp và nội dung công khai.
export interface UploadVideoFormState {
  title: string
  videoUrl: string
  thumbnailUrl: string
  category: VideoCategory | string
  description: string
  duration: string
}

export const INITIAL_UPLOAD_FORM: UploadVideoFormState = {
  title: '',
  videoUrl: '',
  thumbnailUrl: '',
  category: '',
  description: '',
  duration: '',
}

// Cấu trúc VideoListFilter quy định dữ liệu trao đổi trong video, bản nháp và nội dung công khai.
export interface VideoListFilter {
  search: string
  category: VideoCategory | 'all'
  status: VideoModerationStatus | 'all'
  sort: VideoSortOption
}

export const DEFAULT_VIDEO_FILTER: VideoListFilter = {
  search: '',
  category: 'all',
  status: 'all',
  sort: 'trending',
}

// Cấu trúc VideoListResponse quy định dữ liệu trao đổi trong video, bản nháp và nội dung công khai.
export interface VideoListResponse {
  items: Video[]
  totalCount: number
  appliedFilter: VideoListFilter
}

// ---------- Helper ----------
// Chuẩn hóa hoặc chuyển đổi dữ liệu giữa các bước xử lý (formatDuration); thuộc video, bản nháp và nội dung công khai.
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}
