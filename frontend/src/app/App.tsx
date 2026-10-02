import React, { useState } from 'react'
import { AuthProvider, useAuth } from '../features/auth'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { RegisterPage } from '../features/auth/pages/RegisterPage'
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage'
import { ProfilePage } from '../features/profile'
import { AdminLayout } from './layouts/AdminLayout'

const AppContent: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>('/auth/login')
  const { user, logout } = useAuth()

  const handleNavigate = (path: string) => {
    setCurrentPath(path)
  }

  // Auth pages
  if (currentPath === '/auth/login' || (!user && currentPath === '/')) {
    return <LoginPage onNavigate={handleNavigate} />
  }

  if (currentPath === '/auth/register') {
    return <RegisterPage onNavigate={handleNavigate} />
  }

  if (currentPath === '/auth/forgot-password') {
    return <ForgotPasswordPage onNavigate={handleNavigate} />
  }

  // Admin section
  if (currentPath.startsWith('/admin')) {
    return (
      <AdminLayout
        activeMenu={currentPath.split('/')[2] || 'members'}
        onNavigate={handleNavigate}
        adminName={user?.fullName || 'Admin Quản Trị'}
        adminEmail={user?.email || 'admin@vegetariansupport.vn'}
        onLogout={async () => {
          await logout()
          setCurrentPath('/auth/login')
        }}
      >
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Trang Quản trị Thành viên (Admin Members)</h2>
          <p className="text-sm text-slate-600 mb-4">
            Đang sẵn sàng cho Phase 4. Đăng nhập thành công với quyền Admin.
          </p>
          <div className="p-4 bg-emerald-50 text-emerald-800 rounded-lg text-sm border border-emerald-200">
            ✓ Quyền: <strong>{user?.role}</strong> | Email: <strong>{user?.email}</strong>
          </div>
        </div>
      </AdminLayout>
    )
  }

  // User Section (e.g., /profile)
  return <ProfilePage onNavigate={handleNavigate} />
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
