import type { SelectOption } from '../../../shared/components'
import type {
  ModerationStatus,
  UploadVideoFormState,
  Video,
  VideoCategory,
  VideoItem,
  VideoListFilter,
  VideoListResponse,
  VideoSortOption,
} from '../types/video.types'
import { DEFAULT_VIDEO_FILTER, formatDuration } from '../types/video.types'

const delay = <T,>(data: T, ms = 500): Promise<T> =>
  new Promise((r) => setTimeout(() => r(data), ms))

const delayVoid = (ms = 500) => new Promise<void>((r) => setTimeout(r, ms))

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
  status: ModerationStatus
  flagReason?: string
} {
  const text = `${form.title} ${form.description}`.toLowerCase()
  const matched = AI_FLAG_KEYWORDS.filter((k) => text.includes(k))
  if (matched.length > 0) {
    return {
      status: 'flagged_by_ai',
      flagReason: `${AI_FLAG_NOTE_GENERIC} Phát hiện từ khóa: ${matched.join(', ')}.`,
    }
  }
  // Mặc định video mới qua AI kiểm tra ban đầu
  return { status: 'pending_ai' }
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

const IN_MEMORY_VIDEOS: Video[] = [
  {
    id: 'dau-hu-sot-nam',
    title: 'Đậu hũ sốt nấm đơn giản trong 20 phút',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    duration: '20:15',
    durationSeconds: 1215,
    category: 'cooking-tutorial',
    moderationStatus: 'approved',
    author: {
      name: 'Chef Minh Tuấn',
      role: 'Bếp trưởng ẩm thực thực dưỡng',
      avatar:
        'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=200&q=80',
      followers: '45.2K',
      verified: true,
    },
    creatorName: 'Chef Minh Tuấn',
    creatorAvatar:
      'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=200&q=80',
    views: '42.5K lượt xem',
    viewCount: 42500,
    likes: 1200,
    likeCount: 1200,
    shares: 350,
    description:
      'Hướng dẫn từng bước chiên đậu hũ vàng giòn rụm bên ngoài, mềm mọng bên trong quyện cùng sốt nấm đông cô đậm đà thơm nức mũi, bổ sung nguồn đạm thực vật sạch sẽ và cân bằng.',
    tags: ['Món chính', 'Công thức nhanh', 'đậu hũ', 'nấm'],
    createdAt: '2026-05-14',
    isFeatured: true,
  },
  {
    id: 'v_grid_1',
    title: 'Cơm gạo lứt rau củ thập cẩm thanh vị',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80',
    duration: '12:15',
    durationSeconds: 735,
    category: 'Món chính',
    moderationStatus: 'approved',
    author: {
      name: 'DS. Kim Oanh',
      role: 'Chuyên gia cân bằng vi chất',
      avatar:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
      followers: '18.2K',
      verified: true,
    },
    creatorName: 'DS. Kim Oanh',
    creatorAvatar:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    views: '18.2K xem',
    viewCount: 18200,
    likes: 910,
    likeCount: 910,
    shares: 120,
    description:
      'Bữa cơm gạo lứt thanh vị với đa dạng các loại rau củ hữu cơ, dễ nấu và cân bằng dinh dưỡng.',
    tags: ['Món chính', 'cơm lứt', 'thập cẩm'],
    createdAt: '2026-05-10',
  },
  {
    id: 'v_grid_2',
    title: 'Salad bơ đậu gà sốt mè rang béo ngậy',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
    duration: '08:40',
    durationSeconds: 520,
    category: 'Salad',
    moderationStatus: 'approved',
    author: {
      name: 'Lan Anh',
      role: 'Food Blogger',
      avatar:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      followers: '24.1K',
    },
    creatorName: 'Lan Anh',
    creatorAvatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    views: '24.1K xem',
    viewCount: 24100,
    likes: 1420,
    likeCount: 1420,
    shares: 210,
    description:
      'Món salad bơ tươi mát kết hợp đậu gà giòn bùi, đẫm sốt mè rang thơm phức kích thích vị giác.',
    tags: ['Salad', 'bơ', 'đậu gà'],
    createdAt: '2026-05-11',
  },
  {
    id: 'v_grid_3',
    title: 'Canh nấm hạt sen táo đỏ bồi bổ cơ thể',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80',
    duration: '15:30',
    durationSeconds: 930,
    category: 'Món nước',
    moderationStatus: 'approved',
    author: {
      name: 'BS. Hoàng Nam',
      role: 'Bác sĩ Dinh dưỡng dự phòng',
      avatar:
        'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=200&q=80',
      followers: '31.0K',
      verified: true,
    },
    creatorName: 'BS. Hoàng Nam',
    creatorAvatar:
      'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=200&q=80',
    views: '31.0K xem',
    viewCount: 31000,
    likes: 2150,
    likeCount: 2150,
    shares: 340,
    description:
      'Bát canh thanh ngọt tự nhiên từ hạt sen, táo đỏ và nấm hương tươi giúp bồi bổ khí huyết, an thần.',
    tags: ['Món nước', 'canh nấm', 'hạt sen'],
    createdAt: '2026-05-09',
  },
  {
    id: 'v_grid_4',
    title: 'Mì xào rau củ sốt tương dầu hào chay',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80',
    duration: '10:20',
    durationSeconds: 620,
    category: 'Món chính',
    moderationStatus: 'approved',
    author: {
      name: 'Chef Minh Tuấn',
      role: 'Bếp trưởng ẩm thực thực dưỡng',
      avatar:
        'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=200&q=80',
      followers: '45.2K',
      verified: true,
    },
    creatorName: 'Chef Minh Tuấn',
    creatorAvatar:
      'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=200&q=80',
    views: '15.6K xem',
    viewCount: 15600,
    likes: 870,
    likeCount: 870,
    shares: 95,
    description:
      'Cách xào mì giòn sợi không bị nát, quyện sốt tương đậm đà và rau củ giòn ngọt chuẩn vị.',
    tags: ['Món chính', 'mì xào', 'nhanh gọn'],
    createdAt: '2026-05-08',
  },
  {
    id: 'v_grid_5',
    title: 'Bún chay thanh đạm nước dùng củ quả',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=600&q=80',
    duration: '18:00',
    durationSeconds: 1080,
    category: 'Món nước',
    moderationStatus: 'approved',
    author: {
      name: 'Thu Hằng',
      role: 'Đầu bếp chay',
      avatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      followers: '28.6K',
    },
    creatorName: 'Thu Hằng',
    creatorAvatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    views: '28.6K xem',
    viewCount: 28600,
    likes: 1780,
    likeCount: 1780,
    shares: 260,
    description:
      'Bí quyết hầm nước dùng bún chay từ bắp ngọt, lê và củ cải cho vị ngọt thanh tự nhiên.',
    tags: ['Món nước', 'bún chay', 'nước dùng'],
    createdAt: '2026-05-07',
  },
  {
    id: 'v_grid_6',
    title: 'Sinh tố xanh detox giàu năng lượng và vi chất',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1610970881699-44a5587cabec?auto=format&fit=crop&w=600&q=80',
    duration: '06:15',
    durationSeconds: 375,
    category: 'Đồ uống',
    moderationStatus: 'approved',
    author: {
      name: 'Minh Đức',
      role: 'Huấn luyện viên sức khỏe',
      avatar:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      followers: '19.4K',
    },
    creatorName: 'Minh Đức',
    creatorAvatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    views: '19.4K xem',
    viewCount: 19400,
    likes: 1120,
    likeCount: 1120,
    shares: 140,
    description:
      'Công thức sinh tố cải xoăn kết hợp chuối và hạt chia cho buổi sáng tràn đầy năng lượng tươi mới.',
    tags: ['Đồ uống', 'detox', 'sinh tố xanh'],
    createdAt: '2026-05-06',
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

// ---------- VideoList page static mock data (moved out from pages/VideoList.tsx) ----------
const FIGMA_PILL_CATEGORIES = [
  { key: 'all', label: 'Tất cả' },
  { key: 'main', label: 'Món chính' },
  { key: 'salad', label: 'Salad' },
  { key: 'soup', label: 'Món nước' },
  { key: 'drink', label: 'Đồ uống' },
  { key: 'dessert', label: 'Tráng miệng' },
  { key: 'tip', label: 'Mẹo nấu ăn' },
] as const
export type FigmaPillKey = (typeof FIGMA_PILL_CATEGORIES)[number]['key']

const FIGMA_HASHTAG_TOPICS = [
  '#Đậu hũ',
  '#Nấm',
  '#Salad',
  '#Bữa sáng',
  '#Bữa tối',
  '#Protein thực vật',
  '#Ăn chay giảm cân',
  '#Canh chay',
]

const FIGMA_TOP_CHEFS = [
  {
    id: 'chef-1',
    name: 'Chef Minh Tuấn',
    role: 'Bếp trưởng ẩm thực thuần dưỡng',
    videos: 24,
    avatarSeed: 'asian male chef clean cut professional avatar',
  },
  {
    id: 'chef-2',
    name: 'DS. Kim Oanh',
    role: 'Chuyên gia cân bằng vi chất',
    videos: 18,
    avatarSeed: 'asian female dietician professional glasses avatar',
  },
  {
    id: 'chef-3',
    name: 'BS. Hoàng Nam',
    role: 'Bác sĩ Dinh dưỡng dự phòng',
    videos: 15,
    avatarSeed: 'asian male doctor lab coat stethoscope friendly avatar',
  },
]

const DURATION_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'Tất cả thời lượng' },
  { value: 'short', label: 'Dưới 10 phút' },
  { value: 'medium', label: '10 – 20 phút' },
  { value: 'long', label: 'Trên 20 phút' },
]

const SORT_OPTIONS_VIDEO_LIST: SelectOption[] = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'trending', label: 'Xu hướng' },
  { value: 'most_liked', label: 'Yêu thích nhất' },
  { value: 'duration_asc', label: 'Thời lượng ngắn nhất' },
]

// ---------- VideoDetail page static mock data (moved out from pages/VideoDetail.tsx) ----------
const DETAIL_TITLE = 'Đậu hũ sốt nấm đơn giản trong 20 phút'
const DETAIL_CREATOR = {
  initials: 'AN',
  name: 'Bếp Chay An Nhiên',
  verified: true,
  subscribers: 45200,
  postedAgo: 'Đăng 2 ngày trước',
}
const DETAIL_CATEGORY_PILLS = [
  { label: 'Món chính chay', tone: 'green' as const },
  { label: 'Nấu nhanh 20 phút', tone: 'neutral' as const },
  { label: 'Giàu đạm thực vật', tone: 'neutral' as const },
]
const DETAIL_ACTIONS = [
  { key: 'like', label: '1.2K Thích' },
  { key: 'share', label: 'Chia sẻ' },
  { key: 'save', label: 'Lưu video' },
]
const DETAIL_DESCRIPTION =
  'Công thức đậu hũ non áp chảo sốt cùng nấm đông cô tươi, nấm đùi gà và nấm rơm đậm đà, hao cơm mà cực kỳ lành mạnh. Món ăn thanh nhẹ cung cấp trọn vẹn axit amin thiết yếu cho bữa cơm thuần thực vật đủ chất.'

export interface CommentItem {
  id: string
  initials?: string
  authorAvatarSeed?: string
  author: string
  isExpert?: boolean
  badges?: { label: string; tone: 'member' | 'pro' | 'author' }[]
  timeAgo: string
  content: string
  likes: number
  highlight?: 'author'
  replyToId?: string
}
const DETAIL_COMMENTS: CommentItem[] = [
  {
    id: 'c1',
    initials: 'TT',
    author: 'Trần Thu Thủy',
    badges: [{ label: 'Thành viên tích cực', tone: 'member' }],
    timeAgo: '2 giờ trước',
    content:
      'Mình vừa thử làm theo công thức của đầu bếp, sốt nấm đậm đà và đậu hũ giòn vừa tới ngon tuyệt vời ạ! Cảm ơn kênh nhiều.',
    likes: 24,
  },
  {
    id: 'c2',
    initials: 'HN',
    author: 'Bác sĩ Dinh dưỡng Hoàng Nam',
    isExpert: true,
    badges: [{ label: 'Chuyên gia xác thực', tone: 'pro' }],
    timeAgo: '5 giờ trước',
    content:
      'Món này cung cấp lượng đạm thực vật rất tốt từ nấm và đậu nành. Các bạn có thể thêm chút nấm hương tươi để tăng hương vị.',
    likes: 38,
  },
  {
    id: 'c3',
    initials: 'MT',
    author: 'Lê Minh Tuấn',
    timeAgo: '1 ngày trước',
    content:
      'Cho mình hỏi nếu không có dầu hào chay thì thay bằng gia vị gì hợp vị nhất vậy ạ?',
    likes: 7,
  },
  {
    id: 'c4',
    initials: 'AN',
    author: 'Kênh Đậu Hũ An Nhiên',
    badges: [{ label: 'Tác giả', tone: 'author' }],
    timeAgo: '22 giờ trước',
    content:
      'Chào bạn nhé, bạn có thể thay thế bằng tương tamari cốt nấm hoặc 1 thìa nước tương nguyên chất pha cùng xíu mật mía để tạo độ sánh và thơm tương tự nhé!',
    likes: 12,
    highlight: 'author',
    replyToId: 'c3',
  },
]

export interface RelatedVideo {
  id: string
  thumbnailSeed: string
  duration: string
  category: string
  title: string
  author: string
  views: string
  badge?: 'watching'
}
const RELATED_VIDEOS: RelatedVideo[] = [
  {
    id: 'rv-1',
    thumbnailSeed: 'brown rice salad vegetables bowl meal prep glass container',
    duration: '12:15',
    category: 'Món chính',
    title: 'Cơm gạo lứt rau củ thập cẩm thanh vị',
    author: 'DS. Kim Oanh',
    views: '18.2K xem',
  },
  {
    id: 'rv-2',
    thumbnailSeed: 'vegan lotus root soup mushroom goji berries clear broth bowl',
    duration: '15:30',
    category: 'Món nước',
    title: 'Canh nấm hạt sen táo đỏ bồi bổ cơ thể',
    author: 'BS. Hoàng Nam',
    views: '31.0K xem',
  },
  {
    id: 'rv-3',
    thumbnailSeed: 'avocado chickpea salad toasted sesame dressing bowl wooden',
    duration: '08:40',
    category: 'Salad',
    title: 'Salad bơ và đậu gà sốt mè rang',
    author: 'Lan Anh',
    views: '24.1K xem',
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

// ---------- Public API (existing - keep all) ----------
export async function getVideos(
  inputFilter: Partial<VideoListFilter> = {},
): Promise<VideoListResponse> {
  await delayVoid()
  const applied: VideoListFilter = { ...DEFAULT_VIDEO_FILTER, ...inputFilter }
  const items = applyFilter(IN_MEMORY_VIDEOS, applied)
  return { items, totalCount: items.length, appliedFilter: applied }
}

export async function getVideoDetail(id: string): Promise<Video | null> {
  await delayVoid(500)
  const found =
    IN_MEMORY_VIDEOS.find((v) => v.id === id) ??
    (id === 'dau-hu-sot-nam' || id === 'v_001' ? IN_MEMORY_VIDEOS[0] : null)
  if (found) {
    return {
      ...found,
      author: found.author || {
        name: found.creatorName || 'Bếp Chay An Nhiên',
        role: 'Bếp trưởng thực dưỡng',
        avatar: found.creatorAvatar,
        followers: '45.2K',
        verified: true,
      },
      comments: [
        {
          id: 'c1',
          authorName: 'Trần Thu Thủy',
          authorAvatar:
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
          authorBadge: 'Thành viên tích cực',
          createdAt: '2 giờ trước',
          content:
            'Mình vừa thử làm theo công thức của đầu bếp, sốt nấm đậm đà và đậu hũ giòn vừa tới ngon tuyệt vời ạ! Cảm ơn kênh nhiều.',
          likes: 24,
        },
        {
          id: 'c2',
          authorName: 'Bác sĩ Dinh dưỡng Hoàng Nam',
          authorAvatar:
            'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=150&q=80',
          authorBadge: 'Chuyên gia xác thực',
          createdAt: '5 giờ trước',
          content:
            'Món này cung cấp lượng đạm thực vật rất tốt từ nấm và đậu nành. Các bạn có thể thêm chút nấm hương tươi để tăng hương vị.',
          likes: 38,
        },
        {
          id: 'c3',
          authorName: 'Lê Minh Tuấn',
          authorAvatar:
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
          createdAt: '1 ngày trước',
          content:
            'Cho mình hỏi nếu không có dầu hào chay thì thay bằng gia vị gì hợp vị nhất vậy ạ?',
          likes: 7,
          replies: [
            {
              id: 'c4',
              authorName: 'Kênh Đậu Hũ An Nhiên',
              authorAvatar:
                'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80',
              authorBadge: 'Tác giả',
              createdAt: '21 giờ trước',
              content:
                'Chào bạn nhé, bạn có thể thay thế bằng tương tamari cốt nấm hoặc 1 thìa nước tương nguyên chất pha cùng xíu mật mía để tạo độ sánh và thơm tương tự nhé!',
              likes: 12,
            },
          ],
        },
      ],
    }
  }
  return null
}

export async function uploadVideo(form: UploadVideoFormState): Promise<Video> {
  await delayVoid(500)
  const aiRes = runAiModeration({ title: form.title, description: form.description })
  const category = (form.category || 'cooking-tutorial') as VideoCategory
  const durSec = Number(form.duration) || 300
  const durationStr = formatDuration(durSec)
  const thumbnail =
    form.thumbnailUrl ||
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'

  const video: Video = {
    id: `v_user_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    title: form.title.trim(),
    videoUrl: form.videoUrl.trim(),
    thumbnailUrl: thumbnail,
    duration: durationStr,
    durationSeconds: durSec,
    category,
    moderationStatus: aiRes.status,
    flagReason: aiRes.flagReason,
    aiFlagNote: aiRes.flagReason,
    author: {
      name: 'Tôi (Thành viên)',
      role: 'Người chia sẻ',
      avatar:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      followers: 12,
      verified: false,
    },
    creatorName: 'Tôi (Thành viên)',
    creatorAvatar:
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    views: '0',
    viewCount: 0,
    likes: 0,
    likeCount: 0,
    shares: 0,
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

export async function addVideoComment(
  _videoId: string,
  content: string,
  authorName = 'Bạn (Người dùng)',
): Promise<CommentItem> {
  await delayVoid(300)
  return {
    id: `c_${Date.now()}`,
    initials: 'BẠN',
    author: authorName,
    timeAgo: 'Vừa xong',
    content: content.trim(),
    likes: 0,
  }
}

// ---------- New async browse/detail wrappers ----------
export async function getVideoListBrowseHelpers(): Promise<{
  categories: typeof FIGMA_PILL_CATEGORIES
  hashtagTopics: typeof FIGMA_HASHTAG_TOPICS
  topChefs: typeof FIGMA_TOP_CHEFS
  durationOpts: SelectOption[]
  sortOpts: SelectOption[]
}> {
  await delayVoid(500)
  return {
    categories: FIGMA_PILL_CATEGORIES,
    hashtagTopics: FIGMA_HASHTAG_TOPICS,
    topChefs: FIGMA_TOP_CHEFS,
    durationOpts: DURATION_OPTIONS,
    sortOpts: SORT_OPTIONS_VIDEO_LIST,
  }
}

export async function getVideoDetailComments(_videoId: string): Promise<CommentItem[]> {
  return delay(DETAIL_COMMENTS, 500)
}

export async function getRelatedVideos(_videoId: string): Promise<RelatedVideo[]> {
  return delay(RELATED_VIDEOS, 500)
}

export async function getVideoDetailMeta(_videoId: string): Promise<{
  title: string
  creator: typeof DETAIL_CREATOR
  pills: typeof DETAIL_CATEGORY_PILLS
  actions: { key: string; label: string }[]
  description: string
}> {
  await delayVoid(500)
  return {
    title: DETAIL_TITLE,
    creator: DETAIL_CREATOR,
    pills: DETAIL_CATEGORY_PILLS,
    actions: DETAIL_ACTIONS,
    description: DETAIL_DESCRIPTION,
  }
}

export { IN_MEMORY_VIDEOS as __DEBUG_IN_MEMORY_VIDEOS__ }
