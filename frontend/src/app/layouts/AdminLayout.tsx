import React from 'react'
import {
  LayoutDashboard,
  Users,
  FileText,
  Video,
  MessageSquare,
  Tag,
  LogOut,
  ChevronDown,
} from 'lucide-react'
import { Logo } from './Logo'

interface AdminLayoutProps {
  children: React.ReactNode
  activeMenu?: string
  pageTitle?: string
  pageSubtitle?: string
  onNavigate?: (path: string) => void
  adminName?: string
  adminEmail?: string
  onLogout?: () => void
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  activeMenu = 'members',
  pageTitle = 'Quản lý thành viên',
  pageSubtitle = 'Quản lý danh sách thành viên đã đăng ký và xem nội dung của họ.',
  onNavigate,
  adminName = 'Quản trị viên Admin',
  adminEmail = 'admin@vegetariansup...',
  onLogout,
}) => {
  const adminNavItems = [
    { id: 'dashboard', label: 'Tổng quan', path: '/admin/dashboard', icon: LayoutDashboard },
    { id: 'members', label: 'Thành viên', path: '/admin/members', icon: Users },
    { id: 'articles', label: 'Bài viết', path: '/admin/articles', icon: FileText },
    { id: 'videos', label: 'Video', path: '/admin/videos', icon: Video },
    { id: 'comments', label: 'Bình luận', path: '/admin/comments', icon: MessageSquare },
    { id: 'categories', label: 'Danh mục', path: '/admin/categories', icon: Tag },
  ]

  return (
    <div className="min-h-screen flex bg-[#F9FBFA] text-slate-900 font-sans antialiased">
      {/* 1. Left Sidebar (Fixed 64 / 256px, White Background matching Figma) */}
      <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-200/80 flex flex-col justify-between min-h-screen sticky top-0 h-screen z-20">
        <div className="flex flex-col">
          {/* Brand Logo Header */}
          <div className="p-6 pb-5 flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate?.('/admin/dashboard')}
              className="flex items-center gap-3 text-left focus:outline-none"
            >
              <Logo iconSize="sm" showText={false} />
              <div>
                <span className="font-extrabold text-base tracking-tight text-[#1E6531] block leading-tight">
                  Vegetarian Support
                </span>
                <span className="text-[11px] text-slate-400 font-medium block leading-tight mt-0.5">
                  Hệ thống Quản trị
                </span>
              </div>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="px-4 py-2 flex flex-col gap-1.5">
            {adminNavItems.map((item) => {
              const Icon = item.icon
              const isActive = activeMenu === item.id

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate?.(item.path)}
                  className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors text-left focus:outline-none ${
                    isActive
                      ? 'bg-[#EAF5EE] text-[#1E6531]'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 ${
                      isActive ? 'text-[#1E6531]' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Bottom User Pill */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-[#E0E7FF] text-[#4338CA] font-bold text-xs flex items-center justify-center flex-shrink-0">
              ●
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-900 truncate leading-tight">{adminName}</p>
              <p className="text-[11px] text-slate-400 truncate leading-tight mt-0.5">
                {adminEmail}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            title="Đăng xuất"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* 2. Main Right Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar matching Figma */}
        <header className="bg-white border-b border-slate-200/80 px-8 py-5 flex items-center justify-between gap-4 sticky top-0 z-10">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
              {pageTitle}
            </h1>
            <p className="text-xs text-slate-500 font-normal leading-normal">{pageSubtitle}</p>
          </div>

          <div className="flex items-center gap-3">
            {/* System Status Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#EAF5EE] text-[#1E6531] border border-emerald-200/60 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Hệ thống hoạt động ổn định</span>
            </div>

            {/* Admin User Profile Dropdown Button */}
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-xs font-bold text-slate-700 shadow-xs"
            >
              <div className="w-7 h-7 rounded-full bg-[#E0E7FF] text-[#4338CA] flex items-center justify-center font-bold text-[10px]">
                ●
              </div>
              <span>Admin</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-8 flex-1">{children}</main>
      </div>
    </div>
  )
}
export default AdminLayout
