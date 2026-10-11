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
  priceRange?: string
  description?: string
  amenities?: string[]
  menuItems?: RestaurantDish[]
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
  /** Khoảng cách tối đa (km) theo pills Tất cả | <1 | <3 | <5 | <10. 0 = không lọc (Tất cả). */
  distanceMaxKm: 0 | 1 | 3 | 5 | 10
}

export const DEFAULT_RESTAURANT_FILTER: RestaurantFilter = {
  search: '',
  city: 'all',
  diet: 'all',
  ratingMin: 0,
  sort: 'relevance',
  deliveryOnly: false,
  favoritesOnly: false,
  distanceMaxKm: 0,
}

export interface RestaurantListResponse {
  items: Restaurant[]
  totalCount: number
  appliedFilter: RestaurantFilter
}

// ---------- Supporting types (API layer helpers) ----------
export interface DishChip {
  label: string
  count: number
  emoji: string
}

export interface MapPinMarker {
  top: string
  left: string
  id: string
  color?: string
  label: string
}

export interface RestaurantDish {
  id: string
  tag: string
  tagColor?: string
  name: string
  desc: string
  imgSeed: string
  priceVND?: number
}

// ---------- Detail page supporting types ----------
export interface WeekHour {
  day: string
  label: string
  time: string
  isToday?: boolean
}

export interface ReviewComment {
  id: string
  userName: string
  avatarSeed: string
  rating: number
  content: string
  timeAgo: string
}

export interface RelatedContentCard {
  id: string
  tag: string
  tagStyle: string
  title: string
  desc: string
  meta: string
  imgSeed: string
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
