// Chức năng: đăng ký, đăng nhập và khôi phục mật khẩu. Ghép dữ liệu, thao tác và các trạng thái tải/lỗi cho màn hình.
import React from 'react'
import { PublicLayout } from '../../../app/layouts/PublicLayout'
import { AuthFeatureCards } from '../components/AuthFeatureCards'
import { RegisterForm } from '../components/RegisterForm'
import { useAuth } from '../hooks/useAuth'
import type { RegisterPayload } from '../types'

// Cấu trúc RegisterPageProps quy định dữ liệu trao đổi trong đăng ký, đăng nhập và khôi phục mật khẩu.
interface RegisterPageProps {
  onNavigate?: (path: string) => void
}

// Kiểm tra và gửi thông tin tạo tài khoản (RegisterPage); thuộc đăng ký, đăng nhập và khôi phục mật khẩu.
export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
  const { register, isLoading, user } = useAuth()

  // Kiểm tra và gửi thông tin tạo tài khoản (handleRegister); thuộc đăng ký, đăng nhập và khôi phục mật khẩu.
  const handleRegister = async (payload: RegisterPayload) => {
    await register(payload)
    if (onNavigate) {
      onNavigate('/')
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
            <AuthFeatureCards mode="register" />
          </div>

          {/* Right Form Card Column */}
          <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
            <RegisterForm
              onSubmit={handleRegister}
              onNavigateToLogin={() => onNavigate?.('/auth/login')}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}
export default RegisterPage
