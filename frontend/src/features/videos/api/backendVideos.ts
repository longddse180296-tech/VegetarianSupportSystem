import { apiClient, getStoredToken } from '../../../shared/api/apiClient'
import type { CoreDietType } from '../types/video.types'

export function inferVideoDietType(title?: string, description?: string): CoreDietType {
  const lower = `${title ?? ''} ${description ?? ''}`.toLowerCase()
  if (
    /(trứng)/.test(lower) &&
    /(sữa|phô mai|bơ)/.test(lower) &&
    !/(sữa hạt|sữa đậu|bơ đậu phộng|bơ thực vật)/.test(lower)
  ) {
    return 'Trứng & Sữa (Lacto-ovo)'
  }
  if (/(trứng|lòng đỏ|lòng trắng|mayonnaise)/.test(lower)) {
    return 'Chay có trứng (Ovo)'
  }
  if (
    /(sữa|phô mai|cheese|bơ|váng sữa)/.test(lower) &&
    !/(sữa hạt|sữa đậu|bơ đậu phộng|bơ thực vật)/.test(lower)
  ) {
    return 'Ăn chay có sữa (Lacto)'
  }
  return 'Thuần chay (Vegan)'
}

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
  dietType?: string | null
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
    items.push(
      ...result.items.map((v: VideoDetails) => ({
        ...v,
        dietType: v.dietType || inferVideoDietType(v.title, v.description),
      })),
    )
    if (items.length >= result.totalCount || result.items.length === 0) return items
  }
}

export async function getPublicVideo(id: string): Promise<VideoDetails> {
  const video = await apiClient.get<VideoDetails>(`/api/videos/${encodeURIComponent(id)}`, {
    requiresAuth: false,
  })
  return {
    ...video,
    dietType: video.dietType || inferVideoDietType(video.title, video.description),
  }
}

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
