import type {
  UserVideoItem,
  VideoFilterParams,
  PaginatedResult,
  VideoFormData,
} from '../types';

export interface HomeVideoSummary {
  id: string;
  title: string;
  duration: string;
  thumbnailUrl: string;
  channelName: string;
}

const MOCK_VIDEOS: HomeVideoSummary[] = [
  {
    id: 'v1',
    title: 'Cách làm đậu hũ sốt nấm trong 20 phút',
    duration: '20:14',
    thumbnailUrl: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Vietnamese%20tofu%20mushroom%20sauce%20cooking%20video%20thumbnail%20dark%20background&image_size=landscape_16_9',
    channelName: 'Bếp Chay 1975',
  },
  {
    id: 'v2',
    title: 'Mẫu ương rong nho và ngũ thanh bổ dưỡng',
    duration: '08:42',
    thumbnailUrl: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Sea%20grapes%20vegan%20salad%20bowl%20close%20up%20food%20video&image_size=landscape_16_9',
    channelName: 'Chay Mỗi Ngày',
  },
  {
    id: 'v3',
    title: '3 món sinh tố xanh dưỡng hỗ trợ giảm tập đề kháng',
    duration: '06:18',
    thumbnailUrl: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Three%20green%20smoothies%20in%20glasses%20bright%20minimal%20background&image_size=landscape_16_9',
    channelName: 'Green Boost',
  },
  {
    id: 'v4',
    title: 'Salad bơ đậu gà cho bữa trưa văn phòng',
    duration: '12:30',
    thumbnailUrl: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Avocado%20chickpea%20salad%20video%20cooking%20thumbnail&image_size=landscape_16_9',
    channelName: 'Bếp Sạch',
  },
];

export async function fetchVideos(): Promise<HomeVideoSummary[]> {
  try {
    const res = await fetch('/api/videos', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // fallthrough to mock
  }
  await new Promise(resolve => setTimeout(resolve, 500));
  return MOCK_VIDEOS;
}

export const VIDEO_CATEGORIES = [
  { id: 'all', label: 'Tất cả danh mục' },
  { id: 'main', label: 'Món chính' },
  { id: 'salad', label: 'Khai vị & Salad' },
  { id: 'drink', label: 'Đồ uống & Detox' },
  { id: 'soup', label: 'Món nước & Súp' },
  { id: 'dessert', label: 'Tráng miệng & Ăn vặt' },
  { id: 'tips', label: 'Mẹo nhà bếp' },
  { id: 'meal-plans', label: 'Kế hoạch dinh dưỡng' },
];

/**
 * Mock database for User Videos (8 items owned by user Văn Quang Duy)
 */
let MOCK_USER_VIDEOS: UserVideoItem[] = [
  {
    id: 'vid-1',
    title: 'Cách làm đậu hũ sốt nấm đông cô đậm đà trong 20 phút',
    description:
      'Bí quyết áp chảo đậu hũ vàng giòn không bị nát và sốt nấm đông cô ngào đường nâu cùng nước tương đậm đà vị umami tự nhiên.',
    category: 'main',
    categoryLabel: 'Món chính',
    duration: '18:24',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    status: 'published',
    statusLabel: 'Đã xuất bản',
    publishedAt: '12/08/2026',
    updatedAt: '12/08/2026',
    viewsCount: 3420,
    likesCount: 215,
    commentsCount: 38,
    aiFlagStatus: 'Passed',
  },
  {
    id: 'vid-2',
    title: 'Salad bơ đậu gà sốt mè rang tươi mát cho bữa trưa văn phòng',
    description:
      'Bữa trưa nhanh gọn, giàu đạm thực vật từ đậu gà luộc chín tới, bơ chín béo bùi và sốt mè rang tự làm, giúp nạp đầy năng lượng làm việc.',
    category: 'salad',
    categoryLabel: 'Khai vị & Salad',
    duration: '12:40',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80',
    status: 'published',
    statusLabel: 'Đã xuất bản',
    publishedAt: '05/08/2026',
    updatedAt: '05/08/2026',
    viewsCount: 2180,
    likesCount: 142,
    commentsCount: 24,
    aiFlagStatus: 'Passed',
  },
  {
    id: 'vid-3',
    title: '3 công thức sinh tố xanh (Green Smoothie) thanh lọc và tăng đề kháng',
    description:
      'Sự kết hợp giữa cải kale, chuối tây, táo xanh và hạt chia giúp bổ sung chất xơ và vi chất dồi dào cho buổi sáng tràn đầy năng lượng tươi mới.',
    category: 'drink',
    categoryLabel: 'Đồ uống & Detox',
    duration: '08:15',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1610970881699-44a5587cabec?auto=format&fit=crop&w=600&q=80',
    status: 'published',
    statusLabel: 'Đã xuất bản',
    publishedAt: '28/07/2026',
    updatedAt: '28/07/2026',
    viewsCount: 4890,
    likesCount: 310,
    commentsCount: 56,
    aiFlagStatus: 'Passed',
  },
  {
    id: 'vid-4',
    title: 'Nấu nước dùng phở chay ngọt thanh tự nhiên từ mía lau và củ cải',
    description:
      'Bí quyết nướng hành baro, thảo quả và hoa hồi để có nồi nước phở thơm nức mũi mà không cần dùng đến gia vị đóng gói hay hạt nêm công nghiệp.',
    category: 'soup',
    categoryLabel: 'Món nước & Súp',
    duration: '22:50',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1547496502-affa22d38842?auto=format&fit=crop&w=600&q=80',
    status: 'published',
    statusLabel: 'Đã xuất bản',
    publishedAt: '19/07/2026',
    updatedAt: '19/07/2026',
    viewsCount: 6750,
    likesCount: 520,
    commentsCount: 89,
    aiFlagStatus: 'Passed',
  },
  {
    id: 'vid-5',
    title: 'Bí quyết bảo quản rau củ tươi ngon suốt 2 tuần trong ngăn mát',
    description:
      'Kỹ thuật lau khô, bọc giấy nến và phân loại rau lá xanh, củ quả giúp tủ lạnh luôn ngăn nắp và thực phẩm giữ trọn độ giòn mọng, không bị dập úa.',
    category: 'tips',
    categoryLabel: 'Mẹo nhà bếp',
    duration: '10:05',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80',
    status: 'published',
    statusLabel: 'Đã xuất bản',
    publishedAt: '10/07/2026',
    updatedAt: '10/07/2026',
    viewsCount: 1940,
    likesCount: 167,
    commentsCount: 19,
    aiFlagStatus: 'Passed',
  },
  {
    id: 'vid-6',
    title: 'Bánh chuối nướng yến mạch cốt dừa thuần chay không đường tinh luyện',
    description:
      'Món bánh healthy mềm ẩm, thơm lừng mùi chuối sứ chín rục và nước cốt dừa béo nhẹ, hoàn toàn phù hợp cho người ăn chay thuần và tập luyện thể thao.',
    category: 'dessert',
    categoryLabel: 'Tráng miệng & Ăn vặt',
    duration: '14:30',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
    status: 'published',
    statusLabel: 'Đã xuất bản',
    publishedAt: '02/07/2026',
    updatedAt: '02/07/2026',
    viewsCount: 3110,
    likesCount: 245,
    commentsCount: 42,
    aiFlagStatus: 'Passed',
  },
  {
    id: 'vid-7',
    title: 'Tự làm chả lụa chay từ váng đậu (tàu hũ ky) dai giòn không hàn the',
    description:
      'Công thức gói chả lụa lá chuối truyền thống kết hợp tiêu sọ đập dập, đang được hệ thống kiểm duyệt AI và Admin thẩm định chất lượng.',
    category: 'main',
    categoryLabel: 'Món chính',
    duration: '16:45',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
    status: 'pending',
    statusLabel: 'Đang kiểm duyệt',
    submittedAt: '08/10/2026',
    updatedAt: '08/10/2026',
    viewsCount: 0,
    likesCount: 0,
    commentsCount: 0,
    aiFlagStatus: 'Passed',
    adminNote: 'AI đã kiểm duyệt nội dung hợp lệ (Passed). Đang chờ Admin phê duyệt trước khi công khai lên thư viện.',
  },
  {
    id: 'vid-8',
    title: 'Thực đơn Eat Clean chay 7 ngày chuẩn bị trước (Meal Prep) cho người bận rộn',
    description:
      'Đang lưu nháp: Các bước sơ chế nguyên liệu cuối tuần, đóng hộp thủy tinh chân không để cả tuần đi làm đều có bữa ăn dinh dưỡng đầy đủ vi chất.',
    category: 'meal-plans',
    categoryLabel: 'Kế hoạch dinh dưỡng',
    duration: '25:10',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=600&q=80',
    status: 'draft',
    statusLabel: 'Bản nháp',
    completionRate: 75,
    updatedAt: '09/10/2026',
    viewsCount: 0,
    likesCount: 0,
    commentsCount: 0,
    aiFlagStatus: 'NotSubmitted',
  },
];

/**
 * Helper to parse mm:ss into total seconds for sorting
 */
function parseDurationToSeconds(duration: string): number {
  const parts = duration.split(':').map((p) => parseInt(p, 10) || 0);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

/**
 * Fetch paginated user videos with tabs, search, category, and sorting
 */
export async function getUserVideos(
  params: VideoFilterParams = {}
): Promise<PaginatedResult<UserVideoItem>> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  let list = [...MOCK_USER_VIDEOS];

  // 1. Status Tab filter
  if (params.statusTab && params.statusTab !== 'all') {
    list = list.filter((v) => v.status === params.statusTab);
  }

  // 2. Category filter
  if (params.category && params.category !== 'all') {
    list = list.filter((v) => v.category === params.category);
  }

  // 3. Keyword filter
  if (params.keyword?.trim()) {
    const q = params.keyword.toLowerCase().trim();
    list = list.filter(
      (v) =>
        v.title.toLowerCase().includes(q) ||
        v.description.toLowerCase().includes(q) ||
        v.categoryLabel.toLowerCase().includes(q)
    );
  }

  // 4. Sort
  if (params.sortBy === 'views') {
    list.sort((a, b) => b.viewsCount - a.viewsCount);
  } else if (params.sortBy === 'duration') {
    list.sort(
      (a, b) => parseDurationToSeconds(b.duration) - parseDurationToSeconds(a.duration)
    );
  }

  // 5. Pagination
  const page = params.page || 1;
  const pageSize = params.pageSize || 4;
  const totalCount = list.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const startIndex = (page - 1) * pageSize;
  const items = list.slice(startIndex, startIndex + pageSize);

  return {
    items,
    totalCount,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Delete a user video
 */
export async function deleteUserVideo(id: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const initialLength = MOCK_USER_VIDEOS.length;
  MOCK_USER_VIDEOS = MOCK_USER_VIDEOS.filter((v) => v.id !== id);
  return MOCK_USER_VIDEOS.length < initialLength;
}

/**
 * Update a user video
 */
export async function updateUserVideo(
  id: string,
  data: Partial<VideoFormData>
): Promise<UserVideoItem> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const index = MOCK_USER_VIDEOS.findIndex((v) => v.id === id);
  if (index === -1) {
    throw new Error('Video không tồn tại');
  }

  const current = MOCK_USER_VIDEOS[index];
  const catObj = VIDEO_CATEGORIES.find((c) => c.id === data.category);

  const updated: UserVideoItem = {
    ...current,
    title: data.title ?? current.title,
    description: data.description ?? current.description,
    category: data.category ?? current.category,
    categoryLabel: catObj?.label ?? current.categoryLabel,
    duration: data.duration ?? current.duration,
    thumbnailUrl: data.thumbnailUrl ?? current.thumbnailUrl,
    updatedAt: 'Hôm nay',
  };

  MOCK_USER_VIDEOS[index] = updated;
  return updated;
}

/**
 * Create a new user video
 */
export async function createUserVideo(
  data: VideoFormData
): Promise<UserVideoItem> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const catObj = VIDEO_CATEGORIES.find((c) => c.id === data.category);
  const isDraft = data.status === 'draft';

  const newVideo: UserVideoItem = {
    id: `vid-${Date.now()}`,
    title: data.title,
    description: data.description,
    category: data.category,
    categoryLabel: catObj?.label || 'Món chay',
    duration: data.duration || '10:00',
    thumbnailUrl:
      data.thumbnailUrl ||
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
    status: isDraft ? 'draft' : 'pending',
    statusLabel: isDraft ? 'Bản nháp' : 'Đang kiểm duyệt',
    updatedAt: 'Hôm nay',
    submittedAt: isDraft ? undefined : 'Hôm nay',
    viewsCount: 0,
    likesCount: 0,
    commentsCount: 0,
    completionRate: isDraft ? 60 : undefined,
    aiFlagStatus: isDraft ? 'NotSubmitted' : 'Checking',
  };

  MOCK_USER_VIDEOS.unshift(newVideo);
  return newVideo;
}

/**
 * Submit a draft video to moderation queue
 */
export async function submitUserVideo(id: string): Promise<UserVideoItem> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const index = MOCK_USER_VIDEOS.findIndex((v) => v.id === id);
  if (index === -1) {
    throw new Error('Video không tồn tại');
  }

  MOCK_USER_VIDEOS[index] = {
    ...MOCK_USER_VIDEOS[index],
    status: 'pending',
    statusLabel: 'Đang kiểm duyệt',
    submittedAt: 'Hôm nay',
    aiFlagStatus: 'Checking',
  };

  return MOCK_USER_VIDEOS[index];
}