/**
 * Kiểu dữ liệu chung toàn hệ thống frontend
 */

export interface PaginatedResponse<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages?: number
}

export interface PaginationParams {
  page?: number
  pageSize?: number
  search?: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  errors?: Record<string, string[]>
}
