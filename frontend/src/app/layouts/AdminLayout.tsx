import {
  LayoutDashboard,
  Users,
  FileText,
  Video,
  MessageSquare,
  Tag,
  Apple,
  LogOut,
  BookOpen,
  MapPin,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useAuth } from '../../features/auth'
import { Logo } from './Logo'
import './AdminLayout.css'

interface AdminLayoutProps {
  children: ReactNode
  activeMenu?: string
  pageTitle?: string
  pageSubtitle?: string
  onNavigate?: (path: string) => void
  adminName?: string
  adminEmail?: string
  onLogout?: () => void
  availableNavIds?: string[]
}
const nav = [
  {
    id: 'dashboard',
    label: 'Tổng quan',
    path: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  { id: 'categories', label: 'Danh mục công thức', path: '/admin/categories', icon: Tag },
  {
    id: 'ingredients',
    label: 'Nguyên liệu',
    path: '/admin/ingredients',
    icon: Apple,
  },
  { id: 'recipes', label: 'Công thức', path: '/admin/recipes', icon: BookOpen },
  {
    id: 'restaurants',
    label: 'Nhà hàng',
    path: '/admin/restaurants',
    icon: MapPin,
  },
  {
    id: 'articles',
    label: 'Bài viết',
    path: '/admin/articles',
    icon: FileText,
  },
  { id: 'videos', label: 'Video', path: '/admin/videos', icon: Video },
  {
    id: 'comments',
    label: 'Bình luận',
    path: '/admin/comments',
    icon: MessageSquare,
  },
  { id: 'members', label: 'Thành viên', path: '/admin/members', icon: Users },
]
const menuAccents: Record<string, string> = {
  dashboard: 'bg-emerald-50 text-emerald-600',
  categories: 'bg-sky-50 text-sky-600',
  ingredients: 'bg-lime-50 text-lime-700',
  recipes: 'bg-amber-50 text-amber-600',
  restaurants: 'bg-teal-50 text-teal-600',
  articles: 'bg-indigo-50 text-indigo-600',
  videos: 'bg-violet-50 text-violet-600',
  comments: 'bg-sky-50 text-sky-600',
  members: 'bg-blue-50 text-blue-600',
}
export function AdminLayout({
  children,
  activeMenu = 'dashboard',
  pageTitle = 'Quản trị hệ thống',
  pageSubtitle,
  onNavigate,
  adminName,
  adminEmail,
  onLogout,
  availableNavIds,
}: AdminLayoutProps) {
  const auth = useAuth()
  const displayName = adminName || auth.user?.fullName || 'Quản trị viên'
  const displayEmail = adminEmail || auth.user?.email || ''
  const PageIcon = nav.find((item) => item.id === activeMenu)?.icon ?? LayoutDashboard
  const navigate =
    onNavigate ??
    ((path: string) => {
      window.location.hash = path
    })

  return (
    <div className="fe1-admin min-h-screen flex bg-[#F9FBFA] text-slate-900 font-sans">
      <aside className="w-16 sm:w-64 lg:w-72 flex-shrink-0 bg-white border-r border-slate-200/80 flex flex-col justify-between sticky top-0 h-screen z-20 overflow-y-auto">
        <div>
          <button
            type="button"
            aria-label="Trang quản trị"
            onClick={() => navigate('/admin/dashboard')}
            className="fe1-control flex items-center gap-3 p-3 sm:p-6"
          >
            <Logo iconSize="lg" showText={false} />
            <span className="hidden sm:block text-left">
              <strong className="block text-[#1E6531]">
                Vegetarian Support
              </strong>
              <span className="text-xs text-slate-500">Hệ thống Quản trị</span>
            </span>
          </button>
          <nav className="px-2 sm:px-4 py-2 flex flex-col gap-1.5">
            {nav
              .filter(
                (item) => !availableNavIds || availableNavIds.includes(item.id),
              )
              .map((item) => (
                <button
                  key={item.id}
                  type="button"
                  title={item.label}
                  aria-label={item.label}
                  aria-current={activeMenu === item.id ? 'page' : undefined}
                  onClick={() => navigate(item.path)}
                  className={`fe1-control relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-left ${activeMenu === item.id ? 'bg-[#EAF5EE] text-[#1E6531] font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              ))}
          </nav>
        </div>
        <div className="border-t border-slate-200/70 p-2 sm:p-4">
          <div className="flex min-w-0 items-center gap-2 rounded-xl sm:border sm:border-slate-200/80 sm:bg-slate-50/80 sm:p-3">
            <span aria-hidden="true" className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-sm font-bold text-emerald-800 sm:flex">
              {displayName.trim().charAt(0).toUpperCase() || 'A'}
            </span>
            <div className="hidden min-w-0 flex-1 sm:block">
              <p title={displayName} className="truncate text-sm font-semibold text-slate-800">{displayName}</p>
              <p title={displayEmail} className="mt-0.5 truncate text-xs text-slate-500">{displayEmail}</p>
            </div>
            <button
              type="button"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600"
              title="Đăng xuất"
              aria-label="Đăng xuất"
              onClick={onLogout ?? (() => void auth.logout().then(() => navigate('/auth/login')))}
            >
              <LogOut aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
      <div className="flex-1 min-w-0">
        <header className="border-b border-slate-200/70 bg-white px-4 py-5 sm:px-8 sm:py-6">
          <div className="mx-auto flex max-w-7xl min-w-0 items-start gap-3 sm:items-center sm:gap-4">
            <span className={`hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl sm:flex ${menuAccents[activeMenu] || menuAccents.dashboard}`}>
              <PageIcon aria-hidden="true" className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <h1 className="admin-page-title">{pageTitle}</h1>
              {pageSubtitle && <p className="admin-page-subtitle">{pageSubtitle}</p>}
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl min-w-0 p-4 sm:p-8">{children}</main>
      </div>
    </div>
  )
}
export default AdminLayout
