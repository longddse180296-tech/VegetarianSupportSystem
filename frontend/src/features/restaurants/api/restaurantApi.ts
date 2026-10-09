import type {
  DishChip,
  MapPinMarker,
  Restaurant,
  RestaurantDish,
  RestaurantFilter,
  RestaurantListResponse,
  RestaurantSortOption,
} from '../types/restaurant.types'
import { DEFAULT_RESTAURANT_FILTER } from '../types/restaurant.types'

const delay = (ms = 500) => new Promise<void>((r) => setTimeout(r, ms))

/* ---------- Dish chips (món tìm kiếm nhanh) ---------- */
const DISH_CHIPS: DishChip[] = [
  { label: 'Phở chay', count: 8, emoji: '🍜' },
  { label: 'Bún riêu chay', count: 12, emoji: '🍲' },
  { label: 'Cơm tấm sườn chay', count: 15, emoji: '🍚' },
  { label: 'Lẩu nấm chay', count: 9, emoji: '🍲' },
  { label: 'Salad bộ đủ gà', count: 14, emoji: '🥗' },
  { label: 'Há cảo chay', count: 6, emoji: '🥟' },
]

/* ---------- Map pins coordinates (mock) ---------- */
const MAP_PINS: MapPinMarker[] = [
  { top: '16%', left: '24%', id: 'r_hanoi_01', label: 'An Nhiền' },
  { top: '30%', left: '72%', id: 'r_hanoi_05', label: 'Sống & Mơ' },
  { top: '54%', left: '38%', id: 'r_hcm_01', color: '#459360', label: 'Sen Vàng' },
  { top: '74%', left: '62%', id: 'r_danang_02', color: '#459360', label: 'An Lạc' },
]

/* ---------- Menu món ăn (mock) ---------- */
const DISH_CARDS: RestaurantDish[] = [
  {
    id: 'd1',
    tag: 'Món được giới thiệu',
    tagColor: 'bg-[#2E7D32] text-white',
    name: 'Đậu hũ sốt nấm',
    desc: 'Đậu hũ chiên vàng sốt nấm hương và cà ri dừa thanh vị, có điểm làm thành vi.',
    imgSeed: 'vietnamese crispy tofu mushroom curry sauce vegan dish',
    priceVND: 65000,
  },
  {
    id: 'd2',
    tag: 'Thực dưỡng',
    tagColor: 'bg-[#558B2F] text-white',
    name: 'Đậu hũ áp chảo sốt tiêu đen',
    desc: 'Đậu hũ nếm mềm áp chảo sốt tiêu đen đặc trưng Đà Lạt.',
    imgSeed: 'tofu stir fry black pepper sauce garlic vegan vietnamese',
    priceVND: 75000,
  },
  {
    id: 'd3',
    tag: 'Món đặc sản miền Nam',
    tagColor: 'bg-[#0D47A1] text-white',
    name: 'Gỏi cuốn đậu hũ nấm tươi',
    desc: 'Cuốn tươi mềm, nhân đậu hũ chiên và đậu hũ nấm hương thơm ngang.',
    imgSeed: 'fresh vegan salad rolls rice paper mushroom herbs vietnamese',
    priceVND: 55000,
  },
  {
    id: 'd4',
    tag: 'Món nhậu thanh đạm',
    tagColor: 'bg-[#6A1B9A] text-white',
    name: 'Nấm bào ngư chiên bơ tỏi',
    desc: 'Nấm bào ngư tươi chiên giòn, phủ lớp bơ tỏi thơm lừng và tiêu xanh.',
    imgSeed: 'vegan abalone mushroom butter garlic fry crispy vietnamese',
    priceVND: 95000,
  },
  {
    id: 'd5',
    tag: 'Món đặc sắc',
    tagColor: 'bg-[#BF360C] text-white',
    name: 'Cà ri đậu chickpea cải bó xôi',
    desc: 'Cà ri vàng dừa béo, đậu gà nở mềm và cải bó xôi tươi, ăn kèm bánh mì nướng.',
    imgSeed: 'chickpea spinach curry coconut milk vegan golden soup bread',
    priceVND: 85000,
  },
  {
    id: 'd6',
    tag: 'Tráng miệng',
    tagColor: 'bg-[#006064] text-white',
    name: 'Chè đậu đỏ sen nướng dừa',
    desc: 'Chè thanh mát, đậu đỏ hầm mềm, hạt sen thơm và cơm dừa nướng giòn.',
    imgSeed: 'vegan red bean lotus seed sweet soup coconut toasted vietnamese dessert',
    priceVND: 35000,
  },
]

const IMG = (seed: string) =>
  `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${encodeURIComponent(
    seed,
  )}&image_size=landscape_4_3`

// ---------- Seed data (NO hardcode in Components) ----------
const IN_MEMORY_RESTAURANTS: Restaurant[] = [
  {
    id: 'r_hanoi_01',
    name: 'Quán Chay An Lạc (Trần Nhật Duật)',
    address: 'Số 12, ngõ 68, Trần Nhật Duật, phường Tân Ước, quận Cầu Giấy',
    city: 'Hà Nội',
    district: 'Cầu Giấy',
    distanceKm: 1.2,
    openingHours: '06:30 - 21:30',
    closingDay: 'Mở cửa cả tuần',
    phoneNumber: '024 6688 1234',
    email: 'anlac.bepchay@gmail.com',
    website: 'https://anlac-chay.vn',
    priceRangeVND: { min: 45000, max: 120000 },
    dietTypes: ['vegan', 'ovo-lacto'],
    rating: 4.8,
    reviewCount: 2840,
    imageUrl: IMG('cozy vegan vietnamese restaurant ha noi bamboo interior hot pot'),
    tags: ['phở chay', 'bún chả', 'bánh mì', 'giờ vàng'],
    highlights: [
      'Menu 100% thuần thực vật không mùi nồng',
      'Phở chay nước dùng hầm từ củ cải & nấm',
      'Có khu vực gia đình & chỗ để xe máy rộng',
    ],
    hasDelivery: true,
    hasParking: true,
    hasTakeAway: true,
    acceptsBooking: true,
    createdAt: '2026-03-14',
  },
  {
    id: 'r_hanoi_02',
    name: 'Bếp Thuần Chay Sen Vàng (Đống Đa)',
    address: 'Số 45A, đường Thái Hà, phường Trung Liệt, quận Đống Đa',
    city: 'Hà Nội',
    district: 'Đống Đa',
    distanceKm: 3.7,
    openingHours: '07:00 - 22:00',
    closingDay: 'Thứ 2 hàng tháng',
    phoneNumber: '0912 100 220',
    priceRangeVND: { min: 30000, max: 95000 },
    dietTypes: ['vegan', 'raw'],
    rating: 4.6,
    reviewCount: 1782,
    imageUrl: IMG('minimalist vegan restaurant hanoi lotus salad raw platter wooden decor'),
    tags: ['raw food', 'salad', 'bánh cuốn chay', 'nước ép'],
    highlights: [
      'Có menu đồ ăn sống (raw) rất phong phú',
      'Nước ép lạnh 10 loại rau củ khác nhau mỗi ngày',
      'Dùng 100% dầu đậu nành hữu cơ',
    ],
    hasDelivery: true,
    hasParking: false,
    hasTakeAway: true,
    acceptsBooking: false,
    createdAt: '2026-05-01',
  },
  {
    id: 'r_hanoi_03',
    name: 'Nhà Hàng Chay Hương Sen Tây Hồ',
    address: 'Số 8, phố Nguyễn Duy Trinh, phường Thụy Khuê, Tây Hồ',
    city: 'Hà Nội',
    district: 'Tây Hồ',
    distanceKm: 5.4,
    openingHours: '09:00 - 23:00',
    closingDay: 'Không nghỉ',
    phoneNumber: '024 3829 1119',
    priceRangeVND: { min: 120000, max: 280000 },
    dietTypes: ['vegan', 'ovo-lacto', 'vegetarian-friendly'],
    rating: 4.5,
    reviewCount: 3420,
    imageUrl: IMG('luxury riverside vietnamese vegetarian restaurant west lake lotus feast'),
    tags: ['lễ hội', 'tiệc cưới', 'mâm cỗ giỗ tổ', 'view hồ'],
    highlights: [
      'Mâm cỗ giỗ tổ 5-7 món chay truyền thống',
      'Tiệc cưới chay trọn gói 150 khách',
      'View hồ Tây 2 mặt tiền',
    ],
    hasDelivery: false,
    hasParking: true,
    hasTakeAway: true,
    acceptsBooking: true,
    createdAt: '2026-01-20',
  },
  {
    id: 'r_hcm_01',
    name: 'Chay Sài Gòn Ẩm Thực (Quận 1)',
    address: 'Số 23, đường Nguyễn Huệ, phường Bến Nghé, quận 1, TP.HCM',
    city: 'TP.HCM',
    district: 'Quận 1',
    distanceKm: 0.8,
    openingHours: '08:00 - 22:30',
    closingDay: 'Mở cửa cả tuần',
    phoneNumber: '028 7777 0023',
    website: 'https://chaysaigon.vn',
    priceRangeVND: { min: 60000, max: 180000 },
    dietTypes: ['vegan'],
    rating: 4.9,
    reviewCount: 5110,
    imageUrl: IMG('modern vegan restaurant saigon district 1 open kitchen banh xeo platter'),
    tags: ['bánh xèo', 'bún bò', 'com tam', 'trung tâm'],
    highlights: [
      'Đầu bếp 15 năm kinh nghiệm nấu chay miền Nam',
      'Nhà hàng trung tâm, dễ đi bộ từ Nguyễn Huệ',
      'Giao hàng GrabFood/ShopeeFood toàn quận 1,3,4',
    ],
    hasDelivery: true,
    hasParking: true,
    hasTakeAway: true,
    acceptsBooking: true,
    createdAt: '2026-07-02',
  },
  {
    id: 'r_hcm_02',
    name: 'Bếp Chay Bảo An (Quận 7, Phú Nhuận)',
    address: 'Số 16, Đường Số 12, khu phố 2, phường Phước Long B, quận 7',
    city: 'TP.HCM',
    district: 'Quận 7',
    distanceKm: 8.2,
    openingHours: '10:00 - 21:00',
    closingDay: 'Thứ 7 hàng tuần',
    phoneNumber: '0903 812 990',
    priceRangeVND: { min: 35000, max: 110000 },
    dietTypes: ['ovo-lacto', 'lacto', 'vegetarian-friendly'],
    rating: 4.3,
    reviewCount: 1290,
    imageUrl: IMG('homey vietnamese vegetarian restaurant district 7 family meal hot pot'),
    tags: ['cơm văn phòng', 'buffet trưa', 'giá sinh viên'],
    highlights: [
      'Buffet trưa 199k / người, 20 món tự chọn',
      'Gần khu vực KCX Phú Nhuận, phần ăn văn phòng',
      'Có combo tiết kiệm dưới 50k / suất',
    ],
    hasDelivery: true,
    hasParking: true,
    hasTakeAway: true,
    acceptsBooking: false,
    createdAt: '2026-08-09',
  },
  {
    id: 'r_hcm_03',
    name: 'Quán Chay Hạnh Phúc (Quận 3)',
    address: 'Số 10 đường Cách Mạng Tháng 8, phường 11, quận 3, TP.HCM',
    city: 'TP.HCM',
    district: 'Quận 3',
    distanceKm: 2.6,
    openingHours: '06:00 - 20:30',
    closingDay: 'Không',
    phoneNumber: '028 3930 1122',
    priceRangeVND: { min: 25000, max: 80000 },
    dietTypes: ['vegan', 'ovo-lacto', 'vegetarian-friendly'],
    rating: 4.4,
    reviewCount: 2460,
    imageUrl: IMG('saigon street food vegetarian stall pho tofu morning'),
    tags: ['sáng sớm', 'hủ tiếu', 'bánh mì', 'xe máy'],
    highlights: [
      'Mở 6h sáng, phục vụ dân văn phòng đi làm sớm',
      'Hủ tiếu Nam Vang chay thơm ngon giá 25k',
      'Chỗ đậu xe máy miễn phí',
    ],
    hasDelivery: true,
    hasParking: true,
    hasTakeAway: true,
    acceptsBooking: false,
    createdAt: '2026-02-10',
  },
  {
    id: 'r_hcm_04',
    name: 'Nhà hàng Raw Garden Sài Gòn (Thủ Đức)',
    address: 'Lô 12, KV Việt Hương, phường Hiệp Bình Phước, TP.Thủ Đức',
    city: 'TP.HCM',
    district: 'Thủ Đức',
    distanceKm: 12.9,
    openingHours: '09:00 - 22:00',
    closingDay: 'Ngày 15 hàng tháng',
    phoneNumber: '0909 200 188',
    priceRangeVND: { min: 95000, max: 220000 },
    dietTypes: ['raw', 'vegan'],
    rating: 4.7,
    reviewCount: 860,
    imageUrl: IMG('raw vegan garden restaurant thu duc outdoor greenery salad wraps'),
    tags: ['raw', 'yoga', 'workshop', 'vegan cake'],
    highlights: [
      'Có sân vườn ngoài trời rộng rãi, nhiều cây xanh',
      'Hàng tuần có workshop nấu ăn + yoga sáng',
      'Bánh sinh nhật thuần thực vật đặt trước 2-3 ngày',
    ],
    hasDelivery: false,
    hasParking: true,
    hasTakeAway: true,
    acceptsBooking: true,
    createdAt: '2026-06-19',
  },
  {
    id: 'r_danang_01',
    name: 'Nhà hàng Chay Biển (Ngũ Hành Sơn)',
    address: 'Số 44, đường Huyền Trân Công Chúa, phường Hòa Hải, quận Ngũ Hành Sơn, Đà Nẵng',
    city: 'Đà Nẵng',
    district: 'Ngũ Hành Sơn',
    distanceKm: 4.1,
    openingHours: '08:00 - 22:00',
    closingDay: 'Không',
    phoneNumber: '0236 3920 111',
    priceRangeVND: { min: 70000, max: 170000 },
    dietTypes: ['vegan', 'vegetarian-friendly'],
    rating: 4.6,
    reviewCount: 1650,
    imageUrl: IMG('danang seaside vegan restaurant beach view mango salad'),
    tags: ['view biển', 'du khách', 'đặc sản Đà Nẵng', 'hải sản chay'],
    highlights: [
      'Cách biển Mỹ Khê chỉ 150m, ngồi ngoài trời mát mẻ',
      'Đặc sản "hải sản chay" làm từ nấm đùi gà & măng cụt',
      'Có combo tour 1 ngày ăn chay Đà Nẵng',
    ],
    hasDelivery: true,
    hasParking: true,
    hasTakeAway: true,
    acceptsBooking: true,
    createdAt: '2026-04-22',
  },
  {
    id: 'r_danang_02',
    name: 'Bếp Chay Mẹ Yêu (Hải Châu)',
    address: 'Số 22 đường 3 Tháng 2, phường Thạch Thang, quận Hải Châu, Đà Nẵng',
    city: 'Đà Nẵng',
    district: 'Hải Châu',
    distanceKm: 1.8,
    openingHours: '07:00 - 21:00',
    closingDay: 'Mở cửa cả tuần',
    phoneNumber: '0979 445 123',
    priceRangeVND: { min: 25000, max: 75000 },
    dietTypes: ['ovo-lacto', 'ovo', 'vegetarian-friendly'],
    rating: 4.2,
    reviewCount: 820,
    imageUrl: IMG('danang local family vegan street restaurant rice plate eggs'),
    tags: ['cơm nhà', 'giá rẻ', 'dân địa phương'],
    highlights: [
      'Chị chủ nấu nhà hàng 12 năm, nêm nếm vị nhà quê',
      'Trứng ốp la + cơm sườn non chay combo 45k',
      'Có thể đặt cơm văn phòng theo tuần',
    ],
    hasDelivery: true,
    hasParking: false,
    hasTakeAway: true,
    acceptsBooking: false,
    createdAt: '2026-03-08',
  },
  {
    id: 'r_danang_03',
    name: 'Quán Chay Linh Ứng (Sơn Trà)',
    address: 'Số 9, đường Tôn Đức Thắng, phường An Hải Đông, quận Sơn Trà, Đà Nẵng',
    city: 'Đà Nẵng',
    district: 'Sơn Trà',
    distanceKm: 6.9,
    openingHours: '08:30 - 20:30',
    closingDay: 'Ngày mùng 1 hàng tháng',
    phoneNumber: '0236 6555 888',
    priceRangeVND: { min: 55000, max: 150000 },
    dietTypes: ['vegan', 'ovo-lacto'],
    rating: 4.5,
    reviewCount: 960,
    imageUrl: IMG('danang mountain view zen vegan restaurant son tra peninsula'),
    tags: ['chùa', 'thiền', 'cảnh đẹp', 'cao cấp'],
    highlights: [
      'Gần chùa Linh Ứng, dễ dàng sau khi đi lễ',
      'Không gian thiền định, nhạc thư giãn',
      'Có phòng riêng cho đoàn 10-15 khách',
    ],
    hasDelivery: false,
    hasParking: true,
    hasTakeAway: true,
    acceptsBooking: true,
    createdAt: '2026-05-28',
  },
  {
    id: 'r_hcm_05',
    name: 'Cơm Chay Cô Lan (Quận 10)',
    address: 'Số 5 đường 3/2, phường 11, quận 10, TP.HCM',
    city: 'TP.HCM',
    district: 'Quận 10',
    distanceKm: 5.1,
    openingHours: '06:30 - 19:30',
    closingDay: 'Thứ 3',
    phoneNumber: '0902 777 004',
    priceRangeVND: { min: 20000, max: 60000 },
    dietTypes: ['vegan', 'vegetarian-friendly'],
    rating: 4.1,
    reviewCount: 630,
    imageUrl: IMG('saigon cheap vegan rice stall street food quan 10'),
    tags: ['giá rẻ', 'cơm bento', 'dân lao động'],
    highlights: [
      'Cơm bento 2 món 20k / hộp, đủ cho 1 người ăn no',
      'Có 20 loại rau củ thay đổi mỗi ngày',
      'Dùng 100% gạo hữu cơ An Giang',
    ],
    hasDelivery: true,
    hasParking: true,
    hasTakeAway: true,
    acceptsBooking: false,
    createdAt: '2026-09-10',
  },
  {
    id: 'r_hanoi_04',
    name: 'Món Chay Cô Thơm (Long Biên)',
    address: 'Số 188 phố Nguyễn Văn Cừ, phường Gia Thụy, quận Long Biên, Hà Nội',
    city: 'Hà Nội',
    district: 'Long Biên',
    distanceKm: 9.3,
    openingHours: '07:00 - 20:00',
    closingDay: 'Không',
    phoneNumber: '024 3888 7766',
    priceRangeVND: { min: 35000, max: 100000 },
    dietTypes: ['ovo-lacto', 'ovo'],
    rating: 4.3,
    reviewCount: 420,
    imageUrl: IMG('long bien hanoi homey vietnamese vegan restaurant bridge view'),
    tags: ['bún đậu', 'phở cuốn', 'quán gia đình'],
    highlights: [
      'Gần cầu Long Biên, ghé thăm dễ dàng sau khi đi bộ quanh hồ',
      'Bún đậu chay cô Thơm truyền thống 30 năm',
      'Chỗ gửi xe ô tô + xe máy',
    ],
    hasDelivery: false,
    hasParking: true,
    hasTakeAway: true,
    acceptsBooking: false,
    createdAt: '2026-08-20',
  },
  {
    id: 'r_danang_04',
    name: 'Đầm Sen Bistro Đà Nẵng',
    address: 'Số 72 đường Nguyễn Văn Linh, phường Thọ Quang, quận Sơn Trà, Đà Nẵng',
    city: 'Đà Nẵng',
    district: 'Sơn Trà',
    distanceKm: 3.5,
    openingHours: '10:00 - 23:00',
    closingDay: 'Mở cửa cả tuần',
    phoneNumber: '0236 888 555',
    priceRangeVND: { min: 140000, max: 380000 },
    dietTypes: ['vegan', 'ovo-lacto', 'vegetarian-friendly'],
    rating: 4.8,
    reviewCount: 2050,
    imageUrl: IMG('luxury vegan bistro danang lotus pond fountain night light'),
    tags: ['tiệc cưới', 'sự kiện', 'buffet tối', 'check in đẹp'],
    highlights: [
      'Khuôn viên 2000m2 hồ sen, cảnh đẹp chụp ảnh',
      'Buffet tối cuối tuần 45 món chay cao cấp',
      'Sân khấu ngoài trời tổ chức sự kiện 200 khách',
    ],
    hasDelivery: false,
    hasParking: true,
    hasTakeAway: true,
    acceptsBooking: true,
    createdAt: '2026-07-30',
  },
  {
    id: 'r_hanoi_05',
    name: 'Quán Chay Sống & Mơ (Hoàn Kiếm)',
    address: 'Số 28 phố Hàng Gai, phường Cửa Đông, quận Hoàn Kiếm, Hà Nội',
    city: 'Hà Nội',
    district: 'Hoàn Kiếm',
    distanceKm: 2.1,
    openingHours: '09:00 - 23:30',
    closingDay: 'Không nghỉ',
    phoneNumber: '0983 200 400',
    website: 'https://songmo-chay.vn',
    priceRangeVND: { min: 80000, max: 210000 },
    dietTypes: ['vegan', 'raw'],
    rating: 4.7,
    reviewCount: 1320,
    imageUrl: IMG('hanoi old quarter vegan cafe hang gai cozy vegan brunch'),
    tags: ['phố cổ', 'cafe sáng', 'sinh tố', 'du khách'],
    highlights: [
      'Nằm trong phố cổ, gần hồ Hoàn Kiếm dễ checkin',
      'Có cả khu cafe sáng & khu nấu ăn trưa/tối',
      'Phục vụ khách du lịch tiếng Anh, Nhật, Hàn',
    ],
    hasDelivery: true,
    hasParking: false,
    hasTakeAway: true,
    acceptsBooking: true,
    createdAt: '2026-06-04',
  },
]

// ---------- Helpers ----------
function normalize(s: string) {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function applyFilter(list: Restaurant[], f: RestaurantFilter): Restaurant[] {
  const token = normalize(f.search)
  let out = list
  if (f.search.trim()) {
    out = out.filter(
      (r) =>
        normalize(r.name).includes(token) ||
        normalize(r.address).includes(token) ||
        normalize(`${r.district} ${r.city}`).includes(token) ||
        r.tags.some((t) => normalize(t).includes(token)) ||
        r.highlights.some((h) => normalize(h).includes(token)),
    )
  }
  if (f.city !== 'all') out = out.filter((r) => r.city === f.city)
  if (f.diet !== 'all')
    out = out.filter((r) => (r.dietTypes as string[]).includes(f.diet))
  if (f.ratingMin > 0) out = out.filter((r) => r.rating >= f.ratingMin)
  if (f.deliveryOnly) out = out.filter((r) => r.hasDelivery)
  // Lọc theo khoảng cách tối đa (pill Tất cả / <1 / <3 / <5 / <10): 0 = Tất cả (bỏ qua)
  if (typeof f.distanceMaxKm === 'number' && f.distanceMaxKm > 0) {
    out = out.filter((r) => Number.isFinite(r.distanceKm) && r.distanceKm <= f.distanceMaxKm)
  }
  return sortRestaurants(out, f.sort)
}

function sortRestaurants(list: Restaurant[], sort: RestaurantSortOption): Restaurant[] {
  const arr = [...list]
  switch (sort) {
    case 'newest':
      return arr.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    case 'distance_asc':
      return arr.sort((a, b) => a.distanceKm - b.distanceKm)
    case 'rating_desc':
      return arr.sort(
        (a, b) => b.rating * 10000 + b.reviewCount - (a.rating * 10000 + a.reviewCount),
      )
    case 'relevance':
    default:
      return arr.sort(
        (a, b) =>
          b.rating + b.reviewCount / 1000 - (a.rating + a.reviewCount / 1000),
      )
  }
}

// ---------- Public API ----------
export async function getRestaurants(
  inputFilter: Partial<RestaurantFilter> = {},
): Promise<RestaurantListResponse> {
  await delay()
  const applied: RestaurantFilter = { ...DEFAULT_RESTAURANT_FILTER, ...inputFilter }
  const items = applyFilter(IN_MEMORY_RESTAURANTS, applied)
  return { items, totalCount: items.length, appliedFilter: applied }
}

export async function getRestaurantDetail(id: string): Promise<Restaurant | null> {
  await delay()
  const found = IN_MEMORY_RESTAURANTS.find((r) => r.id === id)
  return found ?? null
}

// Alias (filterRestaurants) as requested in Task 6 spec
export async function filterRestaurants(
  inputFilter: Partial<RestaurantFilter> = {},
): Promise<RestaurantListResponse> {
  return getRestaurants(inputFilter)
}

/* ---------- Public API helpers (chips / pins / menu) ---------- */
export async function getDishChips(): Promise<DishChip[]> {
  await delay(500)
  return DISH_CHIPS
}

export async function getMapPins(): Promise<MapPinMarker[]> {
  await delay(500)
  return MAP_PINS
}

export async function getRestaurantMenu(
  _id: string,
): Promise<RestaurantDish[]> {
  await delay(500)
  return DISH_CARDS
}

export { IN_MEMORY_RESTAURANTS as __DEBUG_IN_MEMORY_RESTAURANTS__ }
