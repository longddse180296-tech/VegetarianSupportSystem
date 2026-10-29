// Chức năng: thống kê và góp ý gửi đến Admin. Giao tiếp máy chủ và chuyển dữ liệu về kiểu dùng trong tính năng.
import { apiClient } from '../../../../shared/api/apiClient'
// Cấu trúc CatalogCount quy định dữ liệu trao đổi trong thống kê và góp ý gửi đến Admin.
type CatalogCount = { total: number; active: number }
// Cấu trúc DashboardResponse quy định dữ liệu trao đổi trong thống kê và góp ý gửi đến Admin.
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
// Đọc dữ liệu cần thiết và trả kết quả cho bước xử lý tiếp theo (getDashboardOverview); thuộc thống kê và góp ý gửi đến Admin.
export const getDashboardOverview = () =>
  apiClient.get<DashboardResponse>('/api/admin/dashboard')
