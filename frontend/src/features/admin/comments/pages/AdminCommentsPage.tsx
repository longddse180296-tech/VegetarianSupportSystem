import React, { useEffect, useState } from 'react'
import {
  MessageSquare,
  Eye,
  EyeOff,
  Download,
  RefreshCw,
  Search,
  FileText,
  PlayCircle,
  MoreVertical,
  RotateCcw,
  Trash2,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react'
import { AdminLayout } from '../../../../app/layouts/AdminLayout'
import { SharedDataTable, type ColumnDef } from '../../../../shared/components/SharedDataTable'
import { CommentDetailModal } from '../components/CommentDetailModal'
import {
  deleteAdminComment,
  getAdminComments,
  getAdminCommentStats,
  toggleHideComment,
} from '../api/adminCommentsApi'
import type {
  AdminCommentItem,
  AdminCommentStats,
} from '../types/adminComments.types'

interface AdminCommentsPageProps {
  onNavigate?: (path: string) => void
}

export const AdminCommentsPage: React.FC<AdminCommentsPageProps> = ({
  onNavigate,
}) => {
  const [stats, setStats] = useState<AdminCommentStats | null>(null)
  const [comments, setComments] = useState<AdminCommentItem[]>([])
  const [total, setTotal] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [currentPage, setCurrentPage] = useState<number>(1)

  // Filters
  const [statusTab, setStatusTab] = useState<'all' | 'published' | 'hidden'>('all')
  const [keyword, setKeyword] = useState<string>('')
  const [targetTypeFilter, setTargetTypeFilter] = useState<'all' | 'article' | 'video'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest')

  // UI state
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Selected comment for modal inspection
  const [selectedComment, setSelectedComment] = useState<AdminCommentItem | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  // Action popover state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const [statsRes, commentsRes] = await Promise.all([
          getAdminCommentStats(),
          getAdminComments({
            status: statusTab,
            targetType: targetTypeFilter,
            keyword,
            sortBy,
            page: currentPage,
            pageSize: 6,
          }),
        ])
        if (isMounted) {
          setStats(statsRes)
          setComments(commentsRes.items)
          setTotal(commentsRes.total)
          setTotalPages(commentsRes.totalPages)
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Lỗi khi tải danh sách bình luận')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    void fetchData()
    return () => {
      isMounted = false
    }
  }, [statusTab, targetTypeFilter, keyword, sortBy, currentPage, refreshTrigger])

  // Close menus when clicking outside
  useEffect(() => {
    const handleOutsideClick = () => setOpenMenuId(null)
    window.addEventListener('click', handleOutsideClick)
    return () => window.removeEventListener('click', handleOutsideClick)
  }, [])

  const handleToggleHide = async (id: string) => {
    try {
      setOpenMenuId(null)
      const updated = await toggleHideComment(id)
      setActionSuccessMsg(
        `Đã ${updated.status === 'published' ? 'khôi phục' : 'tạm ẩn'} bình luận thành công.`
      )
      setTimeout(() => setActionSuccessMsg(null), 3000)
      setRefreshTrigger((prev) => prev + 1)
    } catch {
      setError('Không thể cập nhật trạng thái bình luận.')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      setOpenMenuId(null)
      await deleteAdminComment(id)
      setActionSuccessMsg('Đã xóa vĩnh viễn bình luận thành công.')
      setTimeout(() => setActionSuccessMsg(null), 3000)
      setRefreshTrigger((prev) => prev + 1)
    } catch {
      setError('Không thể xóa bình luận.')
    }
  }

  const handleExportData = () => {
    const jsonStr = JSON.stringify(comments, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `comments_export_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleOpenDetailModal = (item: AdminCommentItem) => {
    setSelectedComment(item)
    setIsDetailModalOpen(true)
    setOpenMenuId(null)
  }

  const columns: ColumnDef<AdminCommentItem>[] = [
    {
      key: 'content',
      header: 'BÌNH LUẬN',
      render: (item) => (
        <div className="max-w-xs space-y-1">
          {item.isViolation && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
              <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
              <span>{item.violationReason || 'Vi phạm quy tắc cộng đồng'}</span>
            </span>
          )}
          <p
            onClick={() => handleOpenDetailModal(item)}
            className={`text-xs line-clamp-2 cursor-pointer hover:text-emerald-700 leading-relaxed ${
              item.isViolation ? 'text-rose-700 italic font-medium' : 'text-gray-900 font-normal'
            }`}
          >
            {item.content}
          </p>
        </div>
      ),
    },
    {
      key: 'authorName',
      header: 'NGƯỜI DÙNG',
      render: (item) => (
        <div className="flex items-center gap-2.5">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
              item.authorAvatarBg || 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {item.authorInitials}
          </div>
          <div className="min-w-0">
            <span className="font-bold text-gray-900 text-xs block truncate leading-tight">
              {item.authorName}
            </span>
            <span className="text-[11px] text-gray-400 block truncate mt-0.5 leading-tight">
              {item.authorEmail}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'targetTitle',
      header: 'BÀI VIẾT / NỘI DUNG',
      render: (item) => (
        <div className="flex items-center gap-2 max-w-xs">
          {item.targetType === 'article' ? (
            <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <PlayCircle className="w-4 h-4 text-teal-600 shrink-0" />
          )}
          <span
            onClick={() => {
              if (item.targetType === 'article') {
                onNavigate?.('/articles/art-1')
              }
            }}
            className="text-xs font-semibold text-gray-800 line-clamp-1 hover:text-emerald-700 cursor-pointer"
            title={item.targetTitle}
          >
            {item.targetTitle}
          </span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'NGÀY ĐĂNG',
      render: (item) => (
        <span className="text-gray-500 text-xs whitespace-nowrap">
          {item.createdAt}
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
        <div className="flex items-center justify-end gap-1.5 relative">
          <button
            type="button"
            onClick={() => handleOpenDetailModal(item)}
            className="text-xs font-bold text-gray-700 hover:text-emerald-700 px-2 py-1 rounded-lg hover:bg-emerald-50 transition-colors"
          >
            Xem
          </button>

          {/* Three vertical dots */}
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
                className="absolute right-0 top-full mt-1 w-44 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-30 animate-in fade-in zoom-in-95 text-xs font-semibold"
              >
                <button
                  type="button"
                  onClick={() => handleOpenDetailModal(item)}
                  className="w-full text-left px-3.5 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Xem chi tiết</span>
                </button>
                <button
                  type="button"
                  onClick={() => void handleToggleHide(item.id)}
                  className="w-full text-left px-3.5 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                >
                  {item.status === 'published' ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                      <span>Ẩn bình luận</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Khôi phục hiển thị</span>
                    </>
                  )}
                </button>
                <div className="h-px bg-gray-100 my-1" />
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Bạn có chắc muốn xóa bình luận này?')) {
                      void handleDelete(item.id)
                    }
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa bình luận</span>
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
      activeMenu="comments"
      pageTitle="Quản lý Bình luận"
      pageSubtitle="Xem và quản lý các bình luận được đăng trên hệ thống."
      onNavigate={onNavigate}
    >
      <div className="space-y-6 pb-12">
        {/* Top Header Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 -mt-2">
          <div className="text-xs text-gray-500 font-medium">
            Kênh tương tác và phản hồi của cộng đồng ăn chay
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExportData}
              className="px-4 py-2 rounded-2xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-gray-500" />
              <span>Xuất dữ liệu</span>
            </button>
            <button
              type="button"
              onClick={() => setRefreshTrigger((prev) => prev + 1)}
              className="px-4 py-2 rounded-2xl bg-[#1E6531] hover:bg-[#164e25] text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Làm mới</span>
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

        {/* Stats Row (3 Cards matching Figma Image 1) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Tổng bình luận */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <MessageSquare className="w-6 h-6" />
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-100">
                <TrendingUp className="w-3.5 h-3.5 text-sky-600" />
                <span>+12% tháng này</span>
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
                {stats?.totalCount ?? 412}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Tổng bình luận trên hệ thống
              </p>
            </div>
          </div>

          {/* Card 2: Bình luận đang hiển thị */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-[#EAF5EE] text-[#1E6531] flex items-center justify-center">
                <Eye className="w-6 h-6" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EAF5EE] text-[#1E6531] border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>96.6% khả dụng</span>
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
                {stats?.publishedCount ?? 398}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Bình luận đang hiển thị
              </p>
            </div>
          </div>

          {/* Card 3: Bình luận đã ẩn / gỡ */}
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
                {stats?.hiddenCount ?? 14}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Bình luận đã ẩn / gỡ
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
              placeholder="Tìm kiếm theo nội dung bình luận hoặc người dùng..."
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
                Tất cả (412)
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
                Đang hiển thị (398)
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
                Đã ẩn / gỡ (14)
              </button>
            </div>

            {/* Target type filter */}
            <select
              value={targetTypeFilter}
              onChange={(e) => {
                setTargetTypeFilter(e.target.value as 'all' | 'article' | 'video')
                setCurrentPage(1)
              }}
              className="px-3.5 py-2 bg-white rounded-2xl border border-slate-200 text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
            >
              <option value="all">Tất cả nội dung</option>
              <option value="article">Bài viết</option>
              <option value="video">Video</option>
            </select>

            {/* Sort Select */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as 'newest' | 'oldest')
                setCurrentPage(1)
              }}
              className="px-3.5 py-2 bg-white rounded-2xl border border-slate-200 text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
            </select>
          </div>
        </div>

        {/* Data Table Container using SharedDataTable */}
        <SharedDataTable<AdminCommentItem>
          title="Danh sách bình luận"
          totalCountBadge={`${total} bình luận`}
          updatedAtText="Cập nhật lúc 15:30 hôm nay"
          columns={columns}
          data={comments}
          keyExtractor={(item) => item.id}
          isLoading={loading}
          error={error}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={total}
          pageSize={6}
          onPageChange={setCurrentPage}
          emptyMessage="Không tìm thấy bình luận nào phù hợp."
        />
      </div>

      {/* Comment Detail / Moderation Modal */}
      <CommentDetailModal
        isOpen={isDetailModalOpen}
        comment={selectedComment}
        onClose={() => setIsDetailModalOpen(false)}
        onToggleStatus={handleToggleHide}
        onDelete={handleDelete}
        onNavigateToTarget={(targetType, targetId) => {
          setIsDetailModalOpen(false)
          if (targetType === 'article') {
            onNavigate?.(`/articles/${targetId}`)
          }
        }}
      />
    </AdminLayout>
  )
}
export default AdminCommentsPage
