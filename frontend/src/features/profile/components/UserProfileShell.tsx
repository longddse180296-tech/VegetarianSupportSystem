import React from 'react'
import { useAuth } from '../../auth'
import { PublicLayout } from '../../../app/layouts/PublicLayout'

interface BreadcrumbItem {
  label: string
  path?: string
}

interface UserProfileShellProps {
  activeTab: 'overview' | 'my-articles' | 'my-comments' | 'my-videos'
  breadcrumbs?: BreadcrumbItem[]
  statBadge?: { count: number; label: string }
  children: React.ReactNode
  onNavigate?: (path: string) => void
}

export const UserProfileShell: React.FC<UserProfileShellProps> = ({
  activeTab,
  breadcrumbs = [{ label: 'Trang chủ', path: '/' }, { label: 'Tài khoản', path: '/profile' }],
  statBadge = { count: 12, label: 'Bài viết' },
  children,
  onNavigate,
}) => {
  const { user, logout } = useAuth()

  const handleNav = (path: string) => {
    if (onNavigate) onNavigate(path)
  }

  const navMenuItems = [
    {
      id: 'overview',
      label: 'Tổng quan',
      icon: '📊',
      path: '/profile',
    },
    {
      id: 'my-articles',
      label: 'Bài viết của tôi',
      icon: '📝',
      badge: 12,
      path: '/profile/my-articles',
    },
    {
      id: 'my-comments',
      label: 'Bình luận của tôi',
      icon: '💬',
      badge: 34,
      path: '/profile/my-comments',
    },
    {
      id: 'my-videos',
      label: 'Video của tôi',
      icon: '🎬',
      badge: 8,
      path: '/profile/my-videos',
    },
  ]

  const displayName = user?.fullName || 'Nguyễn Minh Anh'
  const displayEmail = user?.email || 'minhanh@example.com'

  return (
    <PublicLayout
      activeNav="home"
      onNavigate={onNavigate}
      isLoggedIn={Boolean(user)}
      userName={displayName}
      onLogout={() => { void logout() }}
    >
      <div className="min-h-screen bg-slate-50/60 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6 flex-wrap">
            {breadcrumbs.map((b, idx) => {
              const isLast = idx === breadcrumbs.length - 1
              return (
                <React.Fragment key={idx}>
                  {b.path && !isLast ? (
                    <button
                      type="button"
                      onClick={() => handleNav(b.path!)}
                      className="hover:text-emerald-700 transition-colors"
                    >
                      {b.label}
                    </button>
                  ) : (
                    <span className={isLast ? 'text-emerald-700 font-semibold' : ''}>
                      {b.label}
                    </span>
                  )}
                  {!isLast && <span>/</span>}
                </React.Fragment>
              )
            })}
          </nav>

          {/* Profile Header Card */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm mb-8 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 text-center sm:text-left">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
                  alt={displayName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-emerald-100 shadow-sm"
                />
                <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                  <h1 className="text-xl font-bold text-gray-900">{displayName}</h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <span>✓</span> Thành viên đóng góp
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-gray-500">
                  <span>✉️ {displayEmail}</span>
                  <span>•</span>
                  <span>📅 Tham gia từ tháng 03/2024</span>
                  <span>•</span>
                  <span className="text-emerald-700 font-medium">🌱 Chế độ: Thuần thực vật (Vegan)</span>
                </div>
              </div>
            </div>

            {/* Stat Counter Box */}
            <div className="flex items-center gap-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl px-6 py-3 shrink-0 text-center">
              <div>
                <div className="text-2xl font-black text-emerald-800">{statBadge.count}</div>
                <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
                  {statBadge.label}
                </div>
              </div>
            </div>
          </div>

          {/* Main 2-Column Section */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Column: Account Navigation Menu */}
            <aside className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="px-3 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Tài khoản & Quản trị
                </div>
                <nav className="flex flex-col gap-1 mt-2">
                  {navMenuItems.map((item) => {
                    const isActive = activeTab === item.id
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleNav(item.path)}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-emerald-700 text-white shadow-sm'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span>{item.icon}</span>
                          <span>{item.label}</span>
                        </div>
                        {item.badge !== undefined && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isActive
                                ? 'bg-emerald-800 text-white'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </nav>
              </div>
            </aside>

            {/* Right Column: Dynamic Content */}
            <main className="lg:col-span-3">{children}</main>
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}
