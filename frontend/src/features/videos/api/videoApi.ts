import type {
  UploadVideoFormState,
  VideoCategory,
  VideoItem,
  VideoListFilter,
  VideoListResponse,
  VideoModerationStatus,
  VideoSortOption,
} from '../types/video.types'
import { DEFAULT_VIDEO_FILTER } from '../types/video.types'

const delay = (ms = 500) => new Promise<void>((r) => setTimeout(r, ms))

// ---------- AI Moderation rules (AI chỉ FLAG thôi, Admin quyết định cuối) ----------
const AI_FLAG_KEYWORDS = [
  'thịt',
  'cá',
  'tôm',
  'mỡ heo',
  'nước mắm',
  'thuốc lá',
  'rượu',
  'bia',
  'cá ngừ',
]
const AI_FLAG_NOTE_GENERIC =
  'Tự động phát hiện từ khóa nhạy cảm có thể không phù hợp với chủ đề thuần thực vật. Đã chuyển cho Admin xem xét cuối cùng.'

function runAiModeration(form: { title: string; description: string }): {
  status: VideoModerationStatus
  aiFlagNote?: string
} {
  const text = `${form.title} ${form.description}`.toLowerCase()
  const matched = AI_FLAG_KEYWORDS.filter((k) => text.includes(k))
  if (matched.length > 0) {
    return {
      status: 'pending_admin',
      aiFlagNote: `${AI_FLAG_NOTE_GENERIC} Phát hiện từ khóa: ${matched.join(', ')}.`,
    }
  }
  // Không có từ khóa → AI đang kiểm tra trong 1 vòng ngắn → về cơ bản cho sang pending hoặc published ngẫu nhiên
  // Luôn bắt đầu từ ai_checking (sau 1 vài vòng sẽ chuyển → đúng flow MVP AI flag, Admin duyệt)
  return { status: 'ai_checking' }
}

// ---------- In-memory seed data ----------
const AVATAR_URL = (seed: string) =>
  `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${encodeURIComponent(
    seed,
  )}&image_size=square`

const THUMB = (seed: string) =>
  `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${encodeURIComponent(
    seed,
  )}&image_size=landscape_16_9`

const IN_MEMORY_VIDEOS: VideoItem[] = [
  {
    id: 'v_001',
    title: 'Hướng dẫn chiên đậu phụ vàng giòn mềm ruột không bị dính chảo',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: THUMB('vietnamese vegan chef frying golden crispy tofu pan cooking'),
    durationSeconds: 412,
    category: 'cooking-tutorial',
    moderationStatus: 'published',
    creatorName: 'Bếp Nhà Mẹ',
    creatorAvatar: AVATAR_URL('asian mom chef wearing green apron avatar flat style'),
    viewCount: 128310,
    likeCount: 9210,
    description:
      'Share secret cho đậu phụ chiên vàng đều không bị dính chảo, còn mềm ruột, ăn không ngán. Dùng tẩm bột năng 5 phút trước khi chiên là bí quyết chính.',
    tags: ['đậu phụ', 'chiên vàng', 'bí quyết', 'dễ làm'],
    createdAt: '2026-10-02',
  },
  {
    id: 'v_002',
    title: '7 nguyên liệu chay nên có luôn trong tủ để nấu ăn tiết kiệm',
    videoUrl: 'https://www.youtube.com/watch?v=2',
    thumbnailUrl: THUMB('minimalist vegan pantry top 7 staples tofu brown rice chia seeds mushrooms'),
    durationSeconds: 623,
    category: 'ingredient-guide',
    moderationStatus: 'published',
    creatorName: 'Eat Clean Hà Nội',
    creatorAvatar: AVATAR_URL('young asian male fitness trainer avatar green tshirt'),
    viewCount: 82310,
    likeCount: 5120,
    description:
      'Nếu bận rộn nhưng vẫn muốn ăn uống lành mạnh, hãy trang bị sẵn 7 thứ này. Tôi nấu đủ 3 bữa/ngày chỉ với 7 nguyên liệu + gia vị cơ bản.',
    tags: ['nguyên liệu', 'tiết kiệm', 'tủ bếp', 'ăn lành'],
    createdAt: '2026-09-30',
  },
  {
    id: 'v_003',
    title: 'Ngày đầu tiên ăn thuần thực vật 7 ngày của tôi (raw + cooked)',
    videoUrl: 'https://www.youtube.com/watch?v=3',
    thumbnailUrl: THUMB('vegan day in the life vlog raw salad cooked soup meals'),
    durationSeconds: 815,
    category: 'vegan-lifestyle',
    moderationStatus: 'published',
    creatorName: 'Yoga Kitchen',
    creatorAvatar: AVATAR_URL('serene asian female yoga instructor avatar green top'),
    viewCount: 54213,
    likeCount: 3910,
    description:
      'Vlog 24h: tôi ăn gì, chuẩn bị như thế nào, cảm nhận cơ thể thay đổi ra sao sau 1 tuần ăn thuần thực vật 100% không sữa, không trứng.',
    tags: ['vlog', 'chuyển đổi ăn chay', 'raw food', 'cảm nhận'],
    createdAt: '2026-10-01',
  },
  {
    id: 'v_004',
    title: 'Chuẩn bị meal prep cả tuần chỉ 2 tiếng (lấy ra hâm nóng ăn liền)',
    videoUrl: 'https://www.youtube.com/watch?v=4',
    thumbnailUrl: THUMB('meal prep sunday vegan containers 5 days colorful tofu vegetables'),
    durationSeconds: 1250,
    category: 'meal-prep',
    moderationStatus: 'ai_checking',
    aiFlagNote:
      'AI đang quét nội dung hình ảnh & giọng nói xem có sử dụng từ khóa không phù hợp không. Kết quả sẵn sàng trong 2-3 phút.',
    creatorName: 'Nhật Minh Bếp Chay',
    creatorAvatar: AVATAR_URL('asian male chef long hair bandana flat style'),
    viewCount: 18213,
    likeCount: 1820,
    description:
      'Chủ Nhật tôi làm meal prep 5 ngày: 3 món chính + 2 món phụ. Các hộp lấy ra hâm 90s có thể ăn ngay. Dành cho dân văn phòng bận rộn.',
    tags: ['meal prep', 'văn phòng', 'tiết kiệm thời gian', '7 ngày'],
    createdAt: '2026-10-05',
  },
  {
    id: 'v_005',
    title: 'Review 5 quán phở chay Sài Gòn ngon bất ngờ giá dưới 50k',
    videoUrl: 'https://www.youtube.com/watch?v=5',
    thumbnailUrl: THUMB('vietnamese vegan pho restaurant review 5 places saigon street food'),
    durationSeconds: 930,
    category: 'restaurant-review',
    moderationStatus: 'published',
    creatorName: 'Chay Sài Gòn TV',
    creatorAvatar: AVATAR_URL('young vietnamese youtuber male avatar camera flat'),
    viewCount: 96231,
    likeCount: 6320,
    description:
      'Tôi đi review 5 quán phở chay giá rẻ ở Quận 1, 3, 5, 10, Bình Thạnh. Cực kỳ bất ngờ có quán bán 35k mà nước dùng ngọt đậm rất tốt.',
    tags: ['review', 'phở', 'Sài Gòn', 'giá rẻ'],
    createdAt: '2026-09-25',
  },
  {
    id: 'v_006',
    title: '5 dấu hiệu cơ thể thiếu B12 khi ăn thuần thực vật (kiểm tra ngay)',
    videoUrl: 'https://www.youtube.com/watch?v=6',
    thumbnailUrl: THUMB('doctor explaining vegan b12 deficiency symptoms infographic'),
    durationSeconds: 540,
    category: 'health-tips',
    moderationStatus: 'published',
    creatorName: 'BS Trần Hoa Thuần Chay',
    creatorAvatar: AVATAR_URL('asian female doctor avatar white coat flat style'),
    viewCount: 118210,
    likeCount: 9820,
    description:
      'Bác sĩ chuyên khoa chia sẻ 5 dấu hiệu thiếu B12 thường gặp. Nếu có trên 2 dấu hiệu nên đi xét nghiệm máu và bổ sung B12 đúng liều lượng.',
    tags: ['B12', 'bác sĩ chia sẻ', 'dinh dưỡng', 'thiếu chất'],
    createdAt: '2026-09-20',
  },
  {
    id: 'v_007',
    title: '10 món ăn nhanh dưới 15 phút không cần nấu nhiều',
    videoUrl: 'https://www.youtube.com/watch?v=7',
    thumbnailUrl: THUMB('10 quick vegan recipes under 15 minutes collage sandwich salad noodles'),
    durationSeconds: 1412,
    category: 'quick-recipe',
    moderationStatus: 'pending_admin',
    aiFlagNote:
      'AI phát hiện có cảnh quay có thể chứa sản phẩm sữa bò (0:11:32). Đã chuyển cho Admin kiểm tra frame cuối cùng trước khi xuất bản.',
    creatorName: 'Bếp Nhà Mẹ',
    creatorAvatar: AVATAR_URL('asian mom chef wearing green apron avatar flat style'),
    viewCount: 4221,
    likeCount: 315,
    description:
      '10 món ăn làm trong 15 phút, cực kỳ ngon, không cần nhiều dụng cụ. Rất hợp cho sinh viên và người đi làm về nhà trễ.',
    tags: ['nhanh', '15 phút', 'sinh viên', 'đi làm'],
    createdAt: '2026-10-08',
  },
  {
    id: 'v_008',
    title: 'Làm mâm cỗ giỗ tổ 5 món chay truyền thống (bánh chưng, bánh bèo, canh khổ qua)',
    videoUrl: 'https://www.youtube.com/watch?v=8',
    thumbnailUrl: THUMB('traditional vegan vietnamese ancestor worship tray 5 dishes banh chung khổ qua'),
    durationSeconds: 1820,
    category: 'festival-food',
    moderationStatus: 'published',
    creatorName: 'Hương Phố Cổ',
    creatorAvatar: AVATAR_URL('asian grandmother chef avatar hanoi old style'),
    viewCount: 68312,
    likeCount: 5210,
    description:
      'Chia sẻ kinh nghiệm làm mâm cỗ giỗ tổ chay truyền thống 5 món. Quan trọng là cách làm không bị "hỏng hương" mà vẫn đủ vị Thanh Đạm.',
    tags: ['giỗ tổ', 'lễ hội', 'mâm cỗ', 'truyền thống'],
    createdAt: '2026-09-15',
  },
  {
    id: 'v_009',
    title: 'Sauté rau củ màu 3 cách nêm gia vị khác nhau thơm ngon đậm đà',
    videoUrl: 'https://www.youtube.com/watch?v=9',
    thumbnailUrl: THUMB('stir fry rainbow vegetables 3 sauces soy garlic ginger vegan cooking'),
    durationSeconds: 360,
    category: 'cooking-tutorial',
    moderationStatus: 'pending_admin',
    aiFlagNote:
      'Từ khóa "nước mắm chay" xuất hiện ở mô tả — cần Admin xác nhận sản phẩm nước mắm được review là sản phẩm chay HỢP LỆ không chứa cá, tránh gây hiểu lầm cho người xem.',
    creatorName: 'Nhật Minh Bếp Chay',
    creatorAvatar: AVATAR_URL('asian male chef long hair bandana flat style'),
    viewCount: 2135,
    likeCount: 180,
    description:
      '3 cách nêm khác nhau cho một mẻ rau củ giống hệt. Mỗi cách là một phong vị: Hàn Quốc, Việt Nam, Trung Hoa. Làm thử xem nhà mình hợp cách nào nha.',
    tags: ['rau củ', 'xào', '3 cách', 'gia vị'],
    createdAt: '2026-10-07',
  },
  {
    id: 'v_010',
    title: 'Tôi chuyển sang ăn thuần thực vật sau khi bị bệnh tiểu đường type 2 (kết quả 3 tháng sau)',
    videoUrl: 'https://www.youtube.com/watch?v=10',
    thumbnailUrl: THUMB('senior asian man health transformation diabetes type 2 vegan plant based diet'),
    durationSeconds: 780,
    category: 'vegan-lifestyle',
    moderationStatus: 'published',
    creatorName: 'Anh Chưởng Chay Hà Nội',
    creatorAvatar: AVATAR_URL('senior vietnamese male uncle smile avatar flat'),
    viewCount: 72810,
    likeCount: 7320,
    description:
      'Kể chuyện thật: trước đây tôi bị tiểu đường type 2, chỉ số đường huyết rất cao. Sau 3 tháng ăn thuần thực vật 100% có sự thay đổi lớn — bác sĩ cũng bất ngờ.',
    tags: ['tiểu đường', 'chuyện thật', 'chuyển đổi', 'sức khỏe'],
    createdAt: '2026-10-03',
  },
  {
    id: 'v_011',
    title: 'Món canh mùng tơi nấu nấm đơn giản nhưng ngon cơm nhà ai cũng khen',
    videoUrl: 'https://www.youtube.com/watch?v=11',
    thumbnailUrl: THUMB('vietnamese vegan malabar spinach soup mushrooms bowl white'),
    durationSeconds: 310,
    category: 'quick-recipe',
    moderationStatus: 'ai_checking',
    aiFlagNote:
      'AI đang quét phụ đề tự động (auto subtitle) xem có từ khóa không phù hợp không. Khoảng 2 phút nữa sẽ có kết quả.',
    creatorName: 'Chay Miền Tây',
    creatorAvatar: AVATAR_URL('elderly vietnamese female chef conical hat avatar'),
    viewCount: 3420,
    likeCount: 302,
    description:
      'Món canh đơn giản tầm 10-15 phút, nấu từ mùng tơi vườn nhà + nấm rơm. Ngon lắm, ai cũng khen ăn cơm 2 chén.',
    tags: ['canh', 'mùng tơi', 'nấm', 'nhà làm'],
    createdAt: '2026-10-06',
  },
  {
    id: 'v_012',
    title: 'Review đầu tàu sữa hạt 10 thương hiệu Việt (hàm lượng đạm thật, giá bán)',
    videoUrl: 'https://www.youtube.com/watch?v=12',
    thumbnailUrl: THUMB('vietnamese plant milk brands review 10 bottles protein content comparison'),
    durationSeconds: 1140,
    category: 'ingredient-guide',
    moderationStatus: 'rejected',
    aiFlagNote:
      'Admin từ chối: video quá thiên vị 1 thương hiệu, không có sự so sánh khách quan. Cần quay lại thêm phần mù (blind test) ít nhất 5 mẫu so sánh trung lập hơn.',
    adminNote:
      'Không duyệt: Nội dung review có thiên vị thương hiệu và thiếu minh chứng về hàm lượng đạm. Cập nhật upload lại sau khi có blind test + chứng nhận kiểm định dinh dưỡng.',
    creatorName: 'Eat Clean Hà Nội',
    creatorAvatar: AVATAR_URL('young asian male fitness trainer avatar green tshirt'),
    viewCount: 1102,
    likeCount: 54,
    description:
      'Tôi mua 10 thương hiệu sữa hạt phổ biến ở Việt Nam, so sánh hương vị, hàm lượng đạm thực tế trên nhãn và giá bán. Sẽ có 3 cái tôi recommend.',
    tags: ['review', 'sữa hạt', 'đạm thực vật', 'so sánh'],
    createdAt: '2026-10-04',
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

function applyFilter(list: VideoItem[], filter: VideoListFilter): VideoItem[] {
  const token = normalize(filter.search)
  let out = list
  if (filter.search.trim()) {
    out = out.filter(
      (v) =>
        normalize(v.title).includes(token) ||
        normalize(v.description).includes(token) ||
        v.tags.some((t) => normalize(t).includes(token)) ||
        normalize(v.creatorName).includes(token),
    )
  }
  if (filter.category !== 'all') out = out.filter((v) => v.category === filter.category)
  if (filter.status !== 'all') out = out.filter((v) => v.moderationStatus === filter.status)
  return sortVideos(out, filter.sort)
}

function sortVideos(list: VideoItem[], sort: VideoSortOption): VideoItem[] {
  const arr = [...list]
  switch (sort) {
    case 'newest':
      return arr.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    case 'duration_asc':
      return arr.sort((a, b) => a.durationSeconds - b.durationSeconds)
    case 'most_liked':
      return arr.sort((a, b) => b.likeCount - a.likeCount)
    case 'trending':
    default:
      return arr.sort(
        (a, b) =>
          b.likeCount + b.viewCount / 10 - (a.likeCount + a.viewCount / 10),
      )
  }
}

// ---------- Public API ----------
export async function getVideos(
  inputFilter: Partial<VideoListFilter> = {},
): Promise<VideoListResponse> {
  await delay()
  const applied: VideoListFilter = { ...DEFAULT_VIDEO_FILTER, ...inputFilter }
  const items = applyFilter(IN_MEMORY_VIDEOS, applied)
  return { items, totalCount: items.length, appliedFilter: applied }
}

export async function getVideoDetail(id: string): Promise<VideoItem | null> {
  await delay()
  const found = IN_MEMORY_VIDEOS.find((v) => v.id === id)
  return found ?? null
}

export async function uploadVideo(form: UploadVideoFormState): Promise<VideoItem> {
  await delay()
  const aiRes = runAiModeration({ title: form.title, description: form.description })
  const category = (form.category || 'cooking-tutorial') as VideoCategory
  const dur = Number(form.duration) || 300
  const thumbnail =
    form.thumbnailUrl ||
    THUMB(`user uploaded video thumbnail ${encodeURIComponent(form.title || 'vegan recipe')}`)
  const video: VideoItem = {
    id: `v_user_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    title: form.title.trim(),
    videoUrl: form.videoUrl.trim(),
    thumbnailUrl: thumbnail,
    durationSeconds: dur,
    category,
    moderationStatus: aiRes.status,
    aiFlagNote: aiRes.aiFlagNote,
    creatorName: 'Tôi (đăng nhập)',
    creatorAvatar: AVATAR_URL('user avatar minimalist person green shirt flat'),
    viewCount: 0,
    likeCount: 0,
    description: form.description.trim(),
    tags: form.title
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 1)
      .slice(0, 4),
    createdAt: new Date().toISOString().slice(0, 10),
  }
  IN_MEMORY_VIDEOS.unshift(video)
  return video
}

export { IN_MEMORY_VIDEOS as __DEBUG_IN_MEMORY_VIDEOS__ }
