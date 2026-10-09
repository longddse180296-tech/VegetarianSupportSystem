import type {
  AdminVideoFilter,
  AdminVideoItem,
  AdminVideoStats,
  VideoFormData,
} from '../types/adminVideos.types'

let MOCK_ADMIN_VIDEOS: AdminVideoItem[] = [
  {
    id: 'vid-1',
    title: 'Đậu hũ sốt nấm hương đậm đà thơm ngọt đưa cơm',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
    resolution: '1080p FHD',
    authorName: 'Trần Gia Huy',
    authorInitials: 'GH',
    authorAvatarBg: 'bg-emerald-100 text-[#1b5e20]',
    category: 'main',
    categoryLabel: 'Món chính',
    publishedAt: '12/10/2026',
    duration: '08:45',
    status: 'published',
    statusLabel: 'Đang hiển thị',
    description: 'Hướng dẫn cách ướp đậu hũ chiên vàng giòn và làm nước sốt nấm hương sánh quyện.',
  },
  {
    id: 'vid-2',
    title: 'Gỏi cuốn nấm ngũ sắc sốt tương béo ngậy thanh mát',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80',
    resolution: '4K UltraHD',
    authorName: 'Nguyễn Minh Anh',
    authorInitials: 'MA',
    authorAvatarBg: 'bg-emerald-100 text-[#1b5e20]',
    category: 'appetizer',
    categoryLabel: 'Món khai vị',
    publishedAt: '05/10/2026',
    duration: '05:20',
    status: 'published',
    statusLabel: 'Đang hiển thị',
    description: 'Món gỏi cuốn thanh lọc cơ thể với bún gạo lứt, dưa leo, cà rốt và nấm bào ngư xào.',
  },
  {
    id: 'vid-3',
    title: 'Nấu canh rong biển hạt sen giải nhiệt mùa hè thanh lọc cơ thể',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=400&q=80',
    resolution: '1080p FHD',
    authorName: 'Phạm Quốc Bảo',
    authorInitials: 'PB',
    authorAvatarBg: 'bg-amber-100 text-amber-800',
    category: 'soup',
    categoryLabel: 'Món canh & súp',
    publishedAt: 'Hôm nay',
    duration: '10:15',
    status: 'pending',
    statusLabel: 'Chờ kiểm duyệt',
    description: 'Cách khử tanh rong biển và hầm hạt sen bùi béo kết hợp nấm rơm.',
  },
  {
    id: 'vid-4',
    title: 'Cách làm sốt tương mè rang đa năng tại nhà cho món chay',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=400&q=80',
    resolution: '720p HD',
    authorName: 'Lê Thu Hà',
    authorInitials: 'TH',
    authorAvatarBg: 'bg-emerald-100 text-[#1b5e20]',
    category: 'cooking-tips',
    categoryLabel: 'Mẹo nấu ăn',
    publishedAt: '26/09/2026',
    duration: '04:35',
    status: 'published',
    statusLabel: 'Đang hiển thị',
    description: 'Công thức nước chấm mè rang sánh mịn, thơm bùi chấm rau luộc hoặc gỏi cuốn.',
  },
  {
    id: 'vid-5',
    title: 'Bí quyết nấu nước dùng phở bò chay từ rau củ quả ngọt tự nhiên',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=400&q=80',
    resolution: '1080p FHD',
    authorName: 'Bùi Anh Tuấn',
    authorInitials: 'BT',
    authorAvatarBg: 'bg-rose-100 text-rose-800',
    category: 'soup',
    categoryLabel: 'Món canh & súp',
    publishedAt: '15/09/2026',
    duration: '12:40',
    status: 'hidden',
    statusLabel: 'Đã tạm ẩn',
    description: 'Hầm củ cải, lê, bắp ngọt và hồi quế để tạo vị ngọt thanh không cần mì chính.',
  },
]

export async function getAdminVideoStats(): Promise<AdminVideoStats> {
  // Simulate 1.5s network latency per directive
  await new Promise((resolve) => setTimeout(resolve, 1500))
  return {
    totalCount: MOCK_ADMIN_VIDEOS.length,
    publishedCount: MOCK_ADMIN_VIDEOS.filter((v) => v.status === 'published').length,
    pendingCount: MOCK_ADMIN_VIDEOS.filter((v) => v.status === 'pending').length,
    hiddenCount: MOCK_ADMIN_VIDEOS.filter((v) => v.status === 'hidden').length,
  }
}

export async function getAdminVideos(filter: AdminVideoFilter = {}): Promise<{
  items: AdminVideoItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}> {
  // Simulate 1.5s network latency per directive
  await new Promise((resolve) => setTimeout(resolve, 1500))

  let list = [...MOCK_ADMIN_VIDEOS]

  if (filter.status && filter.status !== 'all') {
    list = list.filter((v) => v.status === filter.status)
  }

  if (filter.category && filter.category !== 'all') {
    list = list.filter((v) => v.category === filter.category)
  }

  if (filter.keyword?.trim()) {
    const q = filter.keyword.toLowerCase().trim()
    list = list.filter(
      (v) =>
        v.title.toLowerCase().includes(q) ||
        v.authorName.toLowerCase().includes(q) ||
        v.categoryLabel.toLowerCase().includes(q)
    )
  }

  const page = filter.page || 1
  const pageSize = filter.pageSize || 6
  const total = list.length
  const totalPages = Math.ceil(total / pageSize) || 1
  const startIndex = (page - 1) * pageSize
  const items = list.slice(startIndex, startIndex + pageSize)

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
  }
}

export async function approveVideo(id: string): Promise<AdminVideoItem> {
  // Simulate 1.5s network latency per directive
  await new Promise((resolve) => setTimeout(resolve, 1500))

  const target = MOCK_ADMIN_VIDEOS.find((v) => v.id === id)
  if (!target) throw new Error('Không tìm thấy video.')

  target.status = 'published'
  target.statusLabel = 'Đang hiển thị'
  return { ...target }
}

export async function rejectVideo(id: string, reason: string): Promise<AdminVideoItem> {
  // Simulate 1.5s network latency per directive
  await new Promise((resolve) => setTimeout(resolve, 1500))

  const target = MOCK_ADMIN_VIDEOS.find((v) => v.id === id)
  if (!target) throw new Error('Không tìm thấy video.')

  target.status = 'hidden'
  target.statusLabel = 'Bị từ chối'
  target.rejectReason = reason
  return { ...target }
}

export async function createAdminVideo(data: VideoFormData): Promise<AdminVideoItem> {
  // Simulate 1.5s network latency per directive
  await new Promise((resolve) => setTimeout(resolve, 1500))

  const categoryLabels: Record<string, string> = {
    main: 'Món chính',
    appetizer: 'Món khai vị',
    soup: 'Món canh & súp',
    dessert: 'Món tráng miệng',
    'cooking-tips': 'Mẹo nấu ăn',
  }

  const newVid: AdminVideoItem = {
    id: `vid-${Date.now()}`,
    title: data.title,
    videoUrl: data.videoUrl,
    thumbnailUrl: data.thumbnailUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
    resolution: data.resolution || '1080p FHD',
    authorName: 'Quản trị viên Admin',
    authorInitials: 'AD',
    authorAvatarBg: 'bg-emerald-100 text-[#1b5e20]',
    category: data.category,
    categoryLabel: categoryLabels[data.category] || 'Món chay',
    publishedAt: 'Hôm nay',
    duration: data.duration || '08:00',
    status: data.isPublished ? 'published' : 'hidden',
    statusLabel: data.isPublished ? 'Đang hiển thị' : 'Đã tạm ẩn',
    description: data.description,
  }

  MOCK_ADMIN_VIDEOS = [newVid, ...MOCK_ADMIN_VIDEOS]
  return newVid
}

export async function updateAdminVideo(
  id: string,
  data: VideoFormData
): Promise<AdminVideoItem> {
  // Simulate 1.5s network latency per directive
  await new Promise((resolve) => setTimeout(resolve, 1500))

  const idx = MOCK_ADMIN_VIDEOS.findIndex((v) => v.id === id)
  if (idx === -1) throw new Error('Không tìm thấy video.')

  const categoryLabels: Record<string, string> = {
    main: 'Món chính',
    appetizer: 'Món khai vị',
    soup: 'Món canh & súp',
    dessert: 'Món tráng miệng',
    'cooking-tips': 'Mẹo nấu ăn',
  }

  const updated: AdminVideoItem = {
    ...MOCK_ADMIN_VIDEOS[idx],
    title: data.title,
    videoUrl: data.videoUrl,
    thumbnailUrl: data.thumbnailUrl || MOCK_ADMIN_VIDEOS[idx].thumbnailUrl,
    category: data.category,
    categoryLabel: categoryLabels[data.category] || MOCK_ADMIN_VIDEOS[idx].categoryLabel,
    duration: data.duration,
    resolution: data.resolution,
    description: data.description,
    status: data.isPublished ? 'published' : 'hidden',
    statusLabel: data.isPublished ? 'Đang hiển thị' : 'Đã tạm ẩn',
  }

  MOCK_ADMIN_VIDEOS[idx] = updated
  return updated
}

export async function toggleHideVideo(id: string): Promise<AdminVideoItem> {
  // Simulate 1.5s network latency per directive
  await new Promise((resolve) => setTimeout(resolve, 1500))

  const target = MOCK_ADMIN_VIDEOS.find((v) => v.id === id)
  if (!target) throw new Error('Không tìm thấy video.')

  if (target.status === 'published') {
    target.status = 'hidden'
    target.statusLabel = 'Đã tạm ẩn'
  } else {
    target.status = 'published'
    target.statusLabel = 'Đang hiển thị'
  }
  return { ...target }
}

export async function deleteAdminVideo(id: string): Promise<boolean> {
  // Simulate 1.5s network latency per directive
  await new Promise((resolve) => setTimeout(resolve, 1500))

  MOCK_ADMIN_VIDEOS = MOCK_ADMIN_VIDEOS.filter((v) => v.id !== id)
  return true
}

export const adminVideosApi = {
  list: getAdminVideos,
  getStats: getAdminVideoStats,
  approve: approveVideo,
  reject: rejectVideo,
  create: createAdminVideo,
  update: updateAdminVideo,
  toggleHide: toggleHideVideo,
  remove: deleteAdminVideo,
}
