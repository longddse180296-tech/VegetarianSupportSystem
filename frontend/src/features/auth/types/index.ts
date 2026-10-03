export type UserRole = 'Guest' | 'User' | 'Admin'

export interface User {
  id: string
  fullName: string
  email: string
  role: UserRole
  avatarUrl?: string
  createdAt: string
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterPayload {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  agreeTerms: boolean
}

export interface ForgotPasswordPayload {
  email: string
}

export interface AuthResponse {
  token: string
  user: User
  expiresAt: string
}

export interface ApiError {
  message: string
  field?: string
}
