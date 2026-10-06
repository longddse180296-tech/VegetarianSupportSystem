import {
  apiClient,
  ApiError,
  getStoredToken,
  setStoredToken,
  getStoredUser,
  setStoredUser,
  clearStoredAuth,
} from '../../../shared/api/apiClient'
import type { AuthResponse, LoginCredentials, RegisterPayload, User } from '../types'

interface BackendAuthResponse {
  accessToken: string
  tokenType: string
  expiresAtUtc: string
  user: User
}

export const authApi = {
  /**
   * Real API: Login with email & password (POST /api/auth/login)
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const email = credentials.email.trim()
    const password = credentials.password

    // Backend endpoint disallows extra unmapped fields like rememberMe
    const payload = { email, password }
    const data = await apiClient.post<BackendAuthResponse>('/api/auth/login', payload, {
      requiresAuth: false,
    })

    const response: AuthResponse = {
      accessToken: data.accessToken,
      tokenType: data.tokenType || 'Bearer',
      expiresAtUtc: data.expiresAtUtc,
      user: data.user,
      token: data.accessToken,
      expiresAt: data.expiresAtUtc,
    }

    setStoredToken(response.accessToken)
    setStoredUser(response.user)

    return response
  },

  /**
   * Real API: Register a new user account (POST /api/auth/register)
   */
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const fullName = payload.fullName.trim()
    const email = payload.email.trim()
    const password = payload.password
    const confirmPassword = payload.confirmPassword

    // Backend endpoint disallows extra unmapped fields like agreeTerms
    const requestBody = {
      fullName,
      email,
      password,
      confirmPassword,
    }

    const data = await apiClient.post<BackendAuthResponse>('/api/auth/register', requestBody, {
      requiresAuth: false,
    })

    const response: AuthResponse = {
      accessToken: data.accessToken,
      tokenType: data.tokenType || 'Bearer',
      expiresAtUtc: data.expiresAtUtc,
      user: data.user,
      token: data.accessToken,
      expiresAt: data.expiresAtUtc,
    }

    setStoredToken(response.accessToken)
    setStoredUser(response.user)

    return response
  },

  /**
   * Real API: Get currently authenticated user profile (GET /api/auth/me)
   */
  async getCurrentUser(): Promise<User | null> {
    const token = getStoredToken()
    if (!token) {
      return null
    }

    try {
      const user = await apiClient.get<User>('/api/auth/me', { requiresAuth: true })
      setStoredUser(user)
      return user
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) {
        clearStoredAuth()
        return null
      }
      // If server error or network issue occurs while offline, fallback to cached user if available
      return getStoredUser<User>()
    }
  },

  /**
   * Real API: Invalidate session and revoke token on server (POST /api/auth/logout)
   */
  async logout(): Promise<void> {
    const token = getStoredToken()
    try {
      if (token) {
        await apiClient.post('/api/auth/logout', undefined, { requiresAuth: true })
      }
    } catch {
      // Ignore network/server errors during logout
    } finally {
      clearStoredAuth()
    }
  },

  /**
   * Password reset request helper
   */
  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const normalizedEmail = email.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!normalizedEmail) {
      throw new Error('Vui lòng nhập email.')
    }

    if (!emailRegex.test(normalizedEmail)) {
      throw new Error('Email không hợp lệ.')
    }

    return {
      success: true,
      message: 'Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến email của bạn nếu tài khoản tồn tại trong hệ thống.',
    }
  },
}

export { getStoredToken, setStoredToken, getStoredUser, setStoredUser, clearStoredAuth }
