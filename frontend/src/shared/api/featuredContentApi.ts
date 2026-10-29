// Chức năng: giao diện và thành phần dùng chung. Giao tiếp máy chủ và chuyển dữ liệu về kiểu dùng trong tính năng.
import { apiClient } from './apiClient'

// Cấu trúc FeaturedContentType quy định dữ liệu trao đổi trong giao diện và thành phần dùng chung.
export type FeaturedContentType = 'Restaurant' | 'Video' | 'Article'

// Cấu trúc FeaturedContentItem quy định dữ liệu trao đổi trong giao diện và thành phần dùng chung.
export interface FeaturedContentItem {
  id: string
  contentType: FeaturedContentType
  title: string
  description: string | null
  imageUrl: string | null
  isPinned: boolean
  authorName: string | null
  publishedAt: string | null
  viewCount: number | null
  address: string | null
  dietaryTypes: string[]
}

// Cấu trúc FeaturedContentPage quy định dữ liệu trao đổi trong giao diện và thành phần dùng chung.
export interface FeaturedContentPage {
  items: FeaturedContentItem[]
  totalCount: number
  page: number
  pageSize: number
}

// Lấy hoặc lọc danh sách theo điều kiện và phạm vi hiện tại (listPublicFeaturedContent); thuộc giao diện và thành phần dùng chung.
export function listPublicFeaturedContent(contentType: FeaturedContentType, page = 1, signal?: AbortSignal) {
  const query = new URLSearchParams({ contentType, page: String(page), pageSize: '100' })
  return apiClient.get<FeaturedContentPage>(`/api/featured-content?${query}`, { requiresAuth: false, signal })
}

// Đọc dữ liệu cần thiết và trả kết quả cho bước xử lý tiếp theo (getPublicFeaturedContent); thuộc giao diện và thành phần dùng chung.
export async function getPublicFeaturedContent(contentType: FeaturedContentType, signal?: AbortSignal) {
  const items: FeaturedContentItem[] = []
  for (let page = 1; ; page += 1) {
    const result = await listPublicFeaturedContent(contentType, page, signal)
    items.push(...result.items)
    if (!result.items.length || items.length >= result.totalCount) return items
  }
}

// Thực hiện bước xử lý riêng được các thành phần trong tính năng sử dụng (setFeaturedPin); thuộc giao diện và thành phần dùng chung.
export function setFeaturedPin(contentType: FeaturedContentType, id: string, isPinned: boolean) {
  return apiClient.put<void>(`/api/admin/featured-content/${contentType}/${encodeURIComponent(id)}`, { isPinned })
}
