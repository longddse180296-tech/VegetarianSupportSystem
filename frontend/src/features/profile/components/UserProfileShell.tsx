// Chức năng: hồ sơ và nhu cầu dinh dưỡng cá nhân. Hiển thị một phần giao diện và phát sự kiện cho màn hình cha xử lý.
import React from 'react'
import {
  LayoutDashboard,
  FileText,
  Bookmark,
  MessageSquare,
  Video,
  ChevronRight,
  Mail,
  Calendar,
  Leaf,
  Sparkles,
  ShieldCheck,
  Check,
  ShoppingBasket,
} from 'lucide-react'
import { useAuth } from '../../auth'
import { PublicLayout } from '../../../app/layouts/PublicLayout'

// Cấu trúc BreadcrumbItem quy định dữ liệu trao đổi trong hồ sơ và nhu cầu dinh dưỡng cá nhân.
export interface BreadcrumbItem {
  label: string
  path?: string
}

// Cấu trúc UserProfileShellProps quy định dữ liệu trao đổi trong hồ sơ và nhu cầu dinh dưỡng cá nhân.
export interface UserProfileShellProps {
  activeTab: 'overview' | 'my-articles' | 'my-comments' | 'my-videos' | 'favorites' | 'pantry'
  breadcrumbs?: BreadcrumbItem[]
  statBadge?: { count: number; label: string }
  userName?: string
  userEmail?: string
  avatarUrl?: string
  dietaryType?: string
  children: React.ReactNode
  onNavigate?: (path: string) => void
}

const DEFAULT_AVATAR = ''

// Thành phần UserProfileShell nhận dữ liệu đầu vào và hiển thị phần giao diện thuộc hồ sơ và nhu cầu dinh dưỡng cá nhân.
export const UserProfileShell: React.FC<UserProfileShellProps> = ({
  activeTab,
  breadcrumbs = [
    { label: 'Trang chủ', path: '/' },
    { label: 'Tài khoản', path: '/profile' },
  ],
  statBadge = { count: 0, label: 'Bài viết' },
  userName,
  userEmail,
  avatarUrl,
  dietaryType,
  children,
  onNavigate,
}) => {
  const { user, logout } = useAuth()

  // Thực hiện bước xử lý riêng được các thành phần trong tính năng sử dụng (handleNav); thuộc hồ sơ và nhu cầu dinh dưỡng cá nhân.
  const handleNav = (path: string) => {
    if (onNavigate) onNavigate(path)
  }

  const navMenuItems = [
    {
      id: 'overview',
      label: 'Tổng quan & Hồ sơ',
      icon: LayoutDashboard,
      path: '/profile',
    },
    {
      id: 'my-articles',
      label: 'Bài viết của tôi',
      icon: FileText,
      badge: activeTab === 'my-articles' ? statBadge.count : undefined,
      path: '/profile/my-articles',
    },
    {
      id: 'my-videos',
      label: 'Video của tôi',
      icon: Video,
      badge: activeTab === 'my-videos' ? statBadge.count : undefined,
      path: '/profile/my-videos',
    },
    {
      id: 'my-comments',
      label: 'Bình luận của tôi',
      icon: MessageSquare,
      badge: activeTab === 'my-comments' ? statBadge.count : undefined,
      path: '/profile/my-comments',
    },
    {
      id: 'favorites',
      label: 'Mục đã lưu',
      icon: Bookmark,
      path: '/favorites',
    },
    { id: 'pantry', label: 'Tủ bếp AI', icon: ShoppingBasket, path: '/profile/pantry' },
  ]

  const displayName = userName || user?.fullName || 'Thành viên'
  const displayEmail = userEmail || user?.email || ''
  const displayAvatar = avatarUrl || user?.avatarUrl || DEFAULT_AVATAR
  const displayDiet = dietaryType || 'Chưa cung cấp'

  // Hiển thị giao diện hồ sơ và nhu cầu dinh dưỡng cá nhân từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
  return (
    <PublicLayout
      activeNav="profile"
      onNavigate={onNavigate}
      isLoggedIn={Boolean(user)}
      userName={displayName}
      avatarUrl={displayAvatar}
      onLogout={async () => {
        await logout()
        if (onNavigate) {
          onNavigate('/')
        }
      }}
    >
      <div className="min-h-screen bg-[#f8faf8] pb-16">
        <div className="ui-page-container pt-6">
          {/* Breadcrumbs matching DESIGN.md */}
          <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-6 flex-wrap">
            {breadcrumbs.map((b, idx) => {
              const isLast = idx === breadcrumbs.length - 1
              // Hiển thị giao diện hồ sơ và nhu cầu dinh dưỡng cá nhân từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
              return (
                <React.Fragment key={idx}>
                  {b.path && !isLast ? (
                    <button
                      type="button"
                      onClick={() => handleNav(b.path!)}
                      className="fe1-link hover:text-[#2e7d32] transition-colors"
                    >
                      {b.label}
                    </button>
                  ) : (
                    <span
                      className={
                        isLast
                          ? 'text-[#2e7d32] font-semibold'
                          : 'text-slate-600'
                      }
                    >
                      {b.label}
                    </span>
                  )}
                  {!isLast && (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  )}
                </React.Fragment>
              )
            })}
          </nav>

          {/* Profile Header Hero / Assessment Banner (DESIGN.md Level 1 card with 20px radius) */}
          <div className="relative bg-white rounded-[20px] p-6 sm:p-7 border border-[#e5e7eb] shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)] mb-8 overflow-hidden">
            {/* Subtle botanical gradient wash */}
            <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-[#e8f5e9]/40 via-transparent to-transparent pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
              {/* Left Column: Avatar & Personal Identity */}
              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-5 text-center sm:text-left">
                <div className="relative shrink-0">
                  {displayAvatar ? <img
                    src={displayAvatar}
                    alt={displayName}
                    className="w-20 h-20 rounded-full object-cover ring-4 ring-[#e8f5e9] border border-emerald-600/20 shadow-sm"
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).src =
                        DEFAULT_AVATAR
                    }}
                  /> : <span className="grid h-20 w-20 place-items-center rounded-full bg-primary-light text-2xl font-semibold text-primary">{displayName.charAt(0).toUpperCase()}</span>}
                  <span
                    className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-[#2e7d32] border-2 border-white ring-1 ring-emerald-200"
                    title="Đang hoạt động"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    <h1 className="text-xl sm:text-2xl font-bold text-[#1f2937] tracking-tight">
                      {displayName}
                    </h1>
                    <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-[#e8f5e9] text-[#2e7d32] border border-emerald-200/80 inline-flex items-center gap-1.5 shadow-2xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>Thành viên đóng góp</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1.5 text-xs text-[#6b7280]">
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{displayEmail}</span>
                    </span>
                    <span className="hidden sm:inline text-slate-300">•</span>
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Tài khoản của tôi</span>
                    </span>
                    <span className="hidden sm:inline text-slate-300">•</span>
                    <span className="inline-flex items-center gap-1.5 font-medium text-[#2e7d32]">
                      <Leaf className="w-3.5 h-3.5" />
                      <span>Chế độ: {displayDiet}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Stat Badge Card (hidden in overview) */}
              {activeTab !== 'overview' && activeTab !== 'pantry' && statBadge && (
                <div className="flex items-center gap-4 bg-[#f8faf8] border border-[#e5e7eb] rounded-[16px] px-6 py-3.5 shrink-0 text-center shadow-2xs">
                  <div>
                    <div className="text-2xl font-black text-[#1b5e20] tracking-tight tabular-nums">
                      {statBadge.count}
                    </div>
                    <div className="text-[11px] font-semibold text-[#2e7d32] uppercase tracking-wider mt-0.5">
                      {statBadge.label}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main 2-Column Responsive Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Column: Account Navigation Sidebar */}
            <aside className="lg:col-span-1 space-y-4">
              <div className="bg-white rounded-[16px] border border-[#e5e7eb] p-4 shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)]">
                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Tài khoản &amp; Quản trị
                </div>
                <nav className="flex flex-col gap-1.5 mt-2">
                  {navMenuItems.map((item) => {
                    const isActive = activeTab === item.id
                    const Icon = item.icon
                    // Hiển thị giao diện hồ sơ và nhu cầu dinh dưỡng cá nhân từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleNav(item.path)}
                        className={`fe1-control w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-sm font-medium transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[#EAF5EE] text-[#1E6531] border border-emerald-400 font-bold shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon
                            className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`}
                          />
                          <span>{item.label}</span>
                        </div>
                        {item.badge !== undefined && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              isActive
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
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

              {/* Sidebar Quality Assurance Box */}
              <div className="bg-gradient-to-br from-[#f8faf8] to-[#e8f5e9]/50 rounded-[16px] border border-emerald-200/70 p-4 text-xs">
                <div className="flex items-center gap-2 font-bold text-[#1b5e20] mb-1.5">
                  <Sparkles className="w-4 h-4 text-[#2e7d32]" />
                  <span>Dinh dưỡng chuẩn hóa</span>
                </div>
                <p className="text-[#6b7280] leading-relaxed text-[11px]">
                  Hồ sơ đã lưu cung cấp chế độ ăn, dị ứng và chỉ số tham khảo
                  cho các chức năng cá nhân hóa khi bạn đăng nhập.
                </p>
                <div className="mt-3 pt-2.5 border-t border-emerald-200/50 flex items-center gap-1.5 text-[11px] font-medium text-[#2e7d32]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#2e7d32]" />
                  <span>Theo thông tin bạn đã khai báo</span>
                </div>
              </div>
            </aside>

            {/* Right Column: Dynamic Feature Content */}
            <main className="min-w-0 lg:col-span-3">{children}</main>
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}

export default UserProfileShell
