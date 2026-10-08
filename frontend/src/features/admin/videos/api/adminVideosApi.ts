import type {
  AdminVideoFilter,
  AdminVideoItem,
  AdminVideoStats,
  VideoFormData,
} from '../types/adminVideos.types'

let MOCK_ADMIN_VIDEOS: AdminVideoItem[] = [
  {
    id: 'vid-1',
    title: 'Cách làm Đậu hũ sốt nấm thơm ngon đậm vị',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=60',
    resolution: '1080p Full HD',
    authorName: 'Nguyễn Minh Anh',
    authorInitials: 'NA',
    authorAvatarBg: 'bg-emerald-100 text-emerald-800',
    category: 'main-dish',
    categoryLabel: 'Món chính',
    publishedAt: '12/10/2026',
    duration: '08:45',
    status: 'published',
    statusLabel: 'Đang hiển thị',
    description: 'Hướng dẫn cách làm đậu hũ non sốt nấm đùi gà và nấm đông cô sốt tiêu đen đậm đà.',
  },
  {
    id: 'vid-2',
    title: 'Salad bơ rong nho sốt mè rang thanh mát',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&auto=format&fit=crop&q=60',
    resolution: '1080p Full HD',
    authorName: 'Lê Thu Hà',
    authorInitials: 'LH',
    authorAvatarBg: 'bg-teal-100 text-teal-800',
    category: 'salad',
    categoryLabel: 'Salad',
    publishedAt: '05/10/2026',
    duration: '05:20',
    status: 'published',
    statusLabel: 'Đang hiển thị',
    description: 'Món salad giải nhiệt kết hợp rong nho tươi, bơ sáp và nước sốt mè rang tự pha.',
  },
  {
    id: 'vid-3',
    title: 'Nấu canh chua chay thanh đạm chuẩn vị miền Nam',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&auto=format&fit=crop&q=60',
    resolution: '1080p Full HD',
    authorName: 'Trần Gia Huy',
    authorInitials: 'TH',
    authorAvatarBg: 'bg-emerald-100 text-emerald-800',
    category: 'soup',
    categoryLabel: 'Món nước',
    publishedAt: '28/09/2026',
    duration: '12:10',
    status: 'hidden',
    statusLabel: 'Đã ẩn / gỡ',
    description: 'Bí quyết nước dùng canh chua trong veo, ngọt thanh từ bắp ngọt và thơm chín.',
  },
  {
    id: 'vid-4',
    title: 'Sữa hạt điều mè đen giàu dưỡng chất tại nhà',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&auto=format&fit=crop&q=60',
    resolution: '1080p Full HD',
    authorName: 'Phạm Quốc Bảo',
    authorInitials: 'PB',
    authorAvatarBg: 'bg-sky-100 text-sky-800',
    category: 'drinks',
    categoryLabel: 'Đồ uống',
    publishedAt: '20/09/2026',
    duration: '06:15',
    status: 'published',
    statusLabel: 'Đang hiển thị',
    description: 'Cách làm sữa hạt thơm mịn không cần lọc bã, bổ sung canxi và khoáng chất cần thiết.',
  },
  {
    id: 'vid-5',
    title: 'Bí quyết chiên chả giò chay giòn rụm không ngấy',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=60',
    resolution: '1080p Full HD',
    authorName: 'Bùi Anh Tuấn',
    authorInitials: 'BT',
    authorAvatarBg: 'bg-emerald-100 text-emerald-800',
    category: 'cooking-tips',
    categoryLabel: 'Mẹo nấu ăn',
    publishedAt: '15/09/2026',
    duration: '04:38',
    status: 'published',
    statusLabel: 'Đang hiển thị',
    description: 'Mẹo cuốn bánh tráng không bị rách và kỹ thuật giữ độ giòn lâu đến 4 giờ.',
  },
  {
    id: 'vid-6',
    title: 'Smoothie cải kale táo xanh thanh lọc cơ thể',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=400&auto=format&fit=crop&q=60',
    resolution: '1080p Full HD',
    authorName: 'Đặng Phương Thảo',
    authorInitials: 'PT',
    authorAvatarBg: 'bg-emerald-100 text-emerald-800',
    category: 'drinks',
    categoryLabel: 'Đồ uống',
    publishedAt: '08/09/2026',
    duration: '07:12',
    status: 'published',
    statusLabel: 'Đang hiển thị',
    description: 'Công thức sinh tố xanh dễ uống, không bị ngái mùi cải xoăn, hỗ trợ đào thải độc tố.',
  },
]

export async function getAdminVideoStats(): Promise<AdminVideoStats> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return {
    totalCount: 35,
    publishedCount: 31,
    hiddenCount: 4,
  }
}

export async function getAdminVideos(filter: AdminVideoFilter = {}): Promise<{
  items: AdminVideoItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}> {
  await new Promise((resolve) => setTimeout(resolve, 500))

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
  const total = 35 // match Figma 35 videos count
  const totalPages = Math.max(6, Math.ceil(total / pageSize))
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

export async function createAdminVideo(data: VideoFormData): Promise<AdminVideoItem> {
  await new Promise((resolve) => setTimeout(resolve, 600))
  const categoryLabels: Record<string, string> = {
    'main-dish': 'Món chính',
    salad: 'Salad',
    soup: 'Món nước',
    drinks: 'Đồ uống',
    'cooking-tips': 'Mẹo nấu ăn',
  }

  const newVideo: AdminVideoItem = {
    id: `vid-${Date.now()}`,
    title: data.title,
    videoUrl: data.videoUrl,
    thumbnailUrl:
      data.thumbnailUrl ||
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=60',
    resolution: data.resolution || '1080p Full HD',
    authorName: 'Quản trị viên Admin',
    authorInitials: 'AD',
    authorAvatarBg: 'bg-[#E0E7FF] text-[#4338CA]',
    category: data.category,
    categoryLabel: categoryLabels[data.category] || 'Món chính',
    publishedAt: 'Hôm nay',
    duration: data.duration || '05:00',
    status: data.isPublished ? 'published' : 'hidden',
    statusLabel: data.isPublished ? 'Đang hiển thị' : 'Đã ẩn / gỡ',
    description: data.description,
  }

  MOCK_ADMIN_VIDEOS = [newVideo, ...MOCK_ADMIN_VIDEOS]
  return newVideo
}

export async function updateAdminVideo(id: string, data: VideoFormData): Promise<AdminVideoItem> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  const idx = MOCK_ADMIN_VIDEOS.findIndex((v) => v.id === id)
  if (idx === -1) throw new Error('Không tìm thấy video.')

  const categoryLabels: Record<string, string> = {
    'main-dish': 'Món chính',
    salad: 'Salad',
    soup: 'Món nước',
    drinks: 'Đồ uống',
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
    statusLabel: data.isPublished ? 'Đang hiển thị' : 'Đã ẩn / gỡ',
  }
  MOCK_ADMIN_VIDEOS[idx] = updated
  return updated
}

export async function toggleHideVideo(id: string): Promise<AdminVideoItem> {
  await new Promise((resolve) => setTimeout(resolve, 400))
  const target = MOCK_ADMIN_VIDEOS.find((v) => v.id === id)
  if (!target) throw new Error('Không tìm thấy video.')

  target.status = target.status === 'published' ? 'hidden' : 'published'
  target.statusLabel = target.status === 'published' ? 'Đang hiển thị' : 'Đã ẩn / gỡ'
  return { ...target }
}

export async function deleteAdminVideo(id: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  MOCK_ADMIN_VIDEOS = MOCK_ADMIN_VIDEOS.filter((v) => v.id !== id)
  return true
}
