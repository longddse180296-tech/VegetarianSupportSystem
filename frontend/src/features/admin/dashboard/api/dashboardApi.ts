import { apiClient } from '../../../../shared/api/apiClient'
type CatalogCount = { total: number; active: number }
export interface DashboardResponse {
  members: { registered: number; active: number; locked: number }
  coreData: {
    categories: CatalogCount
    ingredients: CatalogCount
    recipes: CatalogCount
    restaurants: CatalogCount
  }
  content: {
    publishedArticles: number
    publishedVideos: number
    comments: number | null
  }
  pendingAdminReview: { articles: number; videos: number; total: number }
  recentActivity: Array<{
    type: string
    entityId: string
    title: string
    actorUserId: string | null
    actorName: string | null
    occurredAtUtc: string
  }>
}
export const getDashboardOverview = () =>
  apiClient.get<DashboardResponse>('/api/admin/dashboard')
