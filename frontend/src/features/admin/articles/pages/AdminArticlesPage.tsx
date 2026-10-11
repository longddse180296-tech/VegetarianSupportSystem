import React, { useEffect, useState } from 'react'
import {
  FileText,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle,
  XCircle,
  CheckCircle2,
  Search,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import { AdminLayout } from '../../../../app/layouts/AdminLayout'
import { SharedDataTable, type ColumnDef } from '../../../../shared/components/SharedDataTable'
import { Modal } from '../../../../shared/components/Modal'
import {
  deleteAdminArticle,
  getAdminArticles,
  getAdminArticleStats,
  toggleHideArticle,
  approveArticle,
  rejectArticle,
} from '../api/adminArticlesApi'
import type {
  AdminArticleItem,
  AdminArticleStats,
  AdminArticleStatus,
} from '../types/adminArticles.types'

interface AdminArticlesPageProps {
  onNavigate?: (path: string) => void
}

export const AdminArticlesPage: React.FC<AdminArticlesPageProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<AdminArticleStats | null>(null)
  const [articles, setArticles] = useState<AdminArticleItem[]>([])
  const [total, setTotal] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [currentPage, setCurrentPage] = useState<number>(1)

  const [statusTab, setStatusTab] = useState<'all' | AdminArticleStatus>('all')
  const [keyword, setKeyword] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'reads' | 'votes'>('newest')

  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Confirmation Modals State (replacing window.confirm)
  const [approveTarget, setApproveTarget] = useState<AdminArticleItem | null>(null)
  const [rejectTarget, setRejectTarget] = useState<AdminArticleItem | null>(null)
  const [rejectReason, setRejectReason] = useState<string>('')
  const [hideTarget, setHideTarget] = useState<AdminArticleItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminArticleItem | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Load stats and articles
  useEffect(() => {
    let isMounted = true
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const [statsRes, articlesRes] = await Promise.all([
          getAdminArticleStats(),
          getAdminArticles({
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
          setArticles(articlesRes.items)
          setTotal(articlesRes.total)
          setTotalPages(articlesRes.totalPages)
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Lỗi khi tải danh sách bài viết')
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

  const handleApprove = async () => {
    if (!approveTarget) return
    try {
      setIsProcessing(true)
      await approveArticle(approveTarget.id)
      setActionSuccessMsg(`Đã phê duyệt và xuất bản bài viết "${approveTarget.title}".`)
      setTimeout(() => setActionSuccessMsg(null), 3000)
      setApproveTarget(null)
      setRefreshTrigger((prev) => prev + 1)
    } catch {
      setError('Lỗi khi phê duyệt bài viết.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!rejectTarget) return
    try {
      setIsProcessing(true)
      await rejectArticle(rejectTarget.id, rejectReason || 'Nội dung chưa đạt tiêu chuẩn kiểm duyệt')
      setActionSuccessMsg(`Đã từ chối bài viết "${rejectTarget.title}".`)
      setTimeout(() => setActionSuccessMsg(null), 3000)
      setRejectTarget(null)
      setRejectReason('')
      setRefreshTrigger((prev) => prev + 1)
    } catch {
      setError('Lỗi khi từ chối bài viết.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleToggleHide = async () => {
    if (!hideTarget) return
    try {
      setIsProcessing(true)
      const res = await toggleHideArticle(hideTarget.id)
      setActionSuccessMsg(
        `Đã ${res.status === 'published' ? 'khôi phục hiển thị' : 'tạm ẩn'} bài viết "${hideTarget.title}".`
      )
      setTimeout(() => setActionSuccessMsg(null), 3000)
      setHideTarget(null)
      setRefreshTrigger((prev) => prev + 1)
    } catch {
      setError('Không thể thay đổi trạng thái ẩn/hiện.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setIsProcessing(true)
      await deleteAdminArticle(deleteTarget.id)
      setActionSuccessMsg(`Đã xóa vĩnh viễn bài viết "${deleteTarget.title}".`)
      setTimeout(() => setActionSuccessMsg(null), 3000)
      setDeleteTarget(null)
      setRefreshTrigger((prev) => prev + 1)
    } catch {
      setError('Không thể xóa bài viết.')
    } finally {
      setIsProcessing(false)
    }
  }

  const columns: ColumnDef<AdminArticleItem>[] = [
    {
      key: 'title',
      header: 'BÀI VIẾT & TÁC GIẢ',
      render: (item) => (
        <div className="space-y-1 max-w-sm">
          <div className="font-bold text-xs text-[#1f2937] leading-snug line-clamp-2">
            {item.title}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-[#6b7280]">
            <span
              className={`w-5 h-5 rounded-full inline-flex items-center justify-center font-bold text-[9px] ${
                item.authorColorClass || 'bg-slate-100 text-slate-700'
              }`}
            >
              {item.authorInitials}
            </span>
            <span>{item.authorName}</span>
            <span>•</span>
            <span>{item.wordCount} từ</span>
            <span>•</span>
            <span>~{item.readTimeMinutes} phút đọc</span>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'CHUYÊN MỤC',
      render: (item) => (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#e8f5e9] text-[#1b5e20] border border-emerald-200">
          {item.categoryLabel}
        </span>
      ),
    },
    {
      key: 'stats',
      header: 'LƯỢT ĐỌC & TƯƠNG TÁC',
      render: (item) => (
        <div className="text-xs text-[#1f2937] tabular-nums space-y-0.5">
          <div>
            <strong>{item.readCount.toLocaleString()}</strong> lượt đọc
          </div>
          <div className="text-[11px] text-[#6b7280]">
            {item.voteCount} lượt hữu ích
          </div>
        </div>
      ),
    },
    {
      key: 'publishedAt',
      header: 'NGÀY ĐĂNG',
      render: (item) => (
        <span className="text-xs text-[#6b7280]">{item.publishedAt}</span>
      ),
    },
    {
      key: 'status',
      header: 'TRẠNG THÁI KIỂM DUYỆT',
      render: (item) => {
        const badgeMap = {
          published: {
            bg: 'bg-[#e8f5e9]',
            color: 'text-[#1b5e20] border-emerald-300',
            label: 'Đang hiển thị',
            dot: 'bg-[#2e7d32]',
          },
          pending: {
            bg: 'bg-amber-50',
            color: 'text-amber-800 border-amber-300',
            label: 'Chờ kiểm duyệt',
            dot: 'bg-amber-500',
          },
          hidden: {
            bg: 'bg-slate-100',
            color: 'text-slate-600 border-slate-200',
            label: 'Đã tạm ẩn',
            dot: 'bg-slate-400',
          },
        }[item.status]

        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badgeMap.bg} ${badgeMap.color}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${badgeMap.dot}`} />
            <span>{badgeMap.label}</span>
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
          {item.status === 'pending' && (
            <>
              <button
                type="button"
                onClick={() => setApproveTarget(item)}
                title="Duyệt xuất bản bài viết"
                className="p-1.5 rounded-[8px] text-[#2e7d32] hover:bg-[#e8f5e9] transition-colors cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setRejectTarget(item)}
                title="Từ chối bài viết"
                className="p-1.5 rounded-[8px] text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}

          {item.status !== 'pending' && (
            <button
              type="button"
              onClick={() => setHideTarget(item)}
              title={item.status === 'published' ? 'Tạm ẩn bài viết' : 'Khôi phục hiển thị'}
              className="p-1.5 rounded-[8px] text-slate-400 hover:text-[#2e7d32] hover:bg-[#e8f5e9] transition-colors cursor-pointer"
            >
              {item.status === 'published' ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
            </button>
          )}

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
      activeMenu="articles"
      pageTitle="Quản lý &amp; Kiểm duyệt Bài viết"
      pageSubtitle="Kiểm duyệt nội dung chia sẻ kiến thức, dinh dưỡng và cẩm nang sống xanh từ cộng đồng."
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
              <span className="text-xs font-semibold text-[#6b7280]">Tổng bài viết</span>
              <div className="w-8 h-8 rounded-[10px] bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-[#1f2937] tabular-nums tracking-tight">
                {stats?.totalCount ?? 0}
              </div>
              <p className="text-[11px] text-[#6b7280] mt-0.5">{stats?.monthlyGrowthText}</p>
            </div>
          </div>

          <div className="p-5 rounded-[16px] bg-white border border-[#e5e7eb] shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)] flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6b7280]">Đang hiển thị</span>
              <div className="w-8 h-8 rounded-[10px] bg-emerald-50 text-[#2e7d32] flex items-center justify-center">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-[#2e7d32] tabular-nums tracking-tight">
                {stats?.publishedCount ?? 0}
              </div>
              <p className="text-[11px] text-[#2e7d32] mt-0.5">Tiếp cận cộng đồng</p>
            </div>
          </div>

          <div className="p-5 rounded-[16px] bg-white border border-[#e5e7eb] shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)] flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6b7280]">Chờ kiểm duyệt</span>
              <div className="w-8 h-8 rounded-[10px] bg-amber-50 text-amber-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-amber-700 tabular-nums tracking-tight">
                {stats?.pendingCount ?? 0}
              </div>
              <p className="text-[11px] text-amber-700 mt-0.5">Cần Admin phê duyệt</p>
            </div>
          </div>

          <div className="p-5 rounded-[16px] bg-white border border-[#e5e7eb] shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)] flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6b7280]">Đã tạm ẩn / gỡ</span>
              <div className="w-8 h-8 rounded-[10px] bg-slate-100 text-slate-600 flex items-center justify-center">
                <EyeOff className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-700 tabular-nums tracking-tight">
                {stats?.hiddenCount ?? 0}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Không công khai</p>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-[16px] border border-[#e5e7eb] p-4 shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
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
              Tất cả bài viết
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
                setStatusTab('pending')
                setCurrentPage(1)
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                statusTab === 'pending'
                  ? 'border-emerald-400 bg-[#EAF5EE] text-[#1E6531] shadow-2xs'
                  : 'border-transparent text-[#1f2937] hover:bg-[#f8faf8]'
              }`}
            >
              Chờ kiểm duyệt ({stats?.pendingCount ?? 0})
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
              Đã tạm ẩn
            </button>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-2 rounded-[10px] border border-[#e5e7eb] text-xs font-semibold text-[#1f2937] focus:outline-none"
            >
              <option value="all">Mọi chuyên mục</option>
              <option value="nutrition">Dinh dưỡng</option>
              <option value="cooking-tips">Mẹo nấu ăn</option>
              <option value="lifestyle">Lối sống chay</option>
              <option value="ingredients">Nguyên liệu</option>
              <option value="health">Sức khỏe</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as 'newest' | 'reads' | 'votes')
                setCurrentPage(1)
              }}
              className="px-3 py-2 rounded-[10px] border border-[#e5e7eb] text-xs font-semibold text-[#1f2937] focus:outline-none"
            >
              <option value="newest">Mới nhất</option>
              <option value="reads">Xem nhiều nhất</option>
              <option value="votes">Bình chọn cao nhất</option>
            </select>

            <div className="relative min-w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Tìm tiêu đề, tác giả..."
                className="w-full pl-9 pr-3 py-2 rounded-[10px] border border-[#e5e7eb] text-xs text-[#1f2937] focus:outline-none focus:border-[#2e7d32]"
              />
            </div>

            <button
              type="button"
              onClick={() => onNavigate?.('/articles/create')}
              className="h-9 px-4 rounded-[10px] bg-[#2e7d32] hover:bg-[#1b5e20] text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Viết bài mới</span>
            </button>
          </div>
        </div>

        {/* Shared Data Table */}
        <SharedDataTable<AdminArticleItem>
          title="Danh sách Bài viết Quản trị"
          totalCountBadge={total}
          updatedAtText="Đồng bộ thời gian thực"
          columns={columns}
          data={articles}
          keyExtractor={(item) => item.id}
          isLoading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={total}
          pageSize={6}
          onPageChange={(p) => setCurrentPage(p)}
          emptyMessage="Không tìm thấy bài viết nào phù hợp."
        />

        {/* Modal Confirm Approve */}
        <Modal
          isOpen={Boolean(approveTarget)}
          onClose={() => setApproveTarget(null)}
          title="Xác nhận Phê duyệt Xuất bản"
          maxWidth="sm"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-[12px] bg-emerald-50 border border-emerald-200 text-xs text-[#1b5e20] leading-relaxed">
              Bạn có chắc chắn muốn phê duyệt bài viết <strong>"{approveTarget?.title}"</strong>?
              Bài viết sẽ được công khai ngay lập tức trên trang chủ và cộng đồng Vegetarian Support.
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setApproveTarget(null)}
                className="px-4 py-2 rounded-[10px] border border-[#e5e7eb] text-xs font-semibold text-[#1f2937] hover:bg-[#f8faf8] cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleApprove}
                className="px-4 py-2 rounded-[10px] bg-[#2e7d32] hover:bg-[#1b5e20] text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? 'Đang duyệt...' : 'Phê duyệt ngay'}
              </button>
            </div>
          </div>
        </Modal>

        {/* Modal Confirm Reject */}
        <Modal
          isOpen={Boolean(rejectTarget)}
          onClose={() => setRejectTarget(null)}
          title="Từ chối Bài viết"
          maxWidth="sm"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-[12px] bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
              Từ chối bài viết <strong>"{rejectTarget?.title}"</strong> và gửi phản hồi cho tác giả.
            </div>
            <div>
              <label className="text-xs font-semibold text-[#1f2937] block mb-1">
                Lý do từ chối kiểm duyệt
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do cần chỉnh sửa (nội dung chưa rõ nguồn gốc, vi phạm tiêu chuẩn ăn chay...)"
                className="w-full p-2.5 rounded-[10px] border border-[#e5e7eb] text-xs text-[#1f2937] focus:outline-none focus:border-amber-600 resize-none"
              />
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="px-4 py-2 rounded-[10px] border border-[#e5e7eb] text-xs font-semibold text-[#1f2937] hover:bg-[#f8faf8] cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleReject}
                className="px-4 py-2 rounded-[10px] bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? 'Đang xử lý...' : 'Xác nhận từ chối'}
              </button>
            </div>
          </div>
        </Modal>

        {/* Modal Confirm Toggle Hide */}
        <Modal
          isOpen={Boolean(hideTarget)}
          onClose={() => setHideTarget(null)}
          title={hideTarget?.status === 'published' ? 'Xác nhận Tạm ẩn bài viết' : 'Khôi phục hiển thị'}
          maxWidth="sm"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-[12px] bg-slate-50 border border-slate-200 text-xs text-[#1f2937] leading-relaxed">
              Bạn có chắc chắn muốn {hideTarget?.status === 'published' ? 'tạm ẩn' : 'khôi phục'} bài viết{' '}
              <strong>"{hideTarget?.title}"</strong>?
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
          title="Xác nhận Xóa vĩnh viễn"
          maxWidth="sm"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-[12px] bg-rose-50 border border-rose-200 text-xs text-rose-800 leading-relaxed">
              Bạn có chắc chắn muốn xóa bài viết <strong>"{deleteTarget?.title}"</strong>? Hành động này không thể hoàn tác.
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

export default AdminArticlesPage
