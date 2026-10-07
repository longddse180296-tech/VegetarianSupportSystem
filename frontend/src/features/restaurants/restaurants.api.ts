import type { Restaurant, RestaurantListResult, SearchFilters } from './restaurants.types'

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

const COVER_IMAGES: Record<string, string> = {
  an_nhien:
    'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Cozy%20Vietnamese%20vegetarian%20restaurant%20interior%20with%20wooden%20furniture%20green%20plants%20natural%20lighting%20high%20quality%20photo&image_size=landscape_4_3',
  farmery:
    'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Rustic%20farm%20to%20table%20vegetarian%20cafe%20garden%20view%20wooden%20tables%20outdoor%20greenery%20photo&image_size=landscape_4_3',
  an_lac:
    'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Modern%20Buddhist%20style%20monk%20vegetarian%20restaurant%20minimalist%20clean%20zen%20interior%20lotus%20flowers&image_size=landscape_4_3',
  sen_vang:
    'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Luxurious%20golden%20lotus%20vegetarian%20restaurant%20with%20Chinese%20style%20interior%20red%20accents%20rich%20wood&image_size=landscape_4_3',
}

const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id: 'r-an-nhien',
    name: 'An Nhiên Vegetarian Restaurant',
    coverImageUrl: COVER_IMAGES.an_nhien,
    badges: [
      { key: 'yummy', label: 'Chế biến nhà hàng làm hấp dẫn và hảo hạng', variant: 'success' },
      { key: 'organic', label: '🥬 Thương hiệu ưu tiên hữu cơ', variant: 'primary' },
    ],
    address: {
      line1: '65B /18 Ngõ 71 Lâm Long, Cống Vị',
      ward: 'Phường Cống Vị',
      district: 'Quận Ba Đình',
      city: 'Hà Nội',
    },
    distanceKm: 1.2,
    geo: { lat: 21.0323, lng: 105.8412 },
    rating: { score: 4.6, reviewCount: 188 },
    priceLevel: 'mid_range',
    priceRangeVND: { min: 65000, max: 180000 },
    cuisine: ['Vietnamese_Fusion'],
    facilities: ['takeaway_available', 'free_wifi', 'air_conditioning'],
    openNow: 'open_now',
    openTextSummary: 'Mở cửa đến 22h',
    phone: '024 38 28 2023',
    highlights: [
      'Đặt món theo mùa (Seasonal Menu)',
      'Tôm hùm chay, Bún bò Huế chay, Gỏi cuốn 3 màu',
      'Không gian thoáng đãng & view sông Hồng tách biệt',
    ],
    promoted: true,
    verified: true,
  },
  {
    id: 'r-farmery',
    name: 'The Farmery Garden & Cafe Chay',
    coverImageUrl: COVER_IMAGES.farmery,
    badges: [
      { key: 'zen', label: '🍵 Không gian zen - lý tưởng làm việc & thư giãn', variant: 'warning' },
      { key: 'outdoor', label: '☘️ Có khu vườn & chỗ ngồi ngoài trời', variant: 'success' },
    ],
    address: {
      line1: '2A Đường Quang Dũng, Đội Cấn, Quận Ba Đình',
      ward: 'Phường Đội Cấn',
      district: 'Quận Ba Đình',
      city: 'Hà Nội',
    },
    distanceKm: 2.4,
    geo: { lat: 21.038, lng: 105.832 },
    rating: { score: 4.4, reviewCount: 108 },
    priceLevel: 'mid_range',
    priceRangeVND: { min: 65000, max: 155000 },
    cuisine: ['Vegetarian_International', 'Bakery_Dessert'],
    facilities: ['free_wifi', 'outdoor_seating', 'takeaway_available', 'accept_booking'],
    openNow: 'open_now',
    openTextSummary: 'Mở 08h00 - 22h30',
    phone: '090 123 45 67',
    highlights: [
      'Nguồn rau củ tự vườn hữu cơ',
      'Pesto pasta chay, sandwich rau củ nướng, sinh tố toăng dưỡng',
      'Góc làm việc yên tĩnh & ổn định Wi-Fi',
    ],
    warnings: ['Những gian ngoại trừ khu Vườn - Thu hút côn trùng (có màn che)'],
    verified: true,
  },
  {
    id: 'r-an-lac',
    name: 'Đập Chay An Lạc - Ẩm Thực Thực Dưỡng',
    coverImageUrl: COVER_IMAGES.an_lac,
    badges: [
      { key: 'monk', label: 'Chùa thân thiện (Vegan - không hành tỏi)', variant: 'success' },
      { key: 'balanced', label: '🥗 Đầy đủ 6 nhóm thực vật dưỡng (Well-balanced vegetarian meal group)', variant: 'info' },
    ],
    address: {
      line1: '100/1 Phố Mai Hắc Đế, Đống Thịnh Xuân, Quận Hai Bà Trưng',
      ward: 'Phường Bùi Thị Xuân',
      district: 'Quận Hai Bà Trưng',
      city: 'Hà Nội',
    },
    distanceKm: 3.5,
    geo: { lat: 21.0205, lng: 105.8547 },
    rating: { score: 4.3, reviewCount: 62 },
    priceLevel: 'budget',
    priceRangeVND: { min: 50000, max: 120000 },
    cuisine: ['Buddhist_Monk'],
    facilities: ['takeaway_available', 'free_wifi'],
    openNow: 'closes_soon',
    openTextSummary: 'Đóng cửa sớm 19h30',
    phone: '098 165 40 89',
    highlights: [
      'Cơm ăn theo phần chay sư - menu thay đổi mỗi ngày',
      'Nước dùng ninh rau củ 12 loại khoanh tĩnh 10h',
      'Góc trà thiền & trưng bày gốm chay',
    ],
  },
  {
    id: 'r-sen-vang',
    name: 'Nhà Hàng Chay Sen Vàng',
    coverImageUrl: COVER_IMAGES.sen_vang,
    badges: [
      { key: 'delicious', label: '😋 Ấm chén & sắc thức - món ăn đa dạng', variant: 'primary' },
      { key: 'hanoian', label: '🏮 Món chay cổ truyền - kiểu Hà Nội', variant: 'warning' },
    ],
    address: {
      line1: '52 Nguyễn Du, Phố Hàng Bài, Quận Hoàn Kiếm, Hà Nội',
      ward: 'Phường Hàng Bài',
      district: 'Quận Hoàn Kiếm',
      city: 'Hà Nội',
    },
    distanceKm: 4.8,
    geo: { lat: 21.0188, lng: 105.8492 },
    rating: { score: 4.2, reviewCount: 230 },
    priceLevel: 'premium',
    priceRangeVND: { min: 120000, max: 350000 },
    cuisine: ['Chinese_Vegan', 'Vietnamese_Traditional'],
    facilities: ['has_parking', 'event_catering', 'accept_booking', 'free_wifi', 'air_conditioning'],
    openNow: 'open_now',
    openTextSummary: 'Mở 10h - 14h30 & 17h - 22h',
    phone: '024 38 25 68 88',
    highlights: [
      'Tiệc cưới, họp mặt gia đình, lễ cúng bàn thờ',
      'Chả giò rế, mâm cúng 9 món chay, chim yến chay cao cấp',
      'Chỗ đỗ xe riêng cho 40 xe máy + 10 ô tô',
    ],
    warnings: [
      'Không gian thân thiết - Tiệc chay gia đình - Trà thảo mộc',
      'Ưu tiên đặt trước (đặc biệt cuối tuần & lễ kỷ niệm)',
    ],
    verified: true,
  },
]

const DEFAULT_FILTERS: SearchFilters = {
  keyword: '',
  distance: 'all',
  sortBy: 'nearest',
  rating: 'all',
  tags: [],
  priceLevel: 'all',
  cuisineFilter: 'all',
}

function applyFilters(list: Restaurant[], filters: SearchFilters): Restaurant[] {
  let r = [...list]
  if (filters.keyword.trim()) {
    const kw = filters.keyword.toLowerCase().normalize('NFC')
    r = r.filter(
      (x) =>
        x.name.toLowerCase().includes(kw) ||
        x.address.line1.toLowerCase().includes(kw) ||
        x.address.district?.toLowerCase().includes(kw) ||
        x.cuisine.some((c) => c.toLowerCase().includes(kw))
    )
  }
  if (filters.distance !== 'all') {
    const d = filters.distance
    r = r.filter((x) => {
      const k = x.distanceKm
      if (d === 'lt1') return k < 1
      if (d === '1to3') return k >= 1 && k < 3
      if (d === '3to5') return k >= 3 && k < 5
      if (d === '5to10') return k >= 5 && k < 10
      if (d === 'gt10') return k >= 10
      return true
    })
  }
  if (filters.priceLevel !== 'all') {
    r = r.filter((x) => x.priceLevel === filters.priceLevel)
  }
  if (filters.rating !== 'all') {
    const threshold =
      filters.rating === 'gte45' ? 4.5 : filters.rating === 'gte4' ? 4.0 : filters.rating === 'gte35' ? 3.5 : 3.0
    r = r.filter((x) => x.rating.score >= threshold)
  }
  if (filters.tags.length > 0) {
    r = r.filter((x) => filters.tags.every((t) => x.facilities.includes(t)))
  }
  const sort = filters.sortBy
  if (sort === 'nearest') r.sort((a, b) => a.distanceKm - b.distanceKm)
  if (sort === 'highest_rated') r.sort((a, b) => b.rating.score - a.rating.score)
  if (sort === 'newest') r.sort((a, b) => (a.verified ? 1 : 0) - (b.verified ? 1 : 0))
  if (sort === 'lowest_price') r.sort((a, b) => a.priceRangeVND.min - b.priceRangeVND.min)
  return r
}

export async function fetchRestaurantList(
  partialFilters: Partial<SearchFilters> = {},
  signal?: AbortSignal
): Promise<RestaurantListResult> {
  await delay(520)
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
  const f: SearchFilters = { ...DEFAULT_FILTERS, ...partialFilters }
  const items = applyFilters(MOCK_RESTAURANTS, f)
  return {
    total: items.length,
    items,
    appliedFilters: f,
    facets: {
      priceCounts: { budget: 1, mid_range: 2, premium: 1 },
      cuisineCounts: {
        Vietnamese_Traditional: 1,
        Vietnamese_Fusion: 1,
        Buddhist_Monk: 1,
        Vegetarian_International: 1,
        Chinese_Vegan: 1,
        Raw_Food: 0,
        Japanese_Vegetarian: 0,
        Bakery_Dessert: 1,
      },
      tagCounts: {
        has_parking: 1,
        takeaway_available: 3,
        delivery_supported: 0,
        region_specialty: 0,
        vegan_only: 1,
        no_cheese_option: 0,
        event_catering: 1,
        free_wifi: 4,
        air_conditioning: 2,
        outdoor_seating: 1,
        pet_friendly: 0,
        accept_booking: 2,
      },
      ratingBuckets: [
        { key: 'gte45', label: '4.5 sao trở lên', count: 1 },
        { key: 'gte4', label: 'Từ 4.0 sao', count: 2 },
        { key: 'gte35', label: 'Từ 3.5 sao', count: 4 },
        { key: 'gte3', label: 'Từ 3.0 sao', count: 4 },
      ],
    },
  }
}

export function formatVND(n: number): string {
  return new Intl.NumberFormat('vi-VN').format(n) + 'đ'
}
