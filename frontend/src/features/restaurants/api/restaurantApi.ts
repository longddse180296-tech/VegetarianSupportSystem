// Chức năng: tra cứu và quản lý nhà hàng. Giao tiếp máy chủ và chuyển dữ liệu về kiểu dùng trong tính năng.
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
// Cấu trúc BackendRestaurantSummary quy định dữ liệu trao đổi trong tra cứu và quản lý nhà hàng.
interface BackendRestaurantSummary {
  id: string
  name: string
  address: string
  district: string | null
  imageUrl: string | null
  priceFromVnd: number | null
  priceToVnd: number | null
  isActive: boolean
  dietaryTypes: Array<string | number>
  amenities: string[]
  distanceKm: number | null
  latitude?: number | null
  longitude?: number | null
}

// Cấu trúc BackendRestaurantResponse quy định dữ liệu trao đổi trong tra cứu và quản lý nhà hàng.
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
  dietaryTypes: Array<string | number>
  amenities: string[]
  featuredDishes: Array<{ id: string; name: string; imageUrl: string; displayOrder: number }>
  distanceKm: number | null
}

// Cấu trúc BackendRestaurantPage quy định dữ liệu trao đổi trong tra cứu và quản lý nhà hàng.
interface BackendRestaurantPage {
  items: BackendRestaurantSummary[]
  pageNumber: number
  pageSize: number
  totalCount: number
}

// Chuẩn hóa hoặc chuyển đổi dữ liệu giữa các bước xử lý (mapDietType); thuộc tra cứu và quản lý nhà hàng.
function mapDietType(dt: string | number): Exclude<RestaurantDietType, 'all'> {
  if (typeof dt === 'string') {
    const s = dt.trim().toLowerCase()
    if (s === 'vegan' || s === 'raw') return 'vegan'
    if (s === 'lactovegetarian' || s === 'lacto') return 'lacto'
    if (s === 'ovovegetarian' || s === 'ovo') return 'ovo'
    if (s === 'lactoovovegetarian' || s === 'ovo-lacto' || s === 'lacto-ovo') return 'ovo-lacto'
  }
  if (typeof dt === 'number') {
    switch (dt) {
      case 1:
        return 'vegan'
      case 2:
        return 'lacto'
      case 3:
        return 'ovo'
      case 4:
        return 'ovo-lacto'
    }
  }
  return 'vegan'
}

// Chuẩn hóa hoặc chuyển đổi dữ liệu giữa các bước xử lý (mapSummaryToRestaurant); thuộc tra cứu và quản lý nhà hàng.
function mapSummaryToRestaurant(item: BackendRestaurantSummary): Restaurant {
  const fallbackImg =
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80'
  const img = item.imageUrl || fallbackImg
  const dist = item.distanceKm == null ? null : Number(item.distanceKm)
  const dietTypes = (item.dietaryTypes || []).map(mapDietType)

  let priceRange: string | undefined
  if (item.priceFromVnd && item.priceToVnd) {
    priceRange = `${item.priceFromVnd.toLocaleString('vi-VN')}đ - ${item.priceToVnd.toLocaleString('vi-VN')}đ`
  } else if (item.priceFromVnd) {
    priceRange = `Từ ${item.priceFromVnd.toLocaleString('vi-VN')}đ`
  } else if (item.priceToVnd) {
    priceRange = `Đến ${item.priceToVnd.toLocaleString('vi-VN')}đ`
  }

  return {
    id: item.id,
    name: item.name,
    address: item.address,
    city: item.district || '',
    district: item.district || '',
    distanceKm: dist,
    geoLat: item.latitude == null ? undefined : Number(item.latitude),
    geoLng: item.longitude == null ? undefined : Number(item.longitude),
    openingHours: '',
    closingDay: '',
    phoneNumber: '',
    priceRangeVND: {
      min: item.priceFromVnd || 0,
      max: item.priceToVnd || 0,
    },
    priceRange,
    dietTypes,
    rating: 0,
    reviewCount: 0,
    imageUrl: img,
    tags: item.amenities || [],
    highlights: [],
    hasDelivery: false,
    hasParking: false,
    hasTakeAway: false,
    acceptsBooking: false,
    createdAt: new Date().toISOString(),
  }
}

// Chuẩn hóa hoặc chuyển đổi dữ liệu giữa các bước xử lý (mapDetailToRestaurant); thuộc tra cứu và quản lý nhà hàng.
function mapDetailToRestaurant(item: BackendRestaurantResponse): Restaurant {
  const fallbackImg =
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80'
  const img = item.imageUrl || fallbackImg
  const dist = item.distanceKm == null ? null : Number(item.distanceKm)
  const dietTypes = (item.dietaryTypes || []).map(mapDietType)

  let priceRange: string | undefined
  if (item.priceFromVnd && item.priceToVnd) {
    priceRange = `${item.priceFromVnd.toLocaleString('vi-VN')}đ - ${item.priceToVnd.toLocaleString('vi-VN')}đ`
  } else if (item.priceFromVnd) {
    priceRange = `Từ ${item.priceFromVnd.toLocaleString('vi-VN')}đ`
  } else if (item.priceToVnd) {
    priceRange = `Đến ${item.priceToVnd.toLocaleString('vi-VN')}đ`
  }

  return {
    id: item.id,
    name: item.name,
    address: item.address,
    city: item.district || '',
    district: item.district || '',
    geoLat: item.latitude == null ? undefined : Number(item.latitude),
    geoLng: item.longitude == null ? undefined : Number(item.longitude),
    distanceKm: dist,
    openingHours: item.openingHours || '',
    closingDay: '',
    phoneNumber: item.contactPhone || '',
    website: item.websiteUrl || undefined,
    description: item.description || '',
    priceRangeVND: {
      min: item.priceFromVnd || 0,
      max: item.priceToVnd || 0,
    },
    priceRange,
    amenities: item.amenities || [],
    dietTypes,
    rating: 0,
    reviewCount: 0,
    imageUrl: img,
    tags: item.amenities || [],
    highlights: [],
    hasDelivery: false,
    hasParking: false,
    hasTakeAway: false,
    acceptsBooking: false,
    createdAt: item.createdAt,
    featuredDishes: item.featuredDishes || [],
  }
}

// ---------- Public API ----------
// Đọc dữ liệu cần thiết và trả kết quả cho bước xử lý tiếp theo (getRestaurants); thuộc tra cứu và quản lý nhà hàng.
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
  if (applied.latitude !== undefined && applied.longitude !== undefined) {
    params.set('latitude', String(applied.latitude))
    params.set('longitude', String(applied.longitude))
  }
  if (applied.distanceMaxKm > 0 && applied.latitude !== undefined && applied.longitude !== undefined) {
    params.set('maxDistanceKm', String(applied.distanceMaxKm))
  }
  params.set('pageNumber', '1')
  params.set('pageSize', '50')

  const url = `/api/restaurants?${params.toString()}`
  try {
    const res = await apiClient.get<BackendRestaurantPage>(url, {
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
  } catch (err) {
    console.error('[restaurantApi.getRestaurants] Lỗi khi gọi API: ' + url, err)
    throw err
  }

  return { items: [], totalCount: 0, appliedFilter: applied }
}

// Đọc dữ liệu cần thiết và trả kết quả cho bước xử lý tiếp theo (getRestaurantDetail); thuộc tra cứu và quản lý nhà hàng.
export async function getRestaurantDetail(id: string): Promise<Restaurant | null> {
  const url = `/api/restaurants/${id}`
  try {
    const res = await apiClient.get<BackendRestaurantResponse>(url, {
      requiresAuth: false,
    })
    if (res && res.id) {
      return mapDetailToRestaurant(res)
    }
  } catch (err) {
    console.error('[restaurantApi.getRestaurantDetail] Lỗi khi gọi API: ' + url, err)
    return null
  }

  return null
}

// Alias (filterRestaurants)
// Lấy hoặc lọc danh sách theo điều kiện và phạm vi hiện tại (filterRestaurants); thuộc tra cứu và quản lý nhà hàng.
export async function filterRestaurants(
  inputFilter: Partial<RestaurantFilter> = {},
): Promise<RestaurantListResponse> {
  return getRestaurants(inputFilter)
}

/* ---------- Public API helpers (chips / pins / menu) ---------- */
const DISH_CHIPS_DATA: DishChip[] = [
  { label: 'Phở chay', count: 8, emoji: '🍜' },
  { label: 'Bún riêu chay', count: 12, emoji: '🍲' },
  { label: 'Cơm tấm sườn chay', count: 15, emoji: '🍚' },
  { label: 'Lẩu nấm chay', count: 9, emoji: '🍲' },
  { label: 'Salad rau củ', count: 14, emoji: '🥗' },
  { label: 'Há cảo chay', count: 6, emoji: '🥟' },
]

// Đọc dữ liệu cần thiết và trả kết quả cho bước xử lý tiếp theo (getDishChips); thuộc tra cứu và quản lý nhà hàng.
export async function getDishChips(): Promise<DishChip[]> {
  return DISH_CHIPS_DATA
}

// Chuẩn hóa hoặc chuyển đổi dữ liệu giữa các bước xử lý (getMapPins); thuộc tra cứu và quản lý nhà hàng.
export async function getMapPins(): Promise<MapPinMarker[]> {
  return []
}

// Đọc dữ liệu cần thiết và trả kết quả cho bước xử lý tiếp theo (getRestaurantMenu); thuộc tra cứu và quản lý nhà hàng.
export async function getRestaurantMenu(id: string): Promise<RestaurantDish[]> {
  const url = `/api/restaurants/${id}`
  try {
    const res = await apiClient.get<BackendRestaurantResponse>(url, {
      requiresAuth: false,
    })
    if (res?.featuredDishes && res.featuredDishes.length > 0) {
      return res.featuredDishes.map((dish, idx) => ({
        id: dish.id || `dish_${idx}`,
        name: dish.name,
        desc: 'Món chay nổi bật do nhà hàng cung cấp.',
        priceVND: undefined,
        tag: 'Món nổi bật',
        tagColor: 'bg-[#1F7A3F] text-white',
        imgSeed: dish.name,
        imageUrl: dish.imageUrl,
      }))
    }
  } catch (err) {
    console.error('[restaurantApi.getRestaurantMenu] Lỗi khi gọi API: ' + url, err)
  }

  return []
}

// Đọc dữ liệu cần thiết và trả kết quả cho bước xử lý tiếp theo (getWeekHours); thuộc tra cứu và quản lý nhà hàng.
export async function getWeekHours(id: string): Promise<WeekHour[]> {
  let openTime = '08:00 - 21:30'
  try {
    const res = await apiClient.get<BackendRestaurantResponse>(`/api/restaurants/${id}`, {
      requiresAuth: false,
    })
    if (res?.openingHours) {
      openTime = res.openingHours
    }
  } catch {
    // Use default
  }

  const days = [
    { day: 'T2', label: 'Thứ Hai' },
    { day: 'T3', label: 'Thứ Ba' },
    { day: 'T4', label: 'Thứ Tư' },
    { day: 'T5', label: 'Thứ Năm' },
    { day: 'T6', label: 'Thứ Sáu' },
    { day: 'T7', label: 'Thứ Bảy' },
    { day: 'CN', label: 'Chủ Nhật' },
  ]
  const dayOfWeek = new Date().getDay() // 0 = CN, 1 = T2...
  const todayIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1

  return days.map((d, idx) => ({
    day: d.day,
    label: d.label,
    time: openTime,
    isToday: idx === todayIdx,
  }))
}

// Đọc dữ liệu cần thiết và trả kết quả cho bước xử lý tiếp theo (getReviewComments); thuộc tra cứu và quản lý nhà hàng.
export async function getReviewComments(_id: string): Promise<ReviewComment[]> {
  return []
}

// Đọc dữ liệu cần thiết và trả kết quả cho bước xử lý tiếp theo (getRelatedContent); thuộc tra cứu và quản lý nhà hàng.
export async function getRelatedContent(_id: string): Promise<RelatedContentCard[]> {
  return []
}

// Xử lý lựa chọn hoặc chuyển trạng thái giao diện theo thao tác người dùng (toggleRestaurantFavorite); thuộc tra cứu và quản lý nhà hàng.
export async function toggleRestaurantFavorite(
  id: string,
  nextState?: boolean,
): Promise<{ id: string; isFavorite: boolean }> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  let isFavorite = nextState ?? true
  if (isUuid) {
    try {
      if (nextState !== false) {
        await apiClient.post('/api/favorites', { targetType: 'Restaurant', targetId: id })
        isFavorite = true
      } else {
        const favs = await apiClient.get<{
          items: Array<{ id: string; targetId: string }>
        }>('/api/favorites?targetType=Restaurant&pageSize=100')
        const matched = favs?.items?.find((f) => f.targetId.toLowerCase() === id.toLowerCase())
        if (matched?.id) {
          await apiClient.delete(`/api/favorites/${matched.id}`)
        }
        isFavorite = false
      }
    } catch {
      // Offline/unauthorized
    }
  }
  return { id, isFavorite }
}
