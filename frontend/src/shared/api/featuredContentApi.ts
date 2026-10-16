import { apiClient } from './apiClient'

export type FeaturedContentType = 'Restaurant' | 'Video' | 'Article'

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

export interface FeaturedContentPage {
  items: FeaturedContentItem[]
  totalCount: number
  page: number
  pageSize: number
}

export function listPublicFeaturedContent(contentType: FeaturedContentType, page = 1, signal?: AbortSignal) {
  const query = new URLSearchParams({ contentType, page: String(page), pageSize: '100' })
  return apiClient.get<FeaturedContentPage>(`/api/featured-content?${query}`, { requiresAuth: false, signal })
}

export async function getPublicFeaturedContent(contentType: FeaturedContentType, signal?: AbortSignal) {
  const items: FeaturedContentItem[] = []
  for (let page = 1; ; page += 1) {
    const result = await listPublicFeaturedContent(contentType, page, signal)
    items.push(...result.items)
    if (!result.items.length || items.length >= result.totalCount) return items
  }
}

export function setFeaturedPin(contentType: FeaturedContentType, id: string, isPinned: boolean) {
  return apiClient.put<void>(`/api/admin/featured-content/${contentType}/${encodeURIComponent(id)}`, { isPinned })
}
