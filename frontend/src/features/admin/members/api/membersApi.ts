// Chức năng: quản lý thành viên. Giao tiếp máy chủ và chuyển dữ liệu về kiểu dùng trong tính năng.
import { apiClient, ApiError as HttpError } from '../../../../shared/api/apiClient'
// Cấu trúc Member quy định dữ liệu trao đổi trong quản lý thành viên.
export type Member = {
  id: string
  fullName: string
  email: string
  role: 'User' | 'Admin'
  joinedAtUtc: string
  isLocked: boolean
}

// Cấu trúc MemberDetail quy định dữ liệu trao đổi trong quản lý thành viên.
export type MemberDetail = Member & {
  currentLockReason: string | null
  lockedAtUtc: string | null
}

// Cấu trúc MemberPage quy định dữ liệu trao đổi trong quản lý thành viên.
export type MemberPage = {
  items: Member[]
  page: number
  pageSize: number
  totalCount: number
  activeCount: number
  lockedCount: number
}

// Cấu trúc StatusEntry quy định dữ liệu trao đổi trong quản lý thành viên.
export type StatusEntry = {
  id: string
  isLocked: boolean
  reason: string
  adminId: string
  adminName: string
  occurredAtUtc: string
}

// Cấu trúc StatusPage quy định dữ liệu trao đổi trong quản lý thành viên.
export type StatusPage = {
  items: StatusEntry[]
  page: number
  pageSize: number
  totalCount: number
}

// Cấu trúc AuthResponse quy định dữ liệu trao đổi trong quản lý thành viên.
type AuthResponse = {
  accessToken: string
  user: { id: string; fullName: string; role: string }
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) { super(message); this.status = status }
}

// Thực hiện bước xử lý riêng được các thành phần trong tính năng sử dụng (request); thuộc quản lý thành viên.
async function request<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  try {
    return await apiClient.request<T>(`/api/admin/members${path}`, {
      ...init, headers: { Authorization: `Bearer ${token}` },
    })
  } catch (error) {
    // Giữ loại lỗi mà màn hình thành viên đang sử dụng, đồng thời dùng thông báo thống nhất của client chung.
    if (error instanceof HttpError) throw new ApiError(error.status, error.message)
    throw error
  }
}

// Xác thực thông tin đăng nhập và cập nhật phiên sử dụng (login); thuộc quản lý thành viên.
export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch('/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!response.ok) throw new ApiError(response.status, 'Email hoặc mật khẩu không đúng, hoặc tài khoản đã bị khóa.')
  return response.json()
}

// Thực hiện bước xử lý riêng được các thành phần trong tính năng sử dụng (currentUser); thuộc quản lý thành viên.
export async function currentUser(token: string): Promise<AuthResponse['user']> {
  const response = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
  if (!response.ok) throw new ApiError(response.status, 'Phiên đăng nhập không còn hiệu lực.')
  return response.json()
}

// Lấy hoặc lọc danh sách theo điều kiện và phạm vi hiện tại (listMembers); thuộc quản lý thành viên.
export function listMembers(token: string, search: string, status: string, page: number): Promise<MemberPage> {
  const query = new URLSearchParams({ page: String(page), pageSize: '10' })
  if (search.trim()) query.set('search', search.trim())
  if (status !== 'all') query.set('isLocked', String(status === 'locked'))
  return request(`?${query}`, token)
}

// Đọc dữ liệu cần thiết và trả kết quả cho bước xử lý tiếp theo (getMember); thuộc quản lý thành viên.
export const getMember = (token: string, id: string) => request<MemberDetail>(`/${encodeURIComponent(id)}`, token)
// Đọc dữ liệu cần thiết và trả kết quả cho bước xử lý tiếp theo (getHistory); thuộc quản lý thành viên.
export const getHistory = (token: string, id: string, page: number) =>
  request<StatusPage>(`/${encodeURIComponent(id)}/status-history?page=${page}&pageSize=10`, token)
// Xử lý lựa chọn hoặc chuyển trạng thái giao diện theo thao tác người dùng (changeStatus); thuộc quản lý thành viên.
export const changeStatus = (token: string, id: string, lock: boolean, reason: string) =>
  request<void>(`/${encodeURIComponent(id)}/${lock ? 'lock' : 'unlock'}`, token, {
    method: 'POST', body: JSON.stringify({ reason }),
  })
