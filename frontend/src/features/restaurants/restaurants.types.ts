export type CuisineStyle =
  | 'Vietnamese_Traditional'
  | 'Vietnamese_Fusion'
  | 'Buddhist_Monk'
  | 'Vegetarian_International'
  | 'Chinese_Vegan'
  | 'Raw_Food'
  | 'Japanese_Vegetarian'
  | 'Bakery_Dessert'

export type PriceLevel = 'budget' | 'mid_range' | 'premium'

export type OpenTimeStatus = 'open_now' | 'closes_soon' | 'closed' | '24h'

export interface Restaurant {
  id: string
  name: string
  slug?: string
  coverImageUrl: string
  gallery?: string[]
  badges: Array<{
    key: string
    label: string
    variant: 'success' | 'warning' | 'info' | 'primary'
  }>
  address: {
    line1: string
    ward?: string
    district?: string
    city: string
  }
  distanceKm: number
  geo: {
    lat: number
    lng: number
  }
  rating: {
    score: number
    reviewCount: number
  }
  priceLevel: PriceLevel
  priceRangeVND: {
    min: number
    max: number
  }
  cuisine: CuisineStyle[]
  facilities: string[]
  openNow: OpenTimeStatus
  openTextSummary: string
  phone?: string
  highlights: string[]
  warnings?: string[]
  promoted?: boolean
  verified?: boolean
}

export interface SearchFilters {
  keyword: string
  distance: 'all' | 'lt1' | '1to3' | '3to5' | '5to10' | 'gt10'
  sortBy: 'nearest' | 'highest_rated' | 'newest' | 'lowest_price'
  rating: 'all' | 'gte45' | 'gte4' | 'gte35' | 'gte3'
  tags: string[]
  priceLevel: PriceLevel | 'all'
  cuisineFilter: CuisineStyle | 'all'
}

export interface RestaurantListResult {
  total: number
  items: Restaurant[]
  appliedFilters: SearchFilters
  facets: {
    priceCounts: Record<PriceLevel, number>
    cuisineCounts: Record<CuisineStyle, number>
    tagCounts: Record<string, number>
    ratingBuckets: Array<{ key: string; label: string; count: number }>
  }
}

export const FACILITY_TAGS = [
  'has_parking',
  'takeaway_available',
  'delivery_supported',
  'region_specialty',
  'vegan_only',
  'no_cheese_option',
  'event_catering',
  'free_wifi',
  'air_conditioning',
  'outdoor_seating',
  'pet_friendly',
  'accept_booking',
] as const

export const CUISINE_LABELS: Record<CuisineStyle, string> = {
  Vietnamese_Traditional: 'Món truyền thống (Bún chả, Phở, Cơm tấm… chay)',
  Vietnamese_Fusion: 'Nghệ thuật món chay đương đại (Fusion)',
  Buddhist_Monk: 'Chùa & món chay truyền thống kiểu sư',
  Vegetarian_International: 'Thực đơn quốc tế (Pasta, Pizza, Salads… chay)',
  Chinese_Vegan: 'Món Hòa Thường theo phong cách Trung Hoa thuần chay',
  Raw_Food: 'Raw food & Superfoods (món sống, hữu cơ)',
  Japanese_Vegetarian: 'Đồ ăn Nhật Shojin Ryori, sushi chay, ramen chay',
  Bakery_Dessert: 'Bakery, đồ uống & Tráng miệng thuần thực vật',
}
