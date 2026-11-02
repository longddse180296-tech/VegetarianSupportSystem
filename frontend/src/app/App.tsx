// Chức năng: giao diện và thành phần dùng chung. Cấu hình hoặc hỗ trợ luồng xử lý của các thành phần trong ứng dụng.
import React, { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from '../features/auth'
import { RouterRenderer, type RouterContext } from './router/Router'
import './App.css'
import '../styles/fe1.css'

// Đọc dữ liệu cần thiết và trả kết quả cho bước xử lý tiếp theo (getInitialPath); thuộc giao diện và thành phần dùng chung.
const getInitialPath = (): string => {
  if (typeof window !== 'undefined') {
    const hash = window.location.hash.replace(/^#/, '')
    if (hash) return hash
    if (window.location.pathname.startsWith('/admin')) {
      return window.location.pathname
    }
  }
  return '/'
}

// Thành phần AppContent nhận dữ liệu đầu vào và hiển thị phần giao diện thuộc giao diện và thành phần dùng chung.
const AppContent: React.FC = () => {
  // Lưu dữ liệu và trạng thái thao tác của giao diện và thành phần dùng chung trong vòng đời màn hình.
  const [currentPath, setCurrentPath] = useState<string>(getInitialPath)
  const { user, logout } = useAuth()

  // Đăng ký sự kiện phục vụ màn hình và dọn bộ lắng nghe khi không còn sử dụng.
  useEffect(() => {
    // Xử lý lựa chọn hoặc chuyển trạng thái giao diện theo thao tác người dùng (handleHashChange); thuộc giao diện và thành phần dùng chung.
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#/, '')
      const next = hash || '/'
      if (next !== currentPath) {
        setCurrentPath(next)
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [currentPath])

  // Đồng bộ trạng thái hoặc tác động bên ngoài khi các phụ thuộc thay đổi.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [currentPath])

  // Xử lý lựa chọn hoặc chuyển trạng thái giao diện theo thao tác người dùng (onNavigate); thuộc giao diện và thành phần dùng chung.
  const onNavigate = (path: string) => {
    if (typeof window !== 'undefined') {
      window.location.hash = path
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    }
    setCurrentPath(path)
  }

  // Kết thúc phiên sử dụng và dọn thông tin đăng nhập đã lưu (handleLogout); thuộc giao diện và thành phần dùng chung.
  const handleLogout = async () => {
    await logout()
    onNavigate('/')
  }

  const ctx: RouterContext = { currentPath, onNavigate }

  // Hiển thị thành phần giao diện dùng chung từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
  return (
    <div className="min-h-screen fe1-ui">
      <RouterRenderer {...ctx} user={user} logout={handleLogout} />
    </div>
  )
}

// Thành phần App nhận dữ liệu đầu vào và hiển thị phần giao diện thuộc giao diện và thành phần dùng chung.
export default function App() {
  // Hiển thị thành phần giao diện dùng chung từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
