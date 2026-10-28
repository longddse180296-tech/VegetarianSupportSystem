// Chức năng: đăng ký, đăng nhập và khôi phục mật khẩu. Cấu hình hoặc hỗ trợ luồng xử lý của các thành phần trong ứng dụng.
import { createContext } from 'react'
import type { User, LoginCredentials, RegisterPayload } from '../types'

// Cấu trúc AuthContextType quy định dữ liệu trao đổi trong đăng ký, đăng nhập và khôi phục mật khẩu.
export interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  login: (credentials: LoginCredentials) => Promise<User>
  register: (payload: RegisterPayload) => Promise<User>
  logout: () => Promise<void>
  refreshUser: () => Promise<User | null>
  updateUser?: (updates: Partial<User>) => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
