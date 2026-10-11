import React, { useEffect, useState } from 'react'
import {
  Users,
  FileText,
  Video,
  MessageSquare,
  Tag,
  ArrowRight,
  Plus,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import { AdminLayout } from '../../../../app/layouts/AdminLayout'
import { useAuth } from '../../../auth/hooks/useAuth'
import { getDashboardOverview } from '../api/dashboardApi'
import type { DashboardOverviewData } from '../types/dashboard.types'
import { SkeletonLoader } from '../../../../shared/components/SkeletonLoader'

interface AdminDashboardPageProps {
  onNavigate: (path: string) => void
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onNavigate }) => {
  const { user, isAdmin, isLoading: authLoading, logout } = useAuth()
  const [data, setData] = useState<DashboardOverviewData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    let isMounted = true
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await getDashboardOverview()
        if (isMounted) {
          setData(res)
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Lỗi khi tải dữ liệu tổng quan')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void fetchData()
    return () => {
      isMounted = false
    }
  }, [refreshTrigger])

  if (authLoading) {
    return (
      <main className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="flex items-center gap-3 text-slate-500 text-sm">
          <RefreshCw className="w-5 h-5 animate-spin text-[#2e7d32]" />
          <span>Đang kiểm tra phiên quản trị...</span>
        </div>
      </main>
    )
  }

  if (!isAdmin) {
    return (
      <main className="p-8 text-center max-w-md mx-auto my-12 bg-white rounded-2xl border border-rose-200 p-8 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Quyền truy cập bị từ chối</h2>
        <p className="text-xs text-slate-500 mt-1">Chỉ Quản trị viên (Admin) mới có quyền truy cập vào bảng điều khiển này.</p>
        <button
          type="button"
          onClick={() => onNavigate('/auth/login')}
          className="mt-4 px-4 py-2 bg-[#2e7d32] text-white text-xs font-semibold rounded-[10px]"
        >
          Đăng nhập lại
        </button>
      </main>
    )
  }

  return (
    <AdminLayout
      activeMenu="dashboard"
      pageTitle="Tổng quan Hệ thống Quản trị"
      pageSubtitle="Theo dõi hoạt động thành viên, kiểm duyệt bài viết, video và danh mục thời gian thực."
      adminName={user?.fullName ?? 'Quản trị viên'}
      adminEmail={user?.email ?? 'admin@vegetariansupport.vn'}
      onNavigate={onNavigate}
      onLogout={() => {
        void logout().then(() => onNavigate('/auth/login'))
      }}
    >
      <div className="space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-[12px] bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between shadow-2xs">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setRefreshTrigger((prev) => prev + 1)}
              className="text-[#2e7d32] hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Thử lại</span>
            </button>
          </div>
        )}

        {/* Quick Action Ribbon */}
        <div className="bg-white rounded-[16px] border border-[#e5e7eb] p-4 sm:p-5 shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1f2937]">
            <Sparkles className="w-4 h-4 text-[#2e7d32]" />
            <span>Thao tác nhanh cho Quản trị viên:</span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => onNavigate('/admin/articles')}
              className="h-9 px-3.5 rounded-[10px] bg-[#2e7d32] text-white text-xs font-semibold hover:bg-[#1b5e20] transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Duyệt bài viết</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/admin/ingredients')}
              className="h-9 px-3.5 rounded-[10px] bg-white border border-[#e5e7eb] text-[#1f2937] hover:bg-[#e8f5e9] hover:border-[#2e7d32] hover:text-[#2e7d32] text-xs font-semibold transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm nguyên liệu</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/admin/categories')}
              className="h-9 px-3.5 rounded-[10px] bg-white border border-[#e5e7eb] text-[#1f2937] hover:bg-[#e8f5e9] hover:border-[#2e7d32] hover:text-[#2e7d32] text-xs font-semibold transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm danh mục</span>
            </button>
          </div>
        </div>

        {/* 5 Metric Summary Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white rounded-[16px] border border-[#e5e7eb] p-5 shadow-2xs"
              >
                <SkeletonLoader count={2} variant="text" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Card 1: Members */}
            <div
              onClick={() => onNavigate('/admin/members')}
              className="p-5 rounded-[16px] bg-white border border-[#e5e7eb] shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)] hover:border-[#2e7d32] hover:shadow-[0_8px_20px_-4px_rgba(46,125,50,0.08)] transition-all cursor-pointer flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#6b7280]">Thành viên</span>
                <div className="w-8 h-8 rounded-[10px] bg-emerald-50 text-[#2e7d32] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-[#1f2937] tabular-nums tracking-tight">
                  {data?.stats.members.value}
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-[#2e7d32] mt-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>{data?.stats.members.badge}</span>
                </div>
              </div>
            </div>

            {/* Card 2: Articles */}
            <div
              onClick={() => onNavigate('/admin/articles')}
              className="p-5 rounded-[16px] bg-white border border-[#e5e7eb] shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)] hover:border-[#2e7d32] hover:shadow-[0_8px_20px_-4px_rgba(46,125,50,0.08)] transition-all cursor-pointer flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#6b7280]">Bài viết</span>
                <div className="w-8 h-8 rounded-[10px] bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-[#1f2937] tabular-nums tracking-tight">
                  {data?.stats.articles.value}
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 mt-1">
                  <span>{data?.stats.articles.badge}</span>
                </div>
              </div>
            </div>

            {/* Card 3: Videos */}
            <div
              onClick={() => onNavigate('/admin/videos')}
              className="p-5 rounded-[16px] bg-white border border-[#e5e7eb] shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)] hover:border-[#2e7d32] hover:shadow-[0_8px_20px_-4px_rgba(46,125,50,0.08)] transition-all cursor-pointer flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#6b7280]">Video</span>
                <div className="w-8 h-8 rounded-[10px] bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Video className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-[#1f2937] tabular-nums tracking-tight">
                  {data?.stats.videos.value}
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 mt-1">
                  <span>{data?.stats.videos.badge}</span>
                </div>
              </div>
            </div>

            {/* Card 4: Comments */}
            <div
              onClick={() => onNavigate('/admin/comments')}
              className="p-5 rounded-[16px] bg-white border border-[#e5e7eb] shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)] hover:border-[#2e7d32] hover:shadow-[0_8px_20px_-4px_rgba(46,125,50,0.08)] transition-all cursor-pointer flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#6b7280]">Bình luận</span>
                <div className="w-8 h-8 rounded-[10px] bg-purple-50 text-purple-600 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-[#1f2937] tabular-nums tracking-tight">
                  {data?.stats.comments.value}
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-purple-600 mt-1">
                  <span>{data?.stats.comments.badge}</span>
                </div>
              </div>
            </div>

            {/* Card 5: Categories */}
            <div
              onClick={() => onNavigate('/admin/categories')}
              className="p-5 rounded-[16px] bg-white border border-[#e5e7eb] shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)] hover:border-[#2e7d32] hover:shadow-[0_8px_20px_-4px_rgba(46,125,50,0.08)] transition-all cursor-pointer flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#6b7280]">Danh mục</span>
                <div className="w-8 h-8 rounded-[10px] bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-[#1f2937] tabular-nums tracking-tight">
                  {data?.stats.categories.value}
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 mt-1">
                  <span>{data?.stats.categories.badge}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2-Column Responsive Dashboard Body */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Recent Articles & Videos (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Articles Table Card */}
            <div className="bg-white rounded-[16px] border border-[#e5e7eb] p-6 shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#2e7d32]" />
                  <h3 className="text-base font-bold text-[#1f2937]">Bài viết chia sẻ mới nhất</h3>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('/admin/articles')}
                  className="text-xs font-semibold text-[#2e7d32] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Xem tất cả</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {data?.recentArticles.map((art) => (
                  <div
                    key={art.id}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-[#f8faf8] px-2 rounded-lg transition-colors"
                  >
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-[#1f2937] line-clamp-1">{art.title}</h4>
                      <p className="text-[11px] text-[#6b7280]">
                        Tác giả: <span className="font-medium text-[#1f2937]">{art.authorName}</span> • Ngày đăng: {art.publishedAt}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate('/admin/articles')}
                      className="text-xs font-semibold text-[#2e7d32] hover:bg-[#e8f5e9] px-2.5 py-1 rounded-[6px] shrink-0"
                    >
                      Kiểm duyệt
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Cooking Videos Card */}
            <div className="bg-white rounded-[16px] border border-[#e5e7eb] p-6 shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-amber-600" />
                  <h3 className="text-base font-bold text-[#1f2937]">Video ẩm thực mới đăng tải</h3>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('/admin/videos')}
                  className="text-xs font-semibold text-[#2e7d32] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Xem tất cả</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {data?.recentVideos.map((vid) => (
                  <div
                    key={vid.id}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-[#f8faf8] px-2 rounded-lg transition-colors"
                  >
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-[#1f2937] line-clamp-1">{vid.title}</h4>
                      <p className="text-[11px] text-[#6b7280]">
                        Đầu bếp: <span className="font-medium text-[#1f2937]">{vid.authorName}</span> • Thời lượng: {vid.duration} • {vid.publishedAt}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate('/admin/videos')}
                      className="text-xs font-semibold text-amber-700 hover:bg-amber-50 px-2.5 py-1 rounded-[6px] shrink-0"
                    >
                      Xem chi tiết
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: System Logs & Master Data Summary (1 Col) */}
          <div className="space-y-6">
            {/* Recent Activity Log */}
            <div className="bg-white rounded-[16px] border border-[#e5e7eb] p-6 shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)] space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <h3 className="text-base font-bold text-[#1f2937]">Hoạt động gần đây</h3>
              </div>

              <div className="space-y-3">
                {data?.recentActivities.map((act) => (
                  <div key={act.id} className="text-xs pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-[#1f2937]">{act.actorName}</span>
                      <span className="text-[10px] text-slate-400">{act.timeAgo}</span>
                    </div>
                    <p className="text-slate-600 mt-0.5">
                      {act.actionText} <strong className="text-slate-900">{act.targetTitle}</strong>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Master Data Integrity Card */}
            <div className="bg-gradient-to-br from-[#f8faf8] to-[#e8f5e9]/50 rounded-[16px] border border-emerald-200/80 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2e7d32]" />
                <h4 className="text-xs font-bold text-[#1b5e20] uppercase tracking-wider">
                  Trạng thái Master Data
                </h4>
              </div>
              <p className="text-[11px] text-[#6b7280] leading-relaxed">
                Các phân loại ẩm thực chay (Food Types), công thức (Recipes) và nguyên liệu (Ingredients) đã được cấu hình đồng bộ cùng bộ lọc AI &amp; Quét an toàn.
              </p>
              <div className="pt-2 flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => onNavigate('/admin/categories')}
                  className="w-full text-left text-xs font-semibold text-[#2e7d32] hover:underline"
                >
                  → Quản lý danh mục Master Data
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('/admin/ingredients')}
                  className="w-full text-left text-xs font-semibold text-[#2e7d32] hover:underline"
                >
                  → Quản lý từ điển nguyên liệu &amp; E-Number
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminDashboardPage
