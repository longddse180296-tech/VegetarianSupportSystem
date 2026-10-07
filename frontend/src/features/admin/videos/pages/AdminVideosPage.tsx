import React, { useEffect, useState } from 'react'
import {
  Video as VideoIcon,
  Play,
  EyeOff,
  RefreshCw,
  Plus,
  Search,
  MoreVertical,
  RotateCcw,
  Trash2,
  TrendingUp,
  Sparkles,
  ExternalLink,
} from 'lucide-react'
import { AdminLayout } from '../../../../app/layouts/AdminLayout'
import { SharedDataTable, type ColumnDef } from '../../../../shared/components/SharedDataTable'
import { VideoModal } from '../components/VideoModal'
import {
  createAdminVideo,
  deleteAdminVideo,
  getAdminVideos,
  getAdminVideoStats,
  toggleHideVideo,
  updateAdminVideo,
} from '../api/adminVideosApi'
import type {
  AdminVideoItem,
  AdminVideoStats,
  VideoFormData,
} from '../types/adminVideos.types'

interface AdminVideosPageProps {
  onNavigate?: (path: string) => void
}

export const AdminVideosPage: React.FC<AdminVideosPageProps> = ({
  onNavigate,
}) => {
  const [stats, setStats] = useState<AdminVideoStats | null>(null)
  const [videos, setVideos] = useState<AdminVideoItem[]>([])
  const [total, setTotal] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [currentPage, setCurrentPage] = useState<number>(1)

  // Filters
  const [statusTab, setStatusTab] = useState<'all' | 'published' | 'hidden'>('all')
  const [keyword, setKeyword] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'duration' | 'title'>('newest')

  // UI state
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Popover menu state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVideo, setEditingVideo] = useState<AdminVideoItem | null>(null)

  useEffect(() => {
    let isMounted = true
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const [statsRes, listRes] = await Promise.all([
          getAdminVideoStats(),
          getAdminVideos({
            status: statusTab,
            category: categoryFilter,
            keyword,
            sortBy,
            page: currentPage,
            pageSize: 6,
          }),
        ])
        if (isMounted) {
          setStats(statsRes)
          setVideos(listRes.items)
          setTotal(listRes.total)
          setTotalPages(listRes.totalPages)
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Lỗi khi tải danh sách video')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    void fetchData()
    return () => {
      isMounted = false
    }
  }, [statusTab, categoryFilter, keyword, sortBy, currentPage, refreshTrigger])

  // Close open popovers when clicking outside
  useEffect(() => {
    const handleOutsideClick = () => setOpenMenuId(null)
    window.addEventListener('click', handleOutsideClick)
    return () => window.removeEventListener('click', handleOutsideClick)
  }, [])

  const handleOpenCreateModal = () => {
    setEditingVideo(null)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (vid: AdminVideoItem) => {
    setEditingVideo(vid)
    setIsModalOpen(true)
    setOpenMenuId(null)
  }

  const handleModalSubmit = async (data: VideoFormData) => {
    if (editingVideo) {
      await updateAdminVideo(editingVideo.id, data)
      setActionSuccessMsg(`Đã cập nhật video "${data.title}" thành công!`)
    } else {
      await createAdminVideo(data)
      setActionSuccessMsg(`Đã thêm video mới "${data.title}" thành công!`)
    }
    setTimeout(() => setActionSuccessMsg(null), 3000)
    setRefreshTrigger((prev) => prev + 1)
  }

  const handleToggleHide = async (id: string, title: string) => {
    try {
      setOpenMenuId(null)
      const res = await toggleHideVideo(id)
      setActionSuccessMsg(
        `Đã ${res.status === 'published' ? 'khôi phục' : 'tạm ẩn'} video "${title}".`
      )
      setTimeout(() => setActionSuccessMsg(null), 3000)
      setRefreshTrigger((prev) => prev + 1)
    } catch {
      setError('Không thể cập nhật trạng thái video.')
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa vĩnh viễn video "${title}"?`)) {
      return
    }
    try {
      setOpenMenuId(null)
      await deleteAdminVideo(id)
      setActionSuccessMsg(`Đã xóa video "${title}" thành công.`)
      setTimeout(() => setActionSuccessMsg(null), 3000)
      setRefreshTrigger((prev) => prev + 1)
    } catch {
      setError('Không thể xóa video.')
    }
  }

  const columns: ColumnDef<AdminVideoItem>[] = [
    {
      key: 'title',
      header: 'VIDEO',
      render: (item) => (
        <div className="flex items-center gap-3.5 max-w-sm">
          {/* Thumbnail preview with play icon */}
          <div className="w-20 h-13 rounded-2xl bg-slate-900 overflow-hidden relative shrink-0 group border border-slate-200 shadow-xs flex items-center justify-center">
            {item.thumbnailUrl ? (
              <img
                src={item.thumbnailUrl}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                <VideoIcon className="w-6 h-6 text-slate-500" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-xs">
                <Play className="w-3 h-3 fill-slate-900 ml-0.5" />
              </div>
            </div>
          </div>

          <div className="min-w-0">
            <h4
              onClick={() => handleOpenEditModal(item)}
              className="font-bold text-gray-900 text-xs line-clamp-2 hover:text-emerald-700 cursor-pointer leading-snug"
            >
              {item.title}
            </h4>
            <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-1">
              <span>Độ phân giải: {item.resolution}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'authorName',
      header: 'NGƯỜI ĐĂNG',
      render: (item) => (
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
              item.authorAvatarBg || 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {item.authorInitials}
          </div>
          <span className="font-semibold text-gray-800 text-xs whitespace-nowrap">
            {item.authorName}
          </span>
        </div>
      ),
    },
    {
      key: 'categoryLabel',
      header: 'DANH MỤC',
      render: (item) => (
        <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
          {item.categoryLabel}
        </span>
      ),
    },
    {
      key: 'publishedAt',
      header: 'NGÀY ĐĂNG',
      render: (item) => (
        <span className="text-gray-500 text-xs whitespace-nowrap">
          {item.publishedAt}
        </span>
      ),
    },
    {
      key: 'duration',
      header: 'THỜI LƯỢNG',
      render: (item) => (
        <span className="font-semibold text-gray-800 text-xs font-mono whitespace-nowrap">
          {item.duration}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'TRẠNG THÁI',
      render: (item) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${
            item.status === 'published'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
              : 'bg-rose-50 text-rose-700 border border-rose-100'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              item.status === 'published' ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
          />
          {item.statusLabel}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'THAO TÁC',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end relative">
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setOpenMenuId(openMenuId === item.id ? null : item.id)
              }}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Thao tác"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {openMenuId === item.id && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-1 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-30 animate-in fade-in zoom-in-95 text-xs font-semibold"
              >
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(item)}
                  className="w-full text-left px-3.5 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Xem chi tiết video</span>
                </button>
                <a
                  href={item.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full text-left px-3.5 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  <span>Mở xem trên YouTube</span>
                </a>
                <button
                  type="button"
                  onClick={() => void handleToggleHide(item.id, item.title)}
                  className="w-full text-left px-3.5 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                >
                  {item.status === 'published' ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                      <span>Ẩn / Gỡ video</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Khôi phục video</span>
                    </>
                  )}
                </button>
                <div className="h-px bg-gray-100 my-1" />
                <button
                  type="button"
                  onClick={() => void handleDelete(item.id, item.title)}
                  className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa video vĩnh viễn</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ),
    },
  ]

  return (
    <AdminLayout
      activeMenu="videos"
      pageTitle="Quản lý Video"
      pageSubtitle="Xem và quản lý các video hướng dẫn nấu ăn được đăng trên hệ thống."
      onNavigate={onNavigate}
    >
      <div className="space-y-6 pb-12">
        {/* Top Header Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 -mt-2">
          <div className="text-xs text-gray-500 font-medium">
            Kênh video hướng dẫn nấu chay trực quan
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setRefreshTrigger((prev) => prev + 1)}
              className="px-3.5 py-2 rounded-2xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-xs flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Làm mới</span>
            </button>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-2xl bg-[#1E6531] hover:bg-[#164e25] text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm video mới</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {actionSuccessMsg && (
          <div className="p-3.5 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs font-medium flex items-center justify-between animate-in fade-in">
            <span>✓ {actionSuccessMsg}</span>
            <button
              type="button"
              onClick={() => setActionSuccessMsg(null)}
              className="text-emerald-600 hover:text-emerald-900 font-bold ml-2 text-xs"
            >
              Đóng
            </button>
          </div>
        )}

        {/* Stats Row (3 Cards matching Figma Image 2) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Tổng video trên hệ thống */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-[#EAF5EE] text-[#1E6531] flex items-center justify-center">
                <VideoIcon className="w-6 h-6" />
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#EAF5EE] text-[#1E6531]">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+5% tháng này</span>
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
                {stats?.totalCount ?? 35}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Tổng video trên hệ thống
              </p>
            </div>
          </div>

          {/* Card 2: Video đang hiển thị */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-[#EAF5EE] text-[#1E6531] flex items-center justify-center">
                <Play className="w-6 h-6 fill-[#1E6531]" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EAF5EE] text-[#1E6531] border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>88.6% hoạt động</span>
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
                {stats?.publishedCount ?? 31}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Video đang hiển thị
              </p>
            </div>
          </div>

          {/* Card 3: Video đã ẩn / gỡ */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <EyeOff className="w-6 h-6" />
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>Cần kiểm duyệt</span>
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
                {stats?.hiddenCount ?? 4}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Video đã ẩn / gỡ
              </p>
            </div>
          </div>
        </div>

        {/* Search, Tabs and Dropdowns Filter Bar */}
        <div className="bg-white rounded-3xl p-3 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
          {/* Left: Search input */}
          <div className="relative flex-1 min-w-[280px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên video hoặc người đăng..."
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-11 pr-4 py-2 text-xs bg-transparent rounded-2xl focus:outline-none placeholder:text-gray-400 text-gray-900"
            />
          </div>

          {/* Right: Tabs & Selects */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Tabs matching Figma */}
            <div className="flex items-center p-1 bg-slate-50 rounded-2xl border border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setStatusTab('all')
                  setCurrentPage(1)
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusTab === 'all'
                    ? 'bg-[#1E6531] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Tất cả (35)
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusTab('published')
                  setCurrentPage(1)
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusTab === 'published'
                    ? 'bg-[#1E6531] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Đang hiển thị (31)
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusTab('hidden')
                  setCurrentPage(1)
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusTab === 'hidden'
                    ? 'bg-[#1E6531] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Đã ẩn / gỡ (4)
              </button>
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3.5 py-2 bg-white rounded-2xl border border-slate-200 text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
            >
              <option value="all">Tất cả danh mục</option>
              <option value="main-dish">Món chính</option>
              <option value="salad">Salad</option>
              <option value="soup">Món nước</option>
              <option value="drinks">Đồ uống</option>
              <option value="cooking-tips">Mẹo nấu ăn</option>
            </select>

            {/* Sort Select */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as 'newest' | 'duration' | 'title')
                setCurrentPage(1)
              }}
              className="px-3.5 py-2 bg-white rounded-2xl border border-slate-200 text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
            >
              <option value="newest">Mới nhất</option>
              <option value="duration">Thời lượng ngắn nhất</option>
              <option value="title">Theo tên A - Z</option>
            </select>
          </div>
        </div>

        {/* Data Table Container using SharedDataTable */}
        <SharedDataTable<AdminVideoItem>
          title="Danh sách video"
          totalCountBadge={`${total} video`}
          updatedAtText="Cập nhật lúc 15:30 hôm nay"
          columns={columns}
          data={videos}
          keyExtractor={(item) => item.id}
          isLoading={loading}
          error={error}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={total}
          pageSize={6}
          onPageChange={setCurrentPage}
          emptyMessage="Không tìm thấy video nào phù hợp."
        />
      </div>

      {/* Video Create / Edit Modal */}
      <VideoModal
        isOpen={isModalOpen}
        videoToEdit={editingVideo}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
      />
    </AdminLayout>
  )
}
export default AdminVideosPage
