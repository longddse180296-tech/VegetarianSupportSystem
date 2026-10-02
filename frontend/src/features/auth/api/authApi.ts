import type { AuthResponse, LoginCredentials, RegisterPayload, User } from '../types'

const AUTH_STORAGE_KEY = 'vegetarian_auth_token'
const USER_STORAGE_KEY = 'vegetarian_auth_user'
const USERS_DB_KEY = 'vegetarian_mock_users_db'

// Initialize default mock users if not present
const getMockUsersDB = (): User[] => {
  const existing = localStorage.getItem(USERS_DB_KEY)
  if (existing) {
    try {
      return JSON.parse(existing)
    } catch {
      // fallback
    }
  }

  const initialUsers: User[] = [
    {
      id: 'usr_01',
      fullName: 'Nguyễn Văn An',
      email: 'nguyen.an@example.com',
      role: 'User',
      createdAt: '2024-03-15T08:00:00Z',
    },
    {
      id: 'usr_02',
      fullName: 'Admin Quản Trị',
      email: 'admin@vegetariansupport.vn',
      role: 'Admin',
      createdAt: '2024-01-01T00:00:00Z',
    },
  ]
  localStorage.setItem(USERS_DB_KEY, JSON.stringify(initialUsers))
  return initialUsers
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const authApi = {
  /**
   * Mock API: Login with email & password
   * Supports simulated 1.2s network delay
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    await delay(1200)

    const normalizedEmail = credentials.email.trim().toLowerCase()
    const users = getMockUsersDB()

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
      throw new Error('Email không hợp lệ.')
    }

    // Default password check: accept password >= 6 chars for testing, or specific demo password
    if (!credentials.password || credentials.password.length < 6) {
      throw new Error('Email hoặc mật khẩu không chính xác.')
    }

    let user = users.find((u) => u.email.toLowerCase() === normalizedEmail)

    // For ease of demo, if user doesn't exist yet, auto-create as 'User'
    if (!user) {
      if (normalizedEmail.includes('admin')) {
        user = {
          id: `usr_${Date.now()}`,
          fullName: 'Admin Quản Trị',
          email: normalizedEmail,
          role: 'Admin',
          createdAt: new Date().toISOString(),
        }
      } else {
        user = {
          id: `usr_${Date.now()}`,
          fullName: normalizedEmail.split('@')[0].replace('.', ' '),
          email: normalizedEmail,
          role: 'User',
          createdAt: new Date().toISOString(),
        }
      }
      users.push(user)
      localStorage.setItem(USERS_DB_KEY, JSON.stringify(users))
    }

    const mockToken = `fake_jwt_token_${user.id}_${Date.now()}`
    const response: AuthResponse = {
      token: mockToken,
      user,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }

    // Save session
    localStorage.setItem(AUTH_STORAGE_KEY, mockToken)
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))

    return response
  },

  /**
   * Mock API: Register a new account
   */
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    await delay(1500)

    const fullName = payload.fullName.trim()
    const email = payload.email.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!fullName) {
      throw new Error('Họ tên không được để trống.')
    }

    if (!email || !emailRegex.test(email)) {
      throw new Error('Email không hợp lệ.')
    }

    if (!payload.password || payload.password.length < 8) {
      throw new Error('Mật khẩu tối thiểu 8 ký tự, bao gồm chữ và số.')
    }

    const hasLetter = /[a-zA-Z]/.test(payload.password)
    const hasNumber = /[0-9]/.test(payload.password)
    if (!hasLetter || !hasNumber) {
      throw new Error('Mật khẩu phải bao gồm cả chữ và số.')
    }

    if (payload.password !== payload.confirmPassword) {
      throw new Error('Mật khẩu xác nhận không trùng khớp.')
    }

    if (!payload.agreeTerms) {
      throw new Error('Bạn cần đồng ý với Điều khoản sử dụng và Chính sách bảo mật.')
    }

    const users = getMockUsersDB()
    const existing = users.find((u) => u.email.toLowerCase() === email)
    if (existing) {
      throw new Error('Email đã tồn tại trên hệ thống.')
    }

    const newUser: User = {
      id: `usr_${Date.now()}`,
      fullName,
      email,
      role: 'User',
      createdAt: new Date().toISOString(),
    }

    users.push(newUser)
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users))

    const mockToken = `fake_jwt_token_${newUser.id}_${Date.now()}`
    const response: AuthResponse = {
      token: mockToken,
      user: newUser,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }

    // Auto login
    localStorage.setItem(AUTH_STORAGE_KEY, mockToken)
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser))

    return response
  },

  /**
   * Mock API: Get currently authenticated user from stored token
   */
  async getCurrentUser(): Promise<User | null> {
    await delay(300)
    const token = localStorage.getItem(AUTH_STORAGE_KEY)
    const userStr = localStorage.getItem(USER_STORAGE_KEY)

    if (!token || !userStr) {
      return null
    }

    try {
      return JSON.parse(userStr) as User
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      localStorage.removeItem(USER_STORAGE_KEY)
      return null
    }
  },

  /**
   * Mock API: Request password reset link
   */
  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    await delay(1200)

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
      message: 'Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến email của bạn.',
    }
  },

  /**
   * Mock API: Logout
   */
  async logout(): Promise<void> {
    await delay(400)
    localStorage.removeItem(AUTH_STORAGE_KEY)
    localStorage.removeItem(USER_STORAGE_KEY)
  },
}
