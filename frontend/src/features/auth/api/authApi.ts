// Chức năng: đăng ký, đăng nhập và khôi phục mật khẩu. Giao tiếp máy chủ và chuyển dữ liệu về kiểu dùng trong tính năng.
import {
  apiClient,
  ApiError,
  getStoredToken,
  setStoredToken,
  getStoredUser,
  setStoredUser,
  clearStoredAuth,
  refreshAccessToken,
  SIGNED_OUT_KEY,
} from '../../../shared/api/apiClient'
import type { AuthResponse, LoginCredentials, RegisterPayload, User } from '../types'

// Cấu trúc BackendAuthResponse quy định dữ liệu trao đổi trong đăng ký, đăng nhập và khôi phục mật khẩu.
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

    // Đồng bộ lựa chọn ghi nhớ với thời hạn cookie trên backend.
    const payload = { email, password, rememberMe: credentials.rememberMe ?? false }
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

    setStoredToken(response.accessToken, credentials.rememberMe ?? false)
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
    try {
      if (!getStoredToken() && localStorage.getItem(SIGNED_OUT_KEY) === '1') return null
      if (!getStoredToken()) await refreshAccessToken()
      const user = await apiClient.get<User>('/api/auth/me', { requiresAuth: true })
      setStoredUser(user)
      return user
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) {
        clearStoredAuth()
        return null
      }
      // Cached identity cannot establish a verified authenticated session.
      throw err
    }
  },

  /**
   * Real API: Invalidate session and revoke token on server (POST /api/auth/logout)
   */
  async logout(): Promise<void> {
    const token = getStoredToken()
    try {
      await apiClient.post('/api/auth/logout', undefined, {
        requiresAuth: !!token, headers: { 'X-Session-Refresh': '1' },
      })
    } catch {
      // Vẫn dọn trạng thái cục bộ; backend thu hồi phiên khi request tới được máy chủ.
    } finally {
      clearStoredAuth()
      // Không tự khôi phục bằng cookie còn sót nếu người dùng đăng xuất khi mất mạng.
      try { localStorage.setItem(SIGNED_OUT_KEY, '1') } catch { /* Bộ nhớ có thể bị chặn. */ }
    }
  },

  /**
   * Real API: Password reset request helper (POST /api/auth/forgot-password)
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

    const res = await apiClient.post<{ message?: string }>(
      '/api/auth/forgot-password',
      { email: normalizedEmail },
      { requiresAuth: false },
    )

    return {
      success: true,
      message: res?.message || 'Nếu email có tài khoản hợp lệ, hướng dẫn đặt lại mật khẩu sẽ được gửi.',
    }
  },

  /**
   * Real API: Reset password with token (POST /api/auth/reset-password)
   */
  async resetPassword(payload: {
    token: string
    newPassword: string
    confirmPassword: string
  }): Promise<{ success: boolean; message: string }> {
    await apiClient.post(
      '/api/auth/reset-password',
      payload,
      { requiresAuth: false },
    )

    return {
      success: true,
      message: 'Mật khẩu của bạn đã được đặt lại thành công. Vui lòng đăng nhập bằng mật khẩu mới.',
    }
  },
}

export { getStoredToken, setStoredToken, getStoredUser, setStoredUser, clearStoredAuth }
