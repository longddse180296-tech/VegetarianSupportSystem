export type Member = {
  id: string
  fullName: string
  email: string
  role: 'User' | 'Admin'
  joinedAtUtc: string
  isLocked: boolean
}

export type MemberDetail = Member & {
  currentLockReason: string | null
  lockedAtUtc: string | null
}

export type MemberPage = {
  items: Member[]
  page: number
  pageSize: number
  totalCount: number
  activeCount: number
  lockedCount: number
}

export type StatusEntry = {
  id: string
  isLocked: boolean
  reason: string
  adminId: string
  adminName: string
  occurredAtUtc: string
}

export type StatusPage = {
  items: StatusEntry[]
  page: number
  pageSize: number
  totalCount: number
}

type AuthResponse = {
  accessToken: string
  user: { id: string; fullName: string; role: string }
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) { super(message); this.status = status }
}

async function request<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/admin/members${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init?.body ? { 'Content-Type': 'application/json' } : {}) },
  })
  if (!response.ok) {
    const problem = await response.json().catch(() => null)
    throw new ApiError(response.status, problem?.title ?? `Yêu cầu thất bại (${response.status}).`)
  }
  return response.status === 204 ? undefined as T : response.json()
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch('/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!response.ok) throw new ApiError(response.status, 'Email hoặc mật khẩu không đúng, hoặc tài khoản đã bị khóa.')
  return response.json()
}

export async function currentUser(token: string): Promise<AuthResponse['user']> {
  const response = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
  if (!response.ok) throw new ApiError(response.status, 'Phiên đăng nhập không còn hiệu lực.')
  return response.json()
}

export function listMembers(token: string, search: string, status: string, page: number): Promise<MemberPage> {
  const query = new URLSearchParams({ page: String(page), pageSize: '10' })
  if (search.trim()) query.set('search', search.trim())
  if (status !== 'all') query.set('isLocked', String(status === 'locked'))
  return request(`?${query}`, token)
}

export const getMember = (token: string, id: string) => request<MemberDetail>(`/${encodeURIComponent(id)}`, token)
export const getHistory = (token: string, id: string, page: number) =>
  request<StatusPage>(`/${encodeURIComponent(id)}/status-history?page=${page}&pageSize=10`, token)
export const changeStatus = (token: string, id: string, lock: boolean, reason: string) =>
  request<void>(`/${encodeURIComponent(id)}/${lock ? 'lock' : 'unlock'}`, token, {
    method: 'POST', body: JSON.stringify({ reason }),
  })
