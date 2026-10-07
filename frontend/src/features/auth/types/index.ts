export type UserRole = 'Guest' | 'User' | 'Admin'

export interface User {
  id: string
  fullName: string
  email: string
  role: UserRole
  avatarUrl?: string
  createdAt?: string
  isLocked?: boolean
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
  goal?: 'lose_weight' | 'maintain' | 'gain_muscle' | 'vegan_lifestyle'
  agreeTerms?: boolean
}

export interface ForgotPasswordPayload {
  email: string
}

export interface ResetPasswordResult {
  ok: true
  tempToken: string
  suggestedPassword?: string
}

export interface AuthResponse {
  accessToken: string
  tokenType: string
  expiresAtUtc: string
  user: User
  token?: string
  expiresAt?: string
}

export interface ApiError {
  message: string
  field?: string
  status?: number
  errors?: Record<string, string[]>
}
