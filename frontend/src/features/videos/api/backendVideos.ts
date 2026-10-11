import { apiClient, getStoredToken } from '../../../shared/api/apiClient'

export interface VideoDetails {
  id: string
  title: string
  description: string
  categoryId: string | null
  uploadStatus: 'AwaitingUpload' | 'Processing' | 'Ready' | 'Failed'
  aiFlagStatus: string | null
  adminReviewStatus: string | null
  version: number | null
  adminReason: string | null
  mediaUrl: string | null
  thumbnailUrl: string | null
  viewCount: number
  favoriteCount: number
  createdAtUtc: string
}

interface VideoPage {
  items: VideoDetails[]
  totalCount: number
  page: number
  pageSize: number
}

export interface VideoCategoryOption {
  id: string
  name: string
}

export async function listVideos(mine = false): Promise<VideoDetails[]> {
  const items: VideoDetails[] = []
  for (let page = 1; ; page++) {
    const result = await apiClient.get<VideoPage>(
      `/api/${mine ? 'me/' : ''}videos?page=${page}&pageSize=100`,
      { requiresAuth: mine },
    )
    items.push(...result.items)
    if (items.length >= result.totalCount || result.items.length === 0) return items
  }
}

export const getPublicVideo = (id: string) =>
  apiClient.get<VideoDetails>(`/api/videos/${encodeURIComponent(id)}`, { requiresAuth: false })

export const getMyVideo = (id: string) =>
  apiClient.get<VideoDetails>(`/api/me/videos/${encodeURIComponent(id)}`)

export const createVideo = (title: string, description: string, categoryId: string | null) =>
  apiClient.post<VideoDetails>('/api/me/videos', { title, description, categoryId })

export const updateVideo = (id: string, title: string, description: string, categoryId: string | null) =>
  apiClient.put<VideoDetails>(`/api/me/videos/${encodeURIComponent(id)}`, { title, description, categoryId })

export const submitVideo = (id: string) =>
  apiClient.post(`/api/me/videos/${encodeURIComponent(id)}/submit`)

export async function uploadVideoFile(id: string, file: File, thumbnail = false): Promise<VideoDetails> {
  const data = new FormData()
  data.append('file', file)
  return apiClient.request<VideoDetails>(
    `/api/me/videos/${encodeURIComponent(id)}/${thumbnail ? 'thumbnail' : 'media'}`,
    { method: 'POST', body: data },
  )
}

export async function listVideoCategories(): Promise<VideoCategoryOption[]> {
  const response = await apiClient.get<{ items: VideoCategoryOption[] }>(
    '/api/categories?pageNumber=1&pageSize=100',
    { requiresAuth: false },
  )
  return response.items
}

export async function getPrivateMediaUrl(path: string): Promise<string> {
  const token = getStoredToken()
  const response = await fetch(path, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!response.ok) throw new Error('Không thể tải media video.')
  return URL.createObjectURL(await response.blob())
}

export const recordVideoView = (id: string) =>
  apiClient.post<void>(`/api/videos/${encodeURIComponent(id)}/views`, undefined, {
    requiresAuth: false,
    credentials: 'include',
  })
