import { apiClient, getStoredToken, ApiError } from '../../../shared/api/apiClient'
import type { FavoriteItem, FavoritePage } from '../../favorites/api/favoritesApi'
import type { SelectOption } from '../../../shared/components'
import type {
  UploadVideoFormState,
  Video,
  VideoItem,
  VideoListFilter,
  VideoListResponse,
  VideoSortOption,
} from '../types/video.types'
import { DEFAULT_VIDEO_FILTER } from '../types/video.types'
import { inferVideoDietType } from './backendVideos'

interface BackendVideoDetails {
  id: string
  title: string
  description: string
  categoryId: string | null
  uploadStatus: string
  aiFlagStatus: string | null
  adminReviewStatus: string | null
  version: number | null
  aiSummary: string | null
  aiUncheckedScope: string | null
  adminReason: string | null
  mediaUrl: string | null
  thumbnailUrl: string | null
  viewCount: number
  favoriteCount: number
  createdAtUtc: string
  dietType?: string | null
}

interface BackendVideoPage {
  items: BackendVideoDetails[]
  totalCount: number
  page: number
  pageSize: number
}

function mapBackendVideo(d: BackendVideoDetails): Video {
  return {
    id: d.id,
    title: d.title,
    description: d.description,
    category: 'cooking-tutorial',
    dietType: d.dietType || inferVideoDietType(d.title, d.description),
    videoUrl: d.mediaUrl || `/api/videos/${d.id}/media`,
    thumbnailUrl:
      d.thumbnailUrl ||
      `/api/videos/${d.id}/thumbnail` ||
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    duration: '15:00',
    durationSeconds: 900,
    views: String(d.viewCount),
    viewCount: d.viewCount,
    author: {
      name: 'Thành viên Bếp Chay',
      role: 'Đầu bếp',
      avatar:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      followers: '1.2K',
      verified: true,
    },
    creatorName: 'Thành viên Bếp Chay',
    creatorAvatar:
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    createdAt: d.createdAtUtc ? d.createdAtUtc.slice(0, 10) : new Date().toISOString().slice(0, 10),
    likes: d.favoriteCount,
    likeCount: d.favoriteCount,
    shares: 0,
    moderationStatus:
      d.adminReviewStatus === 'Published'
        ? 'approved'
        : d.adminReviewStatus === 'Rejected'
        ? 'rejected'
        : d.adminReviewStatus === 'PendingAdminReview'
        ? 'pending_admin'
        : 'pending_ai',
    aiFlagNote: d.aiSummary || undefined,
    adminNote: d.adminReason || undefined,
    tags: d.title
      ? d.title
          .trim()
          .split(/\s+/)
          .filter((w) => w.length > 1)
          .slice(0, 4)
      : ['món chay', 'hướng dẫn'],
  }
}

// ---------- VideoList filter pills ----------
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
export const MOCK_VIDEOS: Video[] = [
  {
    id: 'vid-1',
    title: 'Salad bơ đậu gà sốt mè rang tươi mát cho bữa trưa',
    description:
      'Món salad thanh đạm với sốt mè rang thơm béo, đậu gà bùi bùi giàu protein và xà lách tươi giòn.',
    category: 'cooking-tutorial',
    dietType: 'Thuần chay (Vegan)',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    duration: '12:30',
    durationSeconds: 750,
    views: '1.5K',
    viewCount: 1540,
    author: {
      name: 'Bếp Chay Tuệ Đức',
      role: 'Đầu bếp chay',
      avatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    },
    creatorName: 'Bếp Chay Tuệ Đức',
    creatorAvatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    createdAt: '2026-03-10',
    likes: 120,
    likeCount: 120,
    shares: 24,
    moderationStatus: 'approved',
    tags: ['salad', 'đậu gà', 'sốt mè', 'thuần chay'],
  },
  {
    id: 'vid-2',
    title: 'Cà ri rau củ phô mai Paneer béo ngậy chuẩn vị Ấn',
    description:
      'Công thức cà ri rau củ kết hợp phô mai tươi Paneer béo ngậy, thảo mộc thơm lừng cho bữa tối ấm cúng.',
    category: 'cooking-tutorial',
    dietType: 'Ăn chay có sữa (Lacto)',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80',
    duration: '18:45',
    durationSeconds: 1125,
    views: '2.1K',
    viewCount: 2100,
    author: {
      name: 'Minh An Chay',
      role: 'Chuyên gia dinh dưỡng',
      avatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    },
    creatorName: 'Minh An Chay',
    creatorAvatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    createdAt: '2026-03-12',
    likes: 185,
    likeCount: 185,
    shares: 31,
    moderationStatus: 'approved',
    tags: ['cà ri', 'paneer', 'phô mai', 'lacto'],
  },
  {
    id: 'vid-3',
    title: 'Cơm chiên hạt sen trứng vàng ươm tơi xốp thơm ngậy',
    description:
      'Cách làm cơm chiên chay kết hợp hạt sen tươi bùi bùi và trứng gà đánh tơi vàng ruộm chuẩn vị.',
    category: 'cooking-tutorial',
    dietType: 'Chay có trứng (Ovo)',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80',
    duration: '14:20',
    durationSeconds: 860,
    views: '3.4K',
    viewCount: 3400,
    author: {
      name: 'Cô Ba Nấu Chay',
      role: 'Bếp gia đình',
      avatar:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    },
    creatorName: 'Cô Ba Nấu Chay',
    creatorAvatar:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    createdAt: '2026-03-14',
    likes: 240,
    likeCount: 240,
    shares: 45,
    moderationStatus: 'approved',
    tags: ['cơm chiên', 'hạt sen', 'trứng', 'ovo'],
  },
  {
    id: 'vid-4',
    title: 'Bánh mì sandwich bơ trứng phô mai nướng giòn rụm',
    description:
      'Bữa sáng đầy đủ năng lượng với sandwich bơ nướng phô mai tan chảy và trứng ốp la béo ngậy.',
    category: 'quick-recipe',
    dietType: 'Trứng & Sữa (Lacto-ovo)',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
    duration: '10:15',
    durationSeconds: 615,
    views: '4.2K',
    viewCount: 4200,
    author: {
      name: 'Bếp Chay Tuệ Đức',
      role: 'Đầu bếp chay',
      avatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    },
    creatorName: 'Bếp Chay Tuệ Đức',
    creatorAvatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    createdAt: '2026-03-15',
    likes: 310,
    likeCount: 310,
    shares: 60,
    moderationStatus: 'approved',
    tags: ['sandwich', 'phô mai', 'trứng', 'lacto-ovo'],
  },
]

export async function getVideos(
  inputFilter: Partial<VideoListFilter> = {},
): Promise<VideoListResponse> {
  const applied: VideoListFilter = { ...DEFAULT_VIDEO_FILTER, ...inputFilter }

  try {
    const res = await apiClient.get<BackendVideoPage>('/api/videos?page=1&pageSize=50', {
      requiresAuth: false,
    })
    if (res && Array.isArray(res.items) && res.items.length > 0) {
      const mapped = res.items.map(mapBackendVideo)
      const items = applyFilter(mapped, applied)
      return {
        items,
        totalCount: res.totalCount ?? items.length,
        appliedFilter: applied,
      }
    }
  } catch {
    // API error
  }

  const fallbackItems = applyFilter(MOCK_VIDEOS, applied)
  return { items: fallbackItems, totalCount: fallbackItems.length, appliedFilter: applied }
}

export async function getVideoDetail(id: string): Promise<Video | null> {
  try {
    const res = await apiClient.get<BackendVideoDetails>(`/api/videos/${id}`, {
      requiresAuth: false,
    })
    if (res && res.id) {
      return mapBackendVideo(res)
    }
  } catch {
    // Not found
  }

  return MOCK_VIDEOS.find((v) => v.id === id) ?? null
}

export async function uploadVideo(form: UploadVideoFormState): Promise<Video> {
  const token = getStoredToken()
  if (token) {
    const created = await apiClient.post<BackendVideoDetails>('/api/me/videos', {
      title: form.title.trim(),
      description: form.description.trim(),
      categoryId: null,
    })

    if (created && created.id) {
      await apiClient.post(`/api/me/videos/${created.id}/submit`).catch(() => {})
      return mapBackendVideo(created)
    }
  }

  throw new Error('Vui lòng đăng nhập để đăng tải video.')
}

export async function addVideoComment(
  videoId: string,
  content: string,
  authorName = 'Bạn (Người dùng)',
): Promise<CommentItem> {
  const comment = await createVideoComment(videoId, content.trim())
  return { ...comment, author: authorName }
}

export async function getVideoListBrowseHelpers(): Promise<{
  categories: typeof FIGMA_PILL_CATEGORIES
  hashtagTopics: typeof FIGMA_HASHTAG_TOPICS
  topChefs: { id: string; name: string; role: string; videos: number; avatarSeed: string }[]
  durationOpts: SelectOption[]
  sortOpts: SelectOption[]
}> {
  return {
    categories: FIGMA_PILL_CATEGORIES,
    hashtagTopics: FIGMA_HASHTAG_TOPICS,
    topChefs: [
      { id: 'c1', name: 'Bếp Chay Tuệ Đức', role: 'Bếp trưởng món chay', videos: 18, avatarSeed: 'asian chef portrait friendly smiling kitchen' },
      { id: 'c2', name: 'Minh An Chay', role: 'Chuyên gia dinh dưỡng thuần chay', videos: 12, avatarSeed: 'vietnamese female chef culinary apron' },
      { id: 'c3', name: 'Cô Ba Nấu Chay', role: 'Ẩm thực gia đình miền Tây', videos: 9, avatarSeed: 'warm elderly vietnamese woman smiling kitchen' },
    ],
    durationOpts: DURATION_OPTIONS,
    sortOpts: SORT_OPTIONS_VIDEO_LIST,
  }
}

export async function getVideoDetailComments(videoId: string): Promise<CommentItem[]> {
  const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(videoId)
  if (isGuid) {
    try {
      const res = await apiClient.get<{
        items: Array<{
          id: string
          authorId: string
          body: string | null
          createdAt: string
          likeCount: number
        }>
      }>(`/api/comments?targetType=2&targetId=${videoId}&page=1&pageSize=50`, {
        requiresAuth: false,
      })

      if (res?.items && Array.isArray(res.items)) {
        return res.items.map((c) => ({
          id: c.id,
          initials: 'TV',
          author: 'Thành viên',
          timeAgo: new Date(c.createdAt).toLocaleDateString('vi-VN'),
          content: c.body || '',
          likes: c.likeCount,
        }))
      }
    } catch {
      // API error
    }
  }

  return []
}

export async function getRelatedVideos(_videoId: string): Promise<RelatedVideo[]> {
  try {
    const res = await apiClient.get<BackendVideoPage>('/api/videos?page=1&pageSize=4', {
      requiresAuth: false,
    })
    if (res?.items && Array.isArray(res.items)) {
      return res.items
        .filter((v) => v.id !== _videoId)
        .slice(0, 3)
        .map((v) => ({
          id: v.id,
          thumbnailSeed: v.title,
          duration: '15:00',
          category: 'Món chay',
          title: v.title,
          author: 'Bếp Chay An Nhiên',
          views: `${v.viewCount} xem`,
        }))
    }
  } catch {
    // API error
  }
  return []
}

export async function getVideoDetailMeta(videoId: string): Promise<{
  title: string
  creator: { initials: string; name: string; verified: boolean; subscribers: number; postedAgo: string }
  pills: { label: string; tone: 'green' | 'blue' | 'neutral' }[]
  actions: { key: string; label: string }[]
  description: string
} | null> {
  const v = await getVideoDetail(videoId)
  if (!v) return null

  return {
    title: v.title,
    creator: {
      initials: 'BC',
      name: v.creatorName,
      verified: true,
      subscribers: 120,
      postedAgo: v.createdAt,
    },
    pills: [
      { label: 'Món chính chay', tone: 'green' },
      { label: 'Thuần thực vật', tone: 'neutral' },
    ],
    actions: [
      { key: 'like', label: `${v.likeCount} Thích` },
      { key: 'share', label: 'Chia sẻ' },
      { key: 'save', label: 'Lưu video' },
    ],
    description: v.description,
  }
}

export async function toggleVideoLike(
  videoId: string,
  nextLiked: boolean,
): Promise<{ count: number; reactedByMe: boolean }> {
  requireAuthenticatedTarget(videoId)
  const endpoint = `/api/videos/${encodeURIComponent(videoId)}/like`
  return nextLiked ? apiClient.put(endpoint) : apiClient.delete(endpoint)
}

function requireAuthenticatedTarget(id: string): void {
  if (!getStoredToken()) throw new Error('Vui lòng đăng nhập để thực hiện thao tác này.')
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    throw new Error('Nội dung không có ID hợp lệ.')
  }
}

export async function getSavedVideo(videoId: string): Promise<FavoriteItem | null> {
  requireAuthenticatedTarget(videoId)
  for (let pageNumber = 1; ; pageNumber++) {
    const page = await apiClient.get<FavoritePage>(
      `/api/favorites?targetType=Video&pageNumber=${pageNumber}&pageSize=100`,
    )
    const saved = page.items.find((item) => item.targetId.toLowerCase() === videoId.toLowerCase())
    if (saved) return saved
    if (page.items.length === 0 || pageNumber * page.pageSize >= page.totalCount) return null
  }
}

export async function toggleVideoSave(
  videoId: string,
  nextSaved: boolean,
): Promise<boolean> {
  requireAuthenticatedTarget(videoId)
  if (nextSaved) {
    try {
      await apiClient.post('/api/favorites', { targetType: 'Video', targetId: videoId })
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 409 && await getSavedVideo(videoId))) throw error
    }
    return true
  }
  const saved = await getSavedVideo(videoId)
  if (saved) await apiClient.delete(`/api/favorites/${encodeURIComponent(saved.id)}`)
  return false
}

export async function toggleCommentLike(
  commentId: string,
  nextLiked: boolean,
): Promise<{ count: number; reactedByMe: boolean }> {
  requireAuthenticatedTarget(commentId)
  const endpoint = `/api/comments/${encodeURIComponent(commentId)}/like`
  return nextLiked ? apiClient.put(endpoint) : apiClient.delete(endpoint)
}

export async function createVideoComment(
  videoId: string,
  body: string,
  parentId?: string,
): Promise<CommentItem> {
  requireAuthenticatedTarget(videoId)
  const res = await apiClient.post<{ id: string; createdAt: string; likeCount: number }>(
        '/api/comments',
        {
          targetType: 'Video',
          targetId: videoId,
          parentId: parentId || null,
          body,
        },
      )
  if (!res?.id) throw new Error('Máy chủ không trả về bình luận đã lưu hợp lệ.')
  return {
        id: res.id,
        initials: 'BẠN',
        author: 'Bạn (Thành viên)',
        badges: [{ label: 'Thành viên tích cực', tone: 'member' }],
        timeAgo: 'Vừa xong',
        content: body,
        likes: res.likeCount ?? 0,
        replyToId: parentId,
      }
}
