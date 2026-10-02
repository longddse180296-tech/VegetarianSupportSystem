import React, { useState } from 'react'
import {
  Users,
  ShieldAlert,
  BookOpen,
  Apple,
  MapPin,
  FolderTree,
  MessageSquare,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react'
import { Logo } from './Logo'

interface AdminLayoutProps {
  children: React.ReactNode
  activeMenu?: string
  onNavigate?: (path: string) => void
  adminName?: string
  adminEmail?: string
  onLogout?: () => void
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  activeMenu = 'members',
  onNavigate,
  adminName = 'Admin Quản Trị',
  adminEmail = 'admin@vegetariansupport.vn',
  onLogout,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleNavClick = (path: string) => {
    setIsMobileMenuOpen(false)
    if (onNavigate) {
      onNavigate(path)
    }
  }

  const adminNavItems = [
    { id: 'dashboard', label: 'Bảng điều khiển', path: '/admin/dashboard', icon: LayoutDashboard },
    { id: 'members', label: 'Quản lý thành viên', path: '/admin/members', icon: Users },
    { id: 'moderation', label: 'Kiểm duyệt nội dung', path: '/admin/moderation', icon: ShieldAlert },
    { id: 'recipes', label: 'Quản lý công thức', path: '/admin/recipes', icon: BookOpen },
    { id: 'ingredients', label: 'Quản lý nguyên liệu', path: '/admin/ingredients', icon: Apple },
    { id: 'restaurants', label: 'Quản lý nhà hàng', path: '/admin/restaurants', icon: MapPin },
    { id: 'categories', label: 'Quản lý danh mục', path: '/admin/categories', icon: FolderTree },
    { id: 'comments', label: 'Quản lý bình luận', path: '/admin/comments', icon: MessageSquare },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900">
      {/* Admin Top Header */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Mobile toggle button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Admin Brand Logo */}
            <button
              type="button"
              onClick={() => handleNavClick('/admin/dashboard')}
              className="flex items-center text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-lg"
            >
              <Logo iconSize="sm" textColor="text-white" />
            </button>
          </div>

          {/* Admin User Badge & Actions */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => handleNavClick('/')}
              className="hidden sm:inline-flex text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Xem trang người dùng
            </button>

            <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-slate-800">
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-white leading-tight">{adminName}</p>
                <p className="text-xs text-slate-400 leading-tight truncate max-w-[150px]">{adminEmail}</p>
              </div>
              <button
                type="button"
                onClick={onLogout}
                title="Đăng xuất quản trị"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container with Sidebar + Content */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col md:flex-row gap-6">
        {/* Admin Sidebar */}
        <aside
          className={`${
            isMobileMenuOpen ? 'block' : 'hidden'
          } md:block w-full md:w-64 flex-shrink-0 bg-white rounded-xl border border-slate-200 p-4 shadow-sm self-start`}
        >
          <div className="pb-3 mb-3 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Danh mục quản trị
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1">
            {adminNavItems.map((item) => {
              const Icon = item.icon
              const isActive = activeMenu === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.path)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    isActive
                      ? 'bg-slate-900 text-white font-semibold shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-emerald-400" />}
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Admin Content Area */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  )
}
export default AdminLayout
