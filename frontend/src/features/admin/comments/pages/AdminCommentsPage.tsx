import React, { useEffect, useState } from 'react'
import {
  MessageSquare,
  Eye,
  EyeOff,
  Download,
  Search,
  FileText,
  PlayCircle,
  Trash2,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react'
import { AdminLayout } from '../../../../app/layouts/AdminLayout'
import { SharedDataTable, type ColumnDef } from '../../../../shared/components/SharedDataTable'
import { CommentDetailModal } from '../components/CommentDetailModal'
import { Modal } from '../../../../shared/components/Modal'
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

export const AdminCommentsPage: React.FC<AdminCommentsPageProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<AdminCommentStats | null>(null)
  const [comments, setComments] = useState<AdminCommentItem[]>([])
  const [total, setTotal] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [currentPage, setCurrentPage] = useState<number>(1)

  // Filters
  const [statusTab, setStatusTab] = useState<'all' | 'published' | 'hidden'>('all')
  const [keyword, setKeyword] = useState<string>('')
  const [targetTypeFilter, setTargetTypeFilter] = useState<'all' | 'article' | 'video'>('all')

  // UI state
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Selected comment for modal inspection
  const [selectedComment, setSelectedComment] = useState<AdminCommentItem | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  // Confirmation Modals State (replaces window.confirm)
  const [hideTarget, setHideTarget] = useState<AdminCommentItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminCommentItem | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

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
  }, [statusTab, targetTypeFilter, keyword, currentPage, refreshTrigger])

  const handleToggleHide = async () => {
    if (!hideTarget) return
    try {
      setIsProcessing(true)
      const updated = await toggleHideComment(hideTarget.id)
      setActionSuccessMsg(
        `Đã ${updated.status === 'published' ? 'khôi phục' : 'tạm ẩn'} bình luận thành công.`
      )
      setTimeout(() => setActionSuccessMsg(null), 3000)
      setHideTarget(null)
      setRefreshTrigger((prev) => prev + 1)
    } catch {
      setError('Không thể cập nhật trạng thái bình luận.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setIsProcessing(true)
      await deleteAdminComment(deleteTarget.id)
      setActionSuccessMsg('Đã xóa vĩnh viễn bình luận thành công.')
      setTimeout(() => setActionSuccessMsg(null), 3000)
      setDeleteTarget(null)
      setRefreshTrigger((prev) => prev + 1)
    } catch {
      setError('Không thể xóa bình luận.')
    } finally {
      setIsProcessing(false)
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
  }

  const columns: ColumnDef<AdminCommentItem>[] = [
    {
      key: 'content',
      header: 'BÌNH LUẬN & NỘI DUNG',
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
            className="text-xs text-[#1f2937] line-clamp-2 leading-relaxed hover:text-[#2e7d32] cursor-pointer"
          >
            "{item.content}"
          </p>
          <div className="text-[10px] text-slate-400 font-mono">{item.createdAt}</div>
        </div>
      ),
    },
    {
      key: 'author',
      header: 'NGƯỜI BÌNH LUẬN',
      render: (item) => (
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
              item.authorAvatarBg || 'bg-slate-100 text-slate-700'
            }`}
          >
            {item.authorInitials}
          </div>
          <div className="space-y-0.5">
            <div className="font-bold text-xs text-[#1f2937] leading-none">{item.authorName}</div>
            <div className="text-[11px] text-[#6b7280] leading-none">{item.authorEmail}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'target',
      header: 'ĐÍCH BÌNH LUẬN',
      render: (item) => (
        <div className="max-w-xs space-y-0.5">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-[#6b7280]">
            {item.targetType === 'article' ? (
              <>
                <FileText className="w-3 h-3 text-[#2e7d32]" />
                <span>Bài viết:</span>
              </>
            ) : (
              <>
                <PlayCircle className="w-3 h-3 text-amber-600" />
                <span>Video:</span>
              </>
            )}
          </div>
          <div className="text-xs font-medium text-[#1f2937] line-clamp-1 leading-snug">
            {item.targetTitle}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'TRẠNG THÁI',
      render: (item) => {
        const isPub = item.status === 'published'
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
              isPub
                ? 'bg-[#e8f5e9] text-[#1b5e20] border border-emerald-300'
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isPub ? 'bg-[#2e7d32]' : 'bg-slate-400'}`} />
            <span>{item.statusLabel}</span>
          </span>
        )
      },
    },
    {
      key: 'actions',
      header: 'THAO TÁC',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => handleOpenDetailModal(item)}
            title="Xem chi tiết"
            className="p-1.5 rounded-[8px] text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setHideTarget(item)}
            title={item.status === 'published' ? 'Tạm ẩn' : 'Khôi phục hiển thị'}
            className="p-1.5 rounded-[8px] text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
          >
            {item.status === 'published' ? (
              <EyeOff className="w-3.5 h-3.5" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2e7d32]" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(item)}
            title="Xóa vĩnh viễn"
            className="p-1.5 rounded-[8px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <AdminLayout
      activeMenu="comments"
      pageTitle="Quản lý &amp; Kiểm duyệt Bình luận"
      pageSubtitle="Theo dõi thảo luận cộng đồng, xử lý báo cáo vi phạm và giữ môi trường chia sẻ văn minh."
      onNavigate={onNavigate}
    >
      <div className="space-y-6">
        {/* Action success alert */}
        {actionSuccessMsg && (
          <div className="p-4 rounded-[12px] bg-[#e8f5e9] border border-emerald-300 text-[#1b5e20] text-xs font-semibold flex items-center gap-2 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-[#2e7d32] shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* Error alert */}
        {error && (
          <div className="p-4 rounded-[12px] bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold flex items-center gap-2 shadow-2xs">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-[16px] bg-white border border-[#e5e7eb] shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)] flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6b7280]">Tổng bình luận</span>
              <div className="w-8 h-8 rounded-[10px] bg-purple-50 text-purple-600 flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-[#1f2937] tabular-nums tracking-tight">
                {stats?.totalCount ?? 0}
              </div>
              <p className="text-[11px] text-[#6b7280] mt-0.5">Toàn bộ thảo luận</p>
            </div>
          </div>

          <div className="p-5 rounded-[16px] bg-white border border-[#e5e7eb] shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)] flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6b7280]">Đang hiển thị</span>
              <div className="w-8 h-8 rounded-[10px] bg-emerald-50 text-[#2e7d32] flex items-center justify-center">
                <Eye className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-[#2e7d32] tabular-nums tracking-tight">
                {stats?.publishedCount ?? 0}
              </div>
              <p className="text-[11px] text-[#2e7d32] mt-0.5">Bình luận hợp lệ</p>
            </div>
          </div>

          <div className="p-5 rounded-[16px] bg-white border border-[#e5e7eb] shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)] flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6b7280]">Bị ẩn / Vi phạm</span>
              <div className="w-8 h-8 rounded-[10px] bg-rose-50 text-rose-600 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-rose-600 tabular-nums tracking-tight">
                {stats?.hiddenCount ?? 0}
              </div>
              <p className="text-[11px] text-rose-600 mt-0.5">Đã gỡ khỏi trang công khai</p>
            </div>
          </div>

          <div className="p-5 rounded-[16px] bg-white border border-[#e5e7eb] shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)] flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6b7280]">Tỷ lệ an toàn</span>
              <div className="w-8 h-8 rounded-[10px] bg-blue-50 text-blue-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-blue-600 tabular-nums tracking-tight">
                96.6%
              </div>
              <p className="text-[11px] text-[#6b7280] mt-0.5">Môi trường tích cực</p>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-[16px] border border-[#e5e7eb] p-4 shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            <button
              type="button"
              onClick={() => {
                setStatusTab('all')
                setCurrentPage(1)
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                statusTab === 'all'
                  ? 'border-emerald-400 bg-[#EAF5EE] text-[#1E6531] shadow-2xs'
                  : 'border-transparent text-[#1f2937] hover:bg-[#f8faf8]'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusTab('published')
                setCurrentPage(1)
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                statusTab === 'published'
                  ? 'border-emerald-400 bg-[#EAF5EE] text-[#1E6531] shadow-2xs'
                  : 'border-transparent text-[#1f2937] hover:bg-[#f8faf8]'
              }`}
            >
              Đang hiển thị
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusTab('hidden')
                setCurrentPage(1)
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                statusTab === 'hidden'
                  ? 'border-emerald-400 bg-[#EAF5EE] text-[#1E6531] shadow-2xs'
                  : 'border-transparent text-[#1f2937] hover:bg-[#f8faf8]'
              }`}
            >
              Bị ẩn / Vi phạm ({stats?.hiddenCount ?? 0})
            </button>

            <span className="text-slate-300 mx-1">|</span>

            <select
              value={targetTypeFilter}
              onChange={(e) => {
                setTargetTypeFilter(e.target.value as 'all' | 'article' | 'video')
                setCurrentPage(1)
              }}
              className="px-3 py-2 rounded-[10px] border border-[#e5e7eb] text-xs font-semibold text-[#1f2937] focus:outline-none"
            >
              <option value="all">Mọi nội dung</option>
              <option value="article">Bình luận bài viết</option>
              <option value="video">Bình luận video</option>
            </select>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative min-w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Tìm nội dung, người bình luận..."
                className="w-full pl-9 pr-3 py-2 rounded-[10px] border border-[#e5e7eb] text-xs text-[#1f2937] focus:outline-none focus:border-[#2e7d32]"
              />
            </div>

            <button
              type="button"
              onClick={handleExportData}
              className="h-9 px-3.5 rounded-[10px] bg-white border border-[#e5e7eb] text-[#1f2937] hover:bg-[#f8faf8] text-xs font-semibold transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Xuất dữ liệu</span>
            </button>
          </div>
        </div>

        {/* Shared Data Table */}
        <SharedDataTable<AdminCommentItem>
          title="Danh sách Bình luận &amp; Kiểm duyệt Cộng đồng"
          totalCountBadge={total}
          updatedAtText="Đồng bộ thời gian thực"
          columns={columns}
          data={comments}
          keyExtractor={(item) => item.id}
          isLoading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={total}
          pageSize={6}
          onPageChange={(p) => setCurrentPage(p)}
          emptyMessage="Không có bình luận nào phù hợp."
        />

        {/* Comment Detail Modal */}
        <CommentDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          comment={selectedComment}
          onToggleStatus={async (id: string) => {
            await toggleHideComment(id)
            setIsDetailModalOpen(false)
            setRefreshTrigger((prev) => prev + 1)
          }}
          onDelete={async (id: string) => {
            await deleteAdminComment(id)
            setIsDetailModalOpen(false)
            setRefreshTrigger((prev) => prev + 1)
          }}
        />

        {/* Modal Confirm Toggle Hide */}
        <Modal
          isOpen={Boolean(hideTarget)}
          onClose={() => setHideTarget(null)}
          title={hideTarget?.status === 'published' ? 'Xác nhận Tạm ẩn bình luận' : 'Khôi phục hiển thị bình luận'}
          maxWidth="sm"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-[12px] bg-slate-50 border border-slate-200 text-xs text-[#1f2937] leading-relaxed">
              Bạn có chắc chắn muốn {hideTarget?.status === 'published' ? 'tạm ẩn' : 'khôi phục'} bình luận của{' '}
              <strong>"{hideTarget?.authorName}"</strong>?
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setHideTarget(null)}
                className="px-4 py-2 rounded-[10px] border border-[#e5e7eb] text-xs font-semibold text-[#1f2937] hover:bg-[#f8faf8] cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleToggleHide}
                className="px-4 py-2 rounded-[10px] bg-[#2e7d32] hover:bg-[#1b5e20] text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? 'Đang lưu...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </Modal>

        {/* Modal Confirm Delete */}
        <Modal
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          title="Xác nhận Xóa vĩnh viễn Bình luận"
          maxWidth="sm"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-[12px] bg-rose-50 border border-rose-200 text-xs text-rose-800 leading-relaxed">
              Bạn có chắc chắn muốn xóa vĩnh viễn bình luận này? Hành động này không thể hoàn tác.
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-[10px] border border-[#e5e7eb] text-xs font-semibold text-[#1f2937] hover:bg-[#f8faf8] cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleDelete}
                className="px-4 py-2 rounded-[10px] bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  )
}

export default AdminCommentsPage
