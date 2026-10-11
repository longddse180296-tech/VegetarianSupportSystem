import { apiClient } from '../../../shared/api/apiClient'
import type {
  DishChip,
  MapPinMarker,
  RelatedContentCard,
  Restaurant,
  RestaurantDietType,
  RestaurantDish,
  RestaurantFilter,
  RestaurantListResponse,
  ReviewComment,
  WeekHour,
} from '../types/restaurant.types'
import { DEFAULT_RESTAURANT_FILTER } from '../types/restaurant.types'

// ---------- Real Backend Interfaces & Adapters ----------
interface BackendRestaurantSummary {
  id: string
  name: string
  address: string
  district: string | null
  imageUrl: string | null
  priceFromVnd: number | null
  priceToVnd: number | null
  isActive: boolean
  dietaryTypes: number[]
  amenities: string[]
  distanceKm: number | null
}

interface BackendRestaurantResponse {
  id: string
  name: string
  description: string | null
  address: string
  district: string | null
  latitude: number | null
  longitude: number | null
  contactPhone: string | null
  websiteUrl: string | null
  openingHours: string | null
  priceFromVnd: number | null
  priceToVnd: number | null
  imageUrl: string | null
  source: string | null
  dataUpdatedAt: string
  isActive: boolean
  createdAt: string
  updatedAt: string | null
  dietaryTypes: number[]
  amenities: string[]
  relatedRecipes: Array<{ id: string; name: string; imageUrl: string | null }>
  distanceKm: number | null
}

interface BackendRestaurantPage {
  items: BackendRestaurantSummary[]
  pageNumber: number
  pageSize: number
  totalCount: number
}

function mapDietType(dt: number): Exclude<RestaurantDietType, 'all'> {
  switch (dt) {
    case 1:
      return 'vegan'
    case 2:
      return 'lacto'
    case 3:
      return 'ovo'
    case 4:
      return 'ovo-lacto'
    default:
      return 'vegetarian-friendly'
  }
}

function mapSummaryToRestaurant(item: BackendRestaurantSummary): Restaurant {
  const fallbackImg =
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80'
  const img = item.imageUrl || fallbackImg
  const dist = item.distanceKm ? Number(item.distanceKm) : 1.5
  const dietTypes = (item.dietaryTypes || []).map(mapDietType)

  return {
    id: item.id,
    name: item.name,
    address: item.address,
    city: item.district || 'TP.HCM',
    district: item.district || '',
    distanceKm: dist,
    openingHours: '08:00 - 21:30',
    closingDay: 'Mở cả tuần',
    phoneNumber: '028 1234 5678',
    priceRangeVND: {
      min: item.priceFromVnd || 35000,
      max: item.priceToVnd || 150000,
    },
    dietTypes: dietTypes.length > 0 ? dietTypes : ['vegan'],
    rating: 4.8,
    reviewCount: 28,
    imageUrl: img,
    tags: item.amenities || ['Thực dưỡng', 'Yên tĩnh'],
    highlights: ['Thực đơn thuần chay đa dạng', 'Không gian xanh mát'],
    hasDelivery: true,
    hasParking: true,
    hasTakeAway: true,
    acceptsBooking: false,
    createdAt: new Date().toISOString(),
  }
}

function mapDetailToRestaurant(item: BackendRestaurantResponse): Restaurant {
  const fallbackImg =
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80'
  const img = item.imageUrl || fallbackImg
  const dist = item.distanceKm ? Number(item.distanceKm) : 1.5
  const dietTypes = (item.dietaryTypes || []).map(mapDietType)

  return {
    id: item.id,
    name: item.name,
    address: item.address,
    city: item.district || 'TP.HCM',
    district: item.district || '',
    geoLat: item.latitude ? Number(item.latitude) : undefined,
    geoLng: item.longitude ? Number(item.longitude) : undefined,
    distanceKm: dist,
    openingHours: item.openingHours || '08:00 - 22:00',
    closingDay: 'Mở cả tuần',
    phoneNumber: item.contactPhone || '028 1234 5678',
    website: item.websiteUrl || undefined,
    description: item.description || `Nhà hàng chay ${item.name} với không gian thanh tịnh.`,
    priceRangeVND: {
      min: item.priceFromVnd || 35000,
      max: item.priceToVnd || 150000,
    },
    amenities: item.amenities || ['Wi-Fi', 'Chỗ đỗ xe'],
    dietTypes: dietTypes.length > 0 ? dietTypes : ['vegan'],
    rating: 4.9,
    reviewCount: 36,
    imageUrl: img,
    tags: item.amenities || ['Thực dưỡng', 'Yên tĩnh'],
    highlights: ['Thực phẩm sạch', 'Không bột ngọt'],
    hasDelivery: true,
    hasParking: true,
    hasTakeAway: true,
    acceptsBooking: false,
    createdAt: item.createdAt,
  }
}

// ---------- Public API ----------
export async function getRestaurants(
  inputFilter: Partial<RestaurantFilter> = {},
): Promise<RestaurantListResponse> {
  const applied: RestaurantFilter = { ...DEFAULT_RESTAURANT_FILTER, ...inputFilter }

  const dietMap: Record<string, number> = {
    vegan: 1,
    lacto: 2,
    ovo: 3,
    'ovo-lacto': 4,
  }

  const params = new URLSearchParams()
  if (applied.search?.trim()) params.set('search', applied.search.trim())
  if (applied.city !== 'all' && applied.city?.trim()) params.set('district', applied.city.trim())
  if (applied.diet !== 'all' && dietMap[applied.diet]) {
    params.set('dietaryType', String(dietMap[applied.diet]))
  }
  if (applied.distanceMaxKm > 0) {
    params.set('maxDistanceKm', String(applied.distanceMaxKm))
  }
  params.set('pageNumber', '1')
  params.set('pageSize', '50')

  try {
    const res = await apiClient.get<BackendRestaurantPage>(`/api/restaurants?${params.toString()}`, {
      requiresAuth: false,
    })
    if (res && Array.isArray(res.items)) {
      const items = res.items.map(mapSummaryToRestaurant)
      return {
        items,
        totalCount: res.totalCount ?? items.length,
        appliedFilter: applied,
      }
    }
  } catch {
    // API error
  }

  return { items: [], totalCount: 0, appliedFilter: applied }
}

export async function getRestaurantDetail(id: string): Promise<Restaurant | null> {
  try {
    const res = await apiClient.get<BackendRestaurantResponse>(`/api/restaurants/${id}`, {
      requiresAuth: false,
    })
    if (res && res.id) {
      return mapDetailToRestaurant(res)
    }
  } catch {
    // Not found
  }

  return null
}

// Alias (filterRestaurants)
export async function filterRestaurants(
  inputFilter: Partial<RestaurantFilter> = {},
): Promise<RestaurantListResponse> {
  return getRestaurants(inputFilter)
}

/* ---------- Public API helpers (chips / pins / menu) ---------- */
export async function getDishChips(): Promise<DishChip[]> {
  return []
}

export async function getMapPins(): Promise<MapPinMarker[]> {
  return []
}

export async function getRestaurantMenu(_id: string): Promise<RestaurantDish[]> {
  return []
}

export async function getWeekHours(_id: string): Promise<WeekHour[]> {
  return []
}

export async function getReviewComments(_id: string): Promise<ReviewComment[]> {
  return []
}

export async function getRelatedContent(_id: string): Promise<RelatedContentCard[]> {
  return []
}
