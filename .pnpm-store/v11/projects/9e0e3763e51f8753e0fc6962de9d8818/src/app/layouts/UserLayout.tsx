import React, { useState } from 'react'
import {
  User,
  Calendar,
  UtensilsCrossed,
  FileText,
  Bookmark,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Shield,
} from 'lucide-react'
import { Logo } from './Logo'

interface UserLayoutProps {
  children: React.ReactNode
  activeMenu?: string
  onNavigate?: (path: string) => void
  userName?: string
  userEmail?: string
  userRole?: string
  onLogout?: () => void
}

export const UserLayout: React.FC<UserLayoutProps> = ({
  children,
  activeMenu = 'profile',
  onNavigate,
  userName = 'Nguyễn Văn An',
  userEmail = 'nguyen.an@example.com',
  userRole = 'User',
  onLogout,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleNavClick = (path: string) => {
    setIsMobileMenuOpen(false)
    if (onNavigate) {
      onNavigate(path)
    }
  }

  const navItems = [
    { id: 'profile', label: 'Hồ sơ cá nhân', path: '/profile', icon: User },
    { id: 'meal-plans', label: 'Thực đơn 7 ngày', path: '/meal-plans', icon: Calendar },
    { id: 'pantry', label: 'Tủ bếp cá nhân', path: '/pantry', icon: UtensilsCrossed },
    { id: 'articles', label: 'Bài viết của tôi', path: '/my-articles', icon: FileText },
    { id: 'favorites', label: 'Món ăn yêu thích', path: '/favorites', icon: Bookmark },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* User Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Mobile toggle button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Brand Logo */}
            <button
              type="button"
              onClick={() => handleNavClick('/')}
              className="flex items-center text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-lg"
            >
              <Logo iconSize="sm" />
            </button>
          </div>

          {/* Quick links & User profile pill */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => handleNavClick('/')}
              className="hidden sm:inline-flex text-sm font-medium text-slate-600 hover:text-emerald-700 transition-colors"
            >
              Về trang chủ
            </button>

            {userRole === 'Admin' && (
              <button
                type="button"
                onClick={() => handleNavClick('/admin/members')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Trang quản trị</span>
              </button>
            )}

            <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm border border-emerald-300">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-slate-900 leading-tight">{userName}</p>
                <p className="text-xs text-slate-500 leading-tight truncate max-w-[160px]">{userEmail}</p>
              </div>
              <button
                type="button"
                onClick={onLogout}
                title="Đăng xuất"
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container with Sidebar + Content */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col md:flex-row gap-6">
        {/* User Sidebar */}
        <aside
          className={`${
            isMobileMenuOpen ? 'block' : 'hidden'
          } md:block w-full md:w-64 flex-shrink-0 bg-white rounded-xl border border-slate-200 p-4 shadow-sm self-start`}
        >
          {/* User Mini Profile Header */}
          <div className="pb-4 mb-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-base shadow-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-900 truncate">{userName}</p>
              <p className="text-xs text-slate-500 truncate">{userEmail}</p>
              <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 rounded-md">
                Thành viên
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeMenu === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.path)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 font-semibold border-l-4 border-emerald-600'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-emerald-600" />}
                </button>
              )
            })}
          </nav>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0 bg-transparent">{children}</main>
      </div>
    </div>
  )
}
export default UserLayout
