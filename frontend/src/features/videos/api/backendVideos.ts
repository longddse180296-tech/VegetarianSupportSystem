// Chức năng: video, bản nháp và nội dung công khai. Giao tiếp máy chủ và chuyển dữ liệu về kiểu dùng trong tính năng.
import { apiClient, getStoredToken } from '../../../shared/api/apiClient'
import type { CoreDietType } from '../types/video.types'

// Thực hiện bước xử lý riêng được các thành phần trong tính năng sử dụng (inferVideoDietType); thuộc video, bản nháp và nội dung công khai.
export function inferVideoDietType(_title?: string, description?: string): CoreDietType | null {
  // Chỉ đọc chế độ người đăng đã khai báo; thiếu thông tin không đồng nghĩa với thuần chay.
  const declared = description?.match(/\[Chế độ:\s*([^\]]+)\]/i)?.[1]?.trim()
  const allowed: CoreDietType[] = ['Thuần chay (Vegan)', 'Ăn chay có sữa (Lacto)', 'Chay có trứng (Ovo)', 'Trứng & Sữa (Lacto-ovo)']
  return allowed.find(diet => diet === declared) ?? null
}

// Cấu trúc VideoDetails quy định dữ liệu trao đổi trong video, bản nháp và nội dung công khai.
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
  authorName: string | null
  durationSeconds: number | null
  hasAudio: boolean | null
  metadataStatus: 'Processing' | 'Ready' | 'Unavailable'
  dietType?: string | null
}

// Cấu trúc VideoPage quy định dữ liệu trao đổi trong video, bản nháp và nội dung công khai.
interface VideoPage {
  items: VideoDetails[]
  totalCount: number
  page: number
  pageSize: number
}

// Cấu trúc VideoCategoryOption quy định dữ liệu trao đổi trong video, bản nháp và nội dung công khai.
export interface VideoCategoryOption {
  id: string
  name: string
}

// Lấy hoặc lọc danh sách theo điều kiện và phạm vi hiện tại (listVideos); thuộc video, bản nháp và nội dung công khai.
export async function listVideos(mine = false): Promise<VideoDetails[]> {
  const items: VideoDetails[] = []
  for (let page = 1; ; page++) {
    const url = `/api/${mine ? 'me/' : ''}videos?page=${page}&pageSize=100`
    let result: VideoPage
    try {
      result = await apiClient.get<VideoPage>(url, { requiresAuth: mine })
    } catch (err) {
      console.error('[backendVideos.listVideos] Lỗi khi gọi API: ' + url, err)
      throw err
    }
    items.push(
      ...result.items.map((v: VideoDetails) => ({
        ...v,
        dietType: v.dietType || inferVideoDietType(v.title, v.description),
      })),
    )
    if (items.length >= result.totalCount || result.items.length === 0) return items
  }
}

// Đọc dữ liệu cần thiết và trả kết quả cho bước xử lý tiếp theo (getPublicVideo); thuộc video, bản nháp và nội dung công khai.
export async function getPublicVideo(id: string): Promise<VideoDetails> {
  const url = `/api/videos/${encodeURIComponent(id)}`
  let video: VideoDetails
  try {
    video = await apiClient.get<VideoDetails>(url, {
      requiresAuth: false,
    })
  } catch (err) {
    console.error('[backendVideos.getPublicVideo] Lỗi khi gọi API: ' + url, err)
    throw err
  }
  return {
    ...video,
    dietType: video.dietType || inferVideoDietType(video.title, video.description),
  }
}

// Đọc dữ liệu cần thiết và trả kết quả cho bước xử lý tiếp theo (getMyVideo); thuộc video, bản nháp và nội dung công khai.
export const getMyVideo = (id: string) =>
  apiClient.get<VideoDetails>(`/api/me/videos/${encodeURIComponent(id)}`)

// Ghi nhận thay đổi dữ liệu và cập nhật kết quả cho bên gọi (createVideo); thuộc video, bản nháp và nội dung công khai.
export const createVideo = (title: string, description: string, categoryId: string | null) =>
  apiClient.post<VideoDetails>('/api/me/videos', { title, description, categoryId })

// Ghi nhận thay đổi dữ liệu và cập nhật kết quả cho bên gọi (updateVideo); thuộc video, bản nháp và nội dung công khai.
export const updateVideo = (id: string, title: string, description: string, categoryId: string | null) =>
  apiClient.put<VideoDetails>(`/api/me/videos/${encodeURIComponent(id)}`, { title, description, categoryId })

// Kiểm tra dữ liệu trước khi gửi thao tác và xử lý kết quả trả về (submitVideo); thuộc video, bản nháp và nội dung công khai.
export const submitVideo = (id: string) =>
  apiClient.post(`/api/me/videos/${encodeURIComponent(id)}/submit`)

// Kiểm tra và tải tệp phục vụ nội dung đang chỉnh sửa (uploadVideoFile); thuộc video, bản nháp và nội dung công khai.
export async function uploadVideoFile(id: string, file: File, thumbnail = false): Promise<VideoDetails> {
  const data = new FormData()
  data.append('file', file)
  return apiClient.request<VideoDetails>(
    `/api/me/videos/${encodeURIComponent(id)}/${thumbnail ? 'thumbnail' : 'media'}`,
    { method: 'POST', body: data },
  )
}

// Lấy hoặc lọc danh sách theo điều kiện và phạm vi hiện tại (listVideoCategories); thuộc video, bản nháp và nội dung công khai.
export async function listVideoCategories(): Promise<VideoCategoryOption[]> {
  const response = await apiClient.get<{ items: VideoCategoryOption[] }>(
    '/api/categories?pageNumber=1&pageSize=100',
    { requiresAuth: false },
  )
  return response.items
}

// Đọc dữ liệu cần thiết và trả kết quả cho bước xử lý tiếp theo (getPrivateMediaUrl); thuộc video, bản nháp và nội dung công khai.
export async function getPrivateMediaUrl(path: string): Promise<string> {
  const token = getStoredToken()
  const response = await fetch(path, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!response.ok) throw new Error('Không thể tải media video.')
  return URL.createObjectURL(await response.blob())
}

// Thực hiện bước xử lý riêng được các thành phần trong tính năng sử dụng (recordVideoView); thuộc video, bản nháp và nội dung công khai.
export const recordVideoView = (id: string) =>
  apiClient.post<void>(`/api/videos/${encodeURIComponent(id)}/views`, undefined, {
    requiresAuth: false,
    credentials: 'include',
  })
