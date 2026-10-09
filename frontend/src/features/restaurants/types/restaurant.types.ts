// ---------- Enums ----------
export type RestaurantCity = 'Hà Nội' | 'TP.HCM' | 'Đà Nẵng' | 'all' | string

export type RestaurantDietType =
  | 'vegan'
  | 'ovo-lacto'
  | 'ovo'
  | 'lacto'
  | 'raw'
  | 'vegetarian-friendly'
  | 'all'

export type RestaurantSortOption =
  | 'relevance'
  | 'rating_desc'
  | 'distance_asc'
  | 'newest'

// ---------- Labels ----------
export const DIET_TYPE_LABELS: Record<RestaurantDietType, string> = {
  vegan: 'Thuần thực vật (100% chay)',
  'ovo-lacto': 'Lạc trứng sữa',
  ovo: 'Lạc trứng',
  lacto: 'Lạc sữa',
  raw: 'Thực phẩm sống',
  'vegetarian-friendly': 'Có nhiều món chay',
  all: 'Tất cả chế độ ăn',
}

export const CITY_LABELS: Record<string, string> = {
  'all': 'Tất cả tỉnh/thành phố',
  'Hà Nội': 'Hà Nội',
  'TP.HCM': 'TP. Hồ Chí Minh',
  'Đà Nẵng': 'Đà Nẵng',
}

export const SORT_LABELS: Record<RestaurantSortOption, string> = {
  relevance: 'Phù hợp nhất',
  rating_desc: 'Đánh giá cao nhất',
  distance_asc: 'Khoảng cách gần nhất',
  newest: 'Mới mở gần đây',
}

// ---------- Main types ----------
export interface Restaurant {
  id: string
  name: string
  address: string
  city: Exclude<RestaurantCity, 'all'>
  district: string
  geoLat?: number
  geoLng?: number
  distanceKm: number
  openingHours: string
  closingDay: string
  phoneNumber: string
  email?: string
  website?: string
  priceRangeVND: { min: number; max: number }
  dietTypes: Exclude<RestaurantDietType, 'all'>[]
  rating: number // 0..5
  reviewCount: number
  imageUrl: string
  galleryImages?: string[]
  tags: string[]
  highlights: string[]
  hasDelivery: boolean
  hasParking: boolean
  hasTakeAway: boolean
  acceptsBooking: boolean
  createdAt: string
}

export interface RestaurantFilter {
  search: string
  city: RestaurantCity
  diet: RestaurantDietType
  ratingMin: number // 0..5, step 0.5
  sort: RestaurantSortOption
  deliveryOnly: boolean
  favoritesOnly: boolean
}

export const DEFAULT_RESTAURANT_FILTER: RestaurantFilter = {
  search: '',
  city: 'all',
  diet: 'all',
  ratingMin: 0,
  sort: 'relevance',
  deliveryOnly: false,
  favoritesOnly: false,
}

export interface RestaurantListResponse {
  items: Restaurant[]
  totalCount: number
  appliedFilter: RestaurantFilter
}

// ---------- Helpers ----------
export function formatPriceRange(min: number, max: number): string {
  const fmt = (n: number) =>
    n >= 1_000_000
      ? `${(n / 1_000_000).toFixed(1)}M`
      : `${Math.round(n / 1000)}K`
  return `${fmt(min)} - ${fmt(max)} VNĐ / người`
}

export function renderStars(rating: number): string {
  const r = Number.isFinite(rating) ? (rating as number) : 0
  const clamped = Math.max(0, Math.min(5, r))
  const full = Math.floor(clamped)
  const frac = clamped - full
  const hasHalf = frac >= 0.25 && frac < 0.75
  const extraFull = frac >= 0.75 ? 1 : 0
  const filled = full + extraFull
  const empty = Math.max(0, 5 - filled - (hasHalf ? 1 : 0))
  return '★'.repeat(filled) + (hasHalf ? '⯨' : '') + '☆'.repeat(empty)
}
