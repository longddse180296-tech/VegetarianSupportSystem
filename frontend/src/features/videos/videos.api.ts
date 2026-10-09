import type {
  CookingVideo,
  VideoChef,
  VideoFilterValues,
  VideoListResult,
} from './videos.types'

const TRENDING_CHEFS: VideoChef[] = [
  {
    id: 'chef-1',
    name: 'Chef Minh Tuấn',
    title: 'Bếp trưởng ẩm thực thực dưỡng',
    avatarUrl:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Professional%20asian%20male%20chef%20portrait%20in%20white%20uniform%20smiling%20warmly%2C%20soft%20lighting%2C%20photorealistic&image_size=square',
    videosCount: 24,
  },
  {
    id: 'chef-2',
    name: 'DS. Kim Oanh',
    title: 'Chuyên gia cân bằng vi chất',
    avatarUrl:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Professional%20vietnamese%20female%20nutritionist%20portrait%20in%20business%20casual%20outfit%20smiling%20kindly%2C%20soft%20lighting%2C%20photorealistic&image_size=square',
    videosCount: 18,
  },
  {
    id: 'chef-3',
    name: 'BS. Hoàng Nam',
    title: 'Bác sĩ dinh dưỡng dự phòng',
    avatarUrl:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Professional%20middle%20aged%20vietnamese%20male%20doctor%20portrait%20in%20white%20coat%20with%20friendly%20smile%2C%20photorealistic&image_size=square',
    videosCount: 15,
  },
]

const POPULAR_TAGS = [
  '#Đậu_hũ',
  '#Nấm',
  '#Salad',
  '#Bữa_sáng',
  '#Bữa_tối',
  '#Protein_thực_vật',
  '#Ăn_chay_giảm_cân',
  '#Cách_chay',
]

function img(prompt: string) {
  const encoded = encodeURIComponent(prompt)
  return `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${encoded}&image_size=landscape_16_9`
}

const BASE_VIDEOS: CookingVideo[] = [
  {
    id: 'vid-1',
    title: 'Đậu hũ sốt nấm đơn giản trong 20 phút',
    description:
      'Hướng dẫn từng bước chiên đậu hũ vàng giòn rụm bên ngoài, mềm mịn bên trong quyện cùng sốt nấm đông cô đậm đà thơm nức mũi, bổ sung nguồn đạm thực vật sạch và cân bằng.',
    thumbnailUrl: img(
      'A top down food photography of golden crispy pan fried tofu with shiitake mushroom sauce, green onions and sesame seeds, in a white ceramic bowl on dark wooden table, Vietnamese home cooking style, soft warm lighting',
    ),
    durationSec: 20 * 60 + 15,
    viewsCount: 42500,
    publishedAtISO: '2026-05-14T08:30:00.000Z',
    category: 'main',
    tags: ['Đậu hũ', 'Nấm', 'Món chính'],
    featured: true,
    chef: { id: 'chef-1', name: 'Chef Minh Tuấn', title: 'Bếp trưởng' },
  },
  {
    id: 'vid-2',
    title: 'Cơm gạo lứt rau củ thập cẩm thanh vị',
    description: 'Cơm gạo lứt thơm dẻo kết hợp rau củ đa dạng, phù hợp bữa ăn giảm cân lành mạnh.',
    thumbnailUrl: img(
      'Vibrant vegan brown rice bowl with roasted mixed vegetables, avocado, edamame and sesame dressing, top down view on wooden table, bright natural lighting',
    ),
    durationSec: 12 * 60 + 15,
    viewsCount: 18200,
    publishedAtISO: '2026-10-05T08:30:00.000Z',
    category: 'main',
    tags: ['Cơm', 'Rau củ', 'Giảm cân'],
    chef: { id: 'chef-2', name: 'DS. Kim Oanh', title: 'Chuyên gia dinh dưỡng' },
  },
  {
    id: 'vid-3',
    title: 'Salad bơ đậu gà sốt mè rang béo ngậy',
    description: 'Salad tươi mát kết hợp đậu gà protein và sốt mè rang thơm béo đặc trưng.',
    thumbnailUrl: img(
      'Fresh avocado and chickpea salad with roasted sesame dressing, cherry tomatoes and green leaves, white plate, top view, bright modern food photography',
    ),
    durationSec: 8 * 60 + 40,
    viewsCount: 24100,
    publishedAtISO: '2026-10-04T08:30:00.000Z',
    category: 'salad',
    tags: ['Salad', 'Bơ', 'Đậu gà'],
    chef: { id: 'chef-3', name: 'BS. Hoàng Nam', title: 'Bác sĩ' },
  },
  {
    id: 'vid-4',
    title: 'Canh nấm hạt sen tảo đỏ bồi bổ cơ thể',
    description: 'Canh thanh ngọt tự nhiên từ nấm rơm, hạt sen và tảo đỏ bổ sung sắt tự nhiên.',
    thumbnailUrl: img(
      'Clear Vietnamese style vegan mushroom soup with lotus seeds, goji berries and seaweed in a white ceramic pot, steam rising, top view, soft warm lighting',
    ),
    durationSec: 15 * 60 + 30,
    viewsCount: 31000,
    publishedAtISO: '2026-10-03T08:30:00.000Z',
    category: 'soup',
    tags: ['Canh', 'Nấm', 'Hạt sen'],
    chef: { id: 'chef-3', name: 'BS. Hoàng Nam', title: 'Bác sĩ' },
  },
  {
    id: 'vid-5',
    title: 'Mì xào rau củ sốt tương đậu hảo chay',
    description: 'Mì xào dai mềm quyện cùng sốt tương đậu thơm lừng và rau củ giòn tươi.',
    thumbnailUrl: img(
      'Stir fried vegan noodles with mixed vegetables, tofu puffs and soy sauce, chopsticks on the side, dark ceramic plate, top view, Asian restaurant style lighting',
    ),
    durationSec: 10 * 60 + 20,
    viewsCount: 15600,
    publishedAtISO: '2026-10-02T08:30:00.000Z',
    category: 'main',
    tags: ['Mì', 'Xào', 'Rau củ'],
    chef: { id: 'chef-1', name: 'Chef Minh Tuấn', title: 'Bếp trưởng' },
  },
  {
    id: 'vid-6',
    title: 'Bún chay đậu thanh đạm nước dùng củ quả',
    description: 'Bún tươi mềm với nước dùng đậm đà củ quả, đậu non và nấm đa dạng.',
    thumbnailUrl: img(
      'Vietnamese vegan rice noodle soup with soft tofu, mushrooms, fresh herbs and lime wedge on the side, in a white bowl, top view, bright studio food photo',
    ),
    durationSec: 15 * 60,
    viewsCount: 29800,
    publishedAtISO: '2026-10-01T08:30:00.000Z',
    category: 'soup',
    tags: ['Bún', 'Nước dùng', 'Đậu non'],
    chef: { id: 'chef-1', name: 'Chef Minh Tuấn', title: 'Bếp trưởng' },
  },
  {
    id: 'vid-7',
    title: 'Sinh tố xanh detox giàu năng lượng vàng vì chất',
    description: 'Sinh tố xanh thơm ngon từ cải bó xôi, táo xanh, chuối và hạt chia, tốt cho tiêu hóa.',
    thumbnailUrl: img(
      'Vibrant green detox smoothie in a tall glass with spinach, apple, banana and chia seeds, fresh leaves on the side, top view, bright natural lighting on marble table',
    ),
    durationSec: 5 * 60 + 10,
    viewsCount: 19400,
    publishedAtISO: '2026-09-30T08:30:00.000Z',
    category: 'drink',
    tags: ['Sinh tố', 'Detox', 'Bữa sáng'],
    chef: { id: 'chef-2', name: 'DS. Kim Oanh', title: 'Chuyên gia' },
  },
]

const delay = <T>(data: T, ms = 450): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(data), ms))

export function fetchVideos(
  filters: Partial<VideoFilterValues> = {},
  signal?: AbortSignal,
): Promise<VideoListResult> {
  if (signal?.aborted) return Promise.reject(new DOMException('Aborted', 'AbortError'))
  const search = (filters.search ?? '').toLowerCase().trim()
  const cat = filters.category ?? 'all'
  const sort = filters.sort ?? 'newest'
  const page = filters.page ?? 1
  const pageSize = 6

  let list = [...BASE_VIDEOS]
  if (cat !== 'all') list = list.filter((v) => v.category === cat)
  if (search) {
    list = list.filter(
      (v) =>
        v.title.toLowerCase().includes(search) ||
        v.tags.some((t) => t.toLowerCase().includes(search)) ||
        v.chef.name.toLowerCase().includes(search),
    )
  }

  switch (sort) {
    case 'most_viewed':
      list.sort((a, b) => b.viewsCount - a.viewsCount)
      break
    case 'shortest':
      list.sort((a, b) => a.durationSec - b.durationSec)
      break
    case 'newest':
    default:
      list.sort((a, b) => +new Date(b.publishedAtISO) - +new Date(a.publishedAtISO))
      break
  }

  const featured = BASE_VIDEOS.find((v) => v.featured) ?? null
  const totalItems = list.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const start = (page - 1) * pageSize
  const items = list.slice(start, start + pageSize)

  return delay({
    items,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
    },
    featured,
    trendingChefs: TRENDING_CHEFS,
    popularTags: POPULAR_TAGS,
    totalVideos: BASE_VIDEOS.length + 81,
  })
}

export function generateAiPlaylist(prompt: string): Promise<{
  ok: true
  message: string
  suggestionIds: string[]
}> {
  const lower = prompt.toLowerCase()
  let ids = BASE_VIDEOS.slice(0, 3).map((v) => v.id)
  if (lower.includes('nấm') || lower.includes('đậu hũ')) ids = ['vid-1', 'vid-4', 'vid-2']
  if (lower.includes('detox') || lower.includes('giảm cân')) ids = ['vid-7', 'vid-3', 'vid-4']
  return delay(
    {
      ok: true as const,
      message: `Đã tạo danh sách phát gợi ý từ từ khóa "${prompt.trim()}".`,
      suggestionIds: ids,
    },
    520,
  )
}
