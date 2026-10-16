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
  const navigate =
    onNavigate ??
    ((path: string) => {
      window.location.hash = path
    })
  return (
    <div className="fe1-admin min-h-screen flex bg-[#F9FBFA] text-slate-900 font-sans">
      <aside className="w-16 sm:w-64 flex-shrink-0 bg-white border-r border-slate-200/80 flex flex-col justify-between sticky top-0 h-screen z-20 overflow-y-auto">
        <div>
          <button
            aria-label="Trang quản trị"
            onClick={() => navigate('/admin/dashboard')}
            className="fe1-control flex items-center gap-3 p-3 sm:p-6"
          >
            <Logo iconSize="sm" showText={false} />
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
                  title={item.label}
                  aria-label={item.label}
                  onClick={() => navigate(item.path)}
                  className={`fe1-control flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-left ${activeMenu === item.id ? 'bg-[#EAF5EE] text-[#1E6531] font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              ))}
          </nav>
        </div>
        <div className="border-t p-3 sm:p-4 flex items-center justify-between gap-2">
          <div className="hidden sm:block min-w-0">
            <p className="truncate text-sm font-bold">
              {adminName || auth.user?.fullName || 'Quản trị viên'}
            </p>
            <p className="truncate text-xs text-slate-500">
              {adminEmail || auth.user?.email || ''}
            </p>
          </div>
          <button className="fe1-control"
            title="Đăng xuất"
            aria-label="Đăng xuất"
            onClick={
              onLogout ??
              (() => void auth.logout().then(() => navigate('/auth/login')))
            }
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>
      <div className="flex-1 min-w-0">
        <header className="bg-white border-b px-4 sm:px-8 py-5">
          <h1 className="text-xl sm:text-2xl font-bold">{pageTitle}</h1>
          {pageSubtitle && (
            <p className="text-xs text-slate-500 mt-1">{pageSubtitle}</p>
          )}
        </header>
        <main className="p-4 sm:p-8 min-w-0">{children}</main>
      </div>
    </div>
  )
}
export default AdminLayout
