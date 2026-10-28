// Chức năng: đăng ký, đăng nhập và khôi phục mật khẩu. Cấu hình hoặc hỗ trợ luồng xử lý của các thành phần trong ứng dụng.
import React, { useState, useEffect } from 'react'
import type { User, LoginCredentials, RegisterPayload } from '../types'
import { authApi, setStoredUser } from '../api/authApi'
import { AuthContext, type AuthContextType } from './AuthContextInstance'

// Thành phần AuthProvider nhận dữ liệu đầu vào và hiển thị phần giao diện thuộc đăng ký, đăng nhập và khôi phục mật khẩu.
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Lưu dữ liệu và trạng thái thao tác của đăng ký, đăng nhập và khôi phục mật khẩu trong vòng đời màn hình.
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const userId = user?.id

  // Thử lại việc lấy dữ liệu và đồng bộ trạng thái hiển thị (refreshUser); thuộc đăng ký, đăng nhập và khôi phục mật khẩu.
  const refreshUser = async (): Promise<User | null> => {
    try {
      const currentUser = await authApi.getCurrentUser()
      setUser(currentUser)
      return currentUser
    } catch {
      // Chỉ /me trả phiên không hợp lệ mới xóa danh tính; lỗi mạng không tự đăng xuất người đang dùng.
      return null
    }
  }

  // Ghi nhận thay đổi dữ liệu và cập nhật kết quả cho bên gọi (updateUser); thuộc đăng ký, đăng nhập và khôi phục mật khẩu.
  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null
      const updated = { ...prev, ...updates }
      setStoredUser(updated)
      return updated
    })
  }

  // Listen for user profile updates across components or storage changes
  // Đăng ký sự kiện phục vụ màn hình và dọn bộ lắng nghe khi không còn sử dụng.
  useEffect(() => {
    // Đồng bộ trạng thái React ngay khi máy chủ báo phiên hết hạn; không giữ tên người dùng từ bộ nhớ cũ.
    const expireSession = () => setUser(null)
    window.addEventListener('vegetarian_session_expired', expireSession)
    return () => window.removeEventListener('vegetarian_session_expired', expireSession)
  }, [])

  // Đăng ký sự kiện phục vụ màn hình và dọn bộ lắng nghe khi không còn sử dụng.
  useEffect(() => {
    // Thực hiện bước xử lý riêng được các thành phần trong tính năng sử dụng (handleSync); thuộc đăng ký, đăng nhập và khôi phục mật khẩu.
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<Partial<User>>
      if (customEvent.detail) {
        setUser((prev) => {
          if (!prev) return null
          const updated = { ...prev, ...customEvent.detail }
          setStoredUser(updated)
          return updated
        })
      } else {
        void refreshUser()
      }
    }

    window.addEventListener('vegetarian_user_updated', handleSync)
    window.addEventListener('storage', handleSync)
    return () => {
      window.removeEventListener('vegetarian_user_updated', handleSync)
      window.removeEventListener('storage', handleSync)
    }
  }, [])

  // Đồng bộ dữ liệu theo thay đổi đầu vào; hủy hoặc bỏ qua kết quả cũ khi màn hình thay đổi.
  useEffect(() => {
    let isMounted = true

    // Kiểm tra điều kiện hợp lệ trước khi cho phép xử lý tiếp (checkUser); thuộc đăng ký, đăng nhập và khôi phục mật khẩu.
    const checkUser = async () => {
      try {
        const currentUser = await authApi.getCurrentUser()
        if (isMounted) {
          setUser(currentUser)
        }
      } catch {
        if (isMounted) {
          setUser(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void checkUser()

    return () => {
      isMounted = false
    }
  }, [])

  // Kiểm tra phiên khi quay lại trang và định kỳ để máy cũ sớm nhận thông báo đã đăng nhập nơi khác.
  useEffect(() => {
    if (!userId) return
    let checking = false
    let stopped = false
    const check = async () => {
      if (checking || document.visibilityState === 'hidden') return
      checking = true
      try {
        const current = await authApi.getCurrentUser()
        if (!stopped) setUser(current)
      } catch { /* Lỗi mạng tạm thời không tự đăng xuất. */ }
      finally { checking = false }
    }
    const timer = window.setInterval(() => { void check() }, 30000)
    window.addEventListener('focus', check)
    document.addEventListener('visibilitychange', check)
    return () => {
      stopped = true
      window.clearInterval(timer)
      window.removeEventListener('focus', check)
      document.removeEventListener('visibilitychange', check)
    }
  }, [userId])

  // Xác thực thông tin đăng nhập và cập nhật phiên sử dụng (login); thuộc đăng ký, đăng nhập và khôi phục mật khẩu.
  const login = async (credentials: LoginCredentials): Promise<User> => {
    setIsLoading(true)
    try {
      const response = await authApi.login(credentials)
      setUser(response.user)
      return response.user
    } finally {
      setIsLoading(false)
    }
  }

  // Kiểm tra và gửi thông tin tạo tài khoản (register); thuộc đăng ký, đăng nhập và khôi phục mật khẩu.
  const register = async (payload: RegisterPayload): Promise<User> => {
    setIsLoading(true)
    try {
      const response = await authApi.register(payload)
      setUser(response.user)
      return response.user
    } finally {
      setIsLoading(false)
    }
  }

  // Kết thúc phiên sử dụng và dọn thông tin đăng nhập đã lưu (logout); thuộc đăng ký, đăng nhập và khôi phục mật khẩu.
  const logout = async (): Promise<void> => {
    setIsLoading(true)
    try {
      await authApi.logout()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'Admin',
    login,
    register,
    logout,
    refreshUser,
    updateUser,
  }

  // Hiển thị giao diện đăng ký, đăng nhập và khôi phục mật khẩu từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
