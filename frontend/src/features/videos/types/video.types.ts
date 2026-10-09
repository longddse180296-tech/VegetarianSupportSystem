// ---------- Enums ----------
export type VideoModerationStatus = 'ai_checking' | 'pending_admin' | 'published' | 'rejected'

export type VideoCategory =
  | 'cooking-tutorial'
  | 'ingredient-guide'
  | 'vegan-lifestyle'
  | 'meal-prep'
  | 'restaurant-review'
  | 'health-tips'
  | 'quick-recipe'
  | 'festival-food'

export type VideoSortOption =
  | 'trending'
  | 'newest'
  | 'duration_asc'
  | 'most_liked'

// ---------- Labels ----------
export const MODERATION_STATUS_LABELS: Record<VideoModerationStatus, string> = {
  ai_checking: 'AI đang kiểm tra',
  pending_admin: 'Chờ Admin',
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

// ---------- Main types ----------
export interface VideoItem {
  id: string
  title: string
  videoUrl: string
  thumbnailUrl: string
  durationSeconds: number
  category: VideoCategory
  moderationStatus: VideoModerationStatus
  aiFlagNote?: string
  adminNote?: string
  creatorName: string
  creatorAvatar: string
  viewCount: number
  likeCount: number
  description: string
  tags: string[]
  createdAt: string
}

export interface UploadVideoFormState {
  title: string
  videoUrl: string
  thumbnailUrl: string
  category: VideoCategory | ''
  description: string
  duration: string // seconds as string input from user
}

export const INITIAL_UPLOAD_FORM: UploadVideoFormState = {
  title: '',
  videoUrl: '',
  thumbnailUrl: '',
  category: '',
  description: '',
  duration: '',
}

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

export interface VideoListResponse {
  items: VideoItem[]
  totalCount: number
  appliedFilter: VideoListFilter
}

// ---------- Helpers ----------
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}
