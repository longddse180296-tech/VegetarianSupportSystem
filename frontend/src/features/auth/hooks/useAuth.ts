// Chức năng: đăng ký, đăng nhập và khôi phục mật khẩu. Quản lý trạng thái, vòng đời yêu cầu và dữ liệu được tái sử dụng.
import { useContext } from 'react'
import { AuthContext, type AuthContextType } from '../context/AuthContextInstance'

// Thực hiện bước xử lý riêng được các thành phần trong tính năng sử dụng (useAuth); thuộc đăng ký, đăng nhập và khôi phục mật khẩu.
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
