export type VideoCategory =
  | 'all'
  | 'main'
  | 'salad'
  | 'soup'
  | 'drink'
  | 'dessert'
  | 'noodle'

export type SortKey = 'newest' | 'most_viewed' | 'shortest'

export interface VideoChef {
  id: string
  name: string
  title: string
  avatarUrl?: string
  videosCount: number
}

export interface CookingVideo {
  id: string
  title: string
  description: string
  thumbnailUrl: string
  durationSec: number
  viewsCount: number
  publishedAtISO: string
  category: Exclude<VideoCategory, 'all'>
  tags: string[]
  featured?: boolean
  chef: {
    id: string
    name: string
    title?: string
  }
}

export interface VideoListResult {
  items: CookingVideo[]
  pagination: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
  }
  featured?: CookingVideo | null
  trendingChefs: VideoChef[]
  popularTags: string[]
  totalVideos: number
}

export interface VideoFilterValues {
  search: string
  category: VideoCategory
  sort: SortKey
  page: number
}

export const CATEGORY_LABELS: Record<VideoCategory, string> = {
  all: 'Tất cả',
  main: 'Món chính',
  salad: 'Salad',
  soup: 'Món nước',
  drink: 'Đồ uống',
  dessert: 'Tráng miệng',
  noodle: 'Mèo nũn ăn',
}

export const SORT_LABELS: Record<SortKey, string> = {
  newest: 'Mới nhất',
  most_viewed: 'Xem nhiều nhất',
  shortest: 'Thời lượng ngắn nhất',
}

export const DEFAULT_FILTER_VALUES: VideoFilterValues = {
  search: '',
  category: 'all',
  sort: 'newest',
  page: 1,
}
