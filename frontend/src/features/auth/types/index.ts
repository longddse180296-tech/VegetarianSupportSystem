// Chức năng: đăng ký, đăng nhập và khôi phục mật khẩu. Khai báo cấu trúc dữ liệu để các màn hình và hàm xử lý dùng thống nhất.
// Cấu trúc UserRole quy định dữ liệu trao đổi trong đăng ký, đăng nhập và khôi phục mật khẩu.
export type UserRole = 'Guest' | 'User' | 'Admin'

// Cấu trúc User quy định dữ liệu trao đổi trong đăng ký, đăng nhập và khôi phục mật khẩu.
export interface User {
  id: string
  fullName: string
  email: string
  role: UserRole
  avatarUrl?: string
  createdAt?: string
  isLocked?: boolean
}

// Cấu trúc LoginCredentials quy định dữ liệu trao đổi trong đăng ký, đăng nhập và khôi phục mật khẩu.
export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

// Cấu trúc RegisterPayload quy định dữ liệu trao đổi trong đăng ký, đăng nhập và khôi phục mật khẩu.
export interface RegisterPayload {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  agreeTerms?: boolean
}

// Cấu trúc ForgotPasswordPayload quy định dữ liệu trao đổi trong đăng ký, đăng nhập và khôi phục mật khẩu.
export interface ForgotPasswordPayload {
  email: string
}

// Cấu trúc ResetPasswordPayload quy định dữ liệu trao đổi trong đăng ký, đăng nhập và khôi phục mật khẩu.
export interface ResetPasswordPayload {
  token: string
  newPassword: string
  confirmPassword: string
}

// Cấu trúc AuthResponse quy định dữ liệu trao đổi trong đăng ký, đăng nhập và khôi phục mật khẩu.
export interface AuthResponse {
  accessToken: string
  tokenType: string
  expiresAtUtc: string
  user: User
  token?: string
  expiresAt?: string
}

// Cấu trúc ApiError quy định dữ liệu trao đổi trong đăng ký, đăng nhập và khôi phục mật khẩu.
export interface ApiError {
  message: string
  field?: string
  status?: number
  errors?: Record<string, string[]>
}
