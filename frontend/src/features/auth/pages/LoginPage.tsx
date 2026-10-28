// Chức năng: đăng ký, đăng nhập và khôi phục mật khẩu. Ghép dữ liệu, thao tác và các trạng thái tải/lỗi cho màn hình.
import React from 'react'
import { PublicLayout } from '../../../app/layouts/PublicLayout'
import { AuthFeatureCards } from '../components/AuthFeatureCards'
import { LoginForm } from '../components/LoginForm'
import { useAuth } from '../hooks/useAuth'
import type { LoginCredentials } from '../types'

// Cấu trúc LoginPageProps quy định dữ liệu trao đổi trong đăng ký, đăng nhập và khôi phục mật khẩu.
interface LoginPageProps {
  onNavigate?: (path: string) => void
}

// Lấy hoặc lọc danh sách theo điều kiện và phạm vi hiện tại (LoginPage); thuộc đăng ký, đăng nhập và khôi phục mật khẩu.
export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login, isLoading, user } = useAuth()

  // Xác thực thông tin đăng nhập và cập nhật phiên sử dụng (handleLogin); thuộc đăng ký, đăng nhập và khôi phục mật khẩu.
  const handleLogin = async (credentials: LoginCredentials) => {
    const loggedInUser = await login(credentials)
    if (onNavigate) {
      if (loggedInUser?.role === 'Admin') {
        onNavigate('/admin/dashboard')
      } else {
        // Retrieve returnUrl from hash query, search query, or sessionStorage
        let returnUrl: string | null = null
        try {
          const hash = typeof window !== 'undefined' ? window.location.hash : ''
          const search = typeof window !== 'undefined' ? window.location.search : ''
          const queryPart = hash.includes('?') ? hash.split('?')[1] : search.replace(/^\?/, '')
          const params = new URLSearchParams(queryPart)
          returnUrl = params.get('returnUrl') || sessionStorage.getItem('returnUrl')
          if (returnUrl) {
            sessionStorage.removeItem('returnUrl')
          }
        } catch {
          // fallback
        }

        if (returnUrl && returnUrl !== '/login' && returnUrl !== '/auth/login') {
          onNavigate(returnUrl)
        } else {
          onNavigate('/')
        }
      }
    }
  }

  // Hiển thị giao diện đăng ký, đăng nhập và khôi phục mật khẩu từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
  return (
    <PublicLayout
      activeNav="auth"
      onNavigate={onNavigate}
      isLoggedIn={!!user}
      userName={user?.fullName}
    >
      <div className="ui-page-container py-10 sm:py-16">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
          {/* Left Feature Column */}
          <div className="w-full lg:w-1/2 flex justify-center lg:justify-start">
            <AuthFeatureCards mode="login" />
          </div>

          {/* Right Form Card Column */}
          <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
            <LoginForm
              onSubmit={handleLogin}
              onNavigateToRegister={() => onNavigate?.('/auth/register')}
              onNavigateToForgotPassword={() => onNavigate?.('/auth/forgot-password')}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}
export default LoginPage
