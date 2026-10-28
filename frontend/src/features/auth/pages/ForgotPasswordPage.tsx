// Chức năng: đăng ký, đăng nhập và khôi phục mật khẩu. Ghép dữ liệu, thao tác và các trạng thái tải/lỗi cho màn hình.
import React, { useState } from 'react'
import { PublicLayout } from '../../../app/layouts/PublicLayout'
import { ForgotPasswordForm } from '../components/ForgotPasswordForm'
import { authApi } from '../api/authApi'
import { useAuth } from '../hooks/useAuth'

// Cấu trúc ForgotPasswordPageProps quy định dữ liệu trao đổi trong đăng ký, đăng nhập và khôi phục mật khẩu.
interface ForgotPasswordPageProps {
  onNavigate?: (path: string) => void
}

// Lấy hoặc lọc danh sách theo điều kiện và phạm vi hiện tại (ForgotPasswordPage); thuộc đăng ký, đăng nhập và khôi phục mật khẩu.
export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigate }) => {
  const { user } = useAuth()
  // Lưu dữ liệu và trạng thái thao tác của đăng ký, đăng nhập và khôi phục mật khẩu trong vòng đời màn hình.
  const [isLoading, setIsLoading] = useState(false)

  // Thực hiện bước xử lý riêng được các thành phần trong tính năng sử dụng (handleForgotPassword); thuộc đăng ký, đăng nhập và khôi phục mật khẩu.
  const handleForgotPassword = async (email: string) => {
    setIsLoading(true)
    try {
      return await authApi.forgotPassword(email)
    } finally {
      setIsLoading(false)
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
        <ForgotPasswordForm
          onSubmit={handleForgotPassword}
          onNavigateToLogin={() => onNavigate?.('/auth/login')}
          isLoading={isLoading}
        />
      </div>
    </PublicLayout>
  )
}
export default ForgotPasswordPage
