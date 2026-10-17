import { apiClient } from '../../../shared/api/apiClient'
import { toBackendDietaryType } from '../../../shared/constants'
import type {
  Restaurant,
  RestaurantDietType,
  RestaurantFilter,
  RestaurantListResponse,
} from '../types/restaurant.types'
import { DEFAULT_RESTAURANT_FILTER } from '../types/restaurant.types'

interface BackendRestaurantSummary {
  id: string
  name: string
  address: string
  district: string | null
  imageUrl: string | null
  priceFromVnd: number | null
  priceToVnd: number | null
  dietaryTypes: Array<number | string>
  amenities: string[]
  distanceKm: number | null
}

interface BackendRestaurantResponse extends BackendRestaurantSummary {
  description: string | null
  latitude: number | null
  longitude: number | null
  contactPhone: string | null
  websiteUrl: string | null
  openingHours: string | null
  createdAt: string
}

interface BackendRestaurantPage {
  items: BackendRestaurantSummary[]
  totalCount: number
}

function mapDietType(value: number | string): Exclude<RestaurantDietType, 'all'> | null {
  switch (toBackendDietaryType(value)) {
    case 'Vegan': return 'vegan'
    case 'LactoVegetarian': return 'lacto'
    case 'OvoVegetarian': return 'ovo'
    case 'LactoOvoVegetarian': return 'ovo-lacto'
    default: return null
  }
}

function diets(values: Array<number | string>): Exclude<RestaurantDietType, 'all'>[] {
  return values.map(mapDietType).filter((value): value is Exclude<RestaurantDietType, 'all'> => value !== null)
}

function commonFields(item: BackendRestaurantSummary): Pick<Restaurant,
  'id' | 'name' | 'address' | 'city' | 'district' | 'distanceKm' | 'priceRangeVND' |
  'dietTypes' | 'rating' | 'reviewCount' | 'imageUrl' | 'tags' | 'highlights' |
  'hasDelivery' | 'hasParking' | 'hasTakeAway' | 'acceptsBooking'> {
  const district = item.district ?? ''
  return {
    id: item.id,
    name: item.name,
    address: item.address,
    // The API currently has no city field, so no city is invented on the client.
    city: district,
    district,
    distanceKm: item.distanceKm === null ? null : Number(item.distanceKm),
    priceRangeVND: { min: item.priceFromVnd ?? 0, max: item.priceToVnd ?? 0 },
    dietTypes: diets(item.dietaryTypes ?? []),
    // Reviews and booking are outside MVP and absent from the API contract.
    rating: 0,
    reviewCount: 0,
    imageUrl: item.imageUrl ?? '',
    tags: item.amenities ?? [],
    highlights: [],
    hasDelivery: false,
    hasParking: false,
    hasTakeAway: false,
    acceptsBooking: false,
  }
}

function mapSummaryToRestaurant(item: BackendRestaurantSummary): Restaurant {
  return { ...commonFields(item), openingHours: '', closingDay: '', phoneNumber: '', createdAt: '' }
}

function mapDetailToRestaurant(item: BackendRestaurantResponse): Restaurant {
  return {
    ...commonFields(item),
    geoLat: item.latitude === null ? undefined : Number(item.latitude),
    geoLng: item.longitude === null ? undefined : Number(item.longitude),
    openingHours: item.openingHours ?? '',
    closingDay: '',
    phoneNumber: item.contactPhone ?? '',
    website: item.websiteUrl ?? undefined,
    description: item.description ?? undefined,
    amenities: item.amenities ?? [],
    createdAt: item.createdAt,
  }
}

export async function getRestaurants(inputFilter: Partial<RestaurantFilter> = {}): Promise<RestaurantListResponse> {
  const applied: RestaurantFilter = { ...DEFAULT_RESTAURANT_FILTER, ...inputFilter }
  const dietMap: Record<string, number> = { vegan: 1, lacto: 2, ovo: 3, 'ovo-lacto': 4 }
  const params = new URLSearchParams({ pageNumber: '1', pageSize: '50' })

  if (applied.search.trim()) params.set('search', applied.search.trim())
  if (applied.city !== 'all' && applied.city.trim()) params.set('district', applied.city.trim())
  if (applied.diet !== 'all' && dietMap[applied.diet]) params.set('dietaryType', String(dietMap[applied.diet]))
  if (applied.latitude !== null && applied.longitude !== null) {
    params.set('latitude', String(applied.latitude))
    params.set('longitude', String(applied.longitude))
    if (applied.distanceMaxKm > 0) params.set('maxDistanceKm', String(applied.distanceMaxKm))
  }

  const response = await apiClient.get<BackendRestaurantPage>(`/api/restaurants?${params}`, { requiresAuth: false })
  const items = Array.isArray(response.items) ? response.items.map(mapSummaryToRestaurant) : []
  return { items, totalCount: response.totalCount ?? items.length, appliedFilter: applied }
}

export async function getRestaurantDetail(id: string): Promise<Restaurant | null> {
  try {
    const response = await apiClient.get<BackendRestaurantResponse>(`/api/restaurants/${id}`, { requiresAuth: false })
    return response?.id ? mapDetailToRestaurant(response) : null
  } catch {
    return null
  }
}

export async function filterRestaurants(inputFilter: Partial<RestaurantFilter> = {}): Promise<RestaurantListResponse> {
  return getRestaurants(inputFilter)
}

export async function toggleRestaurantFavorite(id: string, nextState = true): Promise<{ id: string; isFavorite: boolean }> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    throw new Error('Nhà hàng không có ID hợp lệ.')
  }
  if (nextState) {
    await apiClient.post('/api/favorites', { targetType: 'Restaurant', targetId: id })
  } else {
    const favorites = await apiClient.get<{ items: Array<{ id: string; targetId: string }> }>('/api/favorites?targetType=Restaurant&pageSize=100')
    const match = favorites.items?.find((favorite) => favorite.targetId.toLowerCase() === id.toLowerCase())
    if (match) await apiClient.delete(`/api/favorites/${match.id}`)
  }
  return { id, isFavorite: nextState }
}
