import React, { useEffect, useState } from 'react'
import {
  Video as VideoIcon,
  Play,
  Eye,
  EyeOff,
  Plus,
  Search,
  Trash2,
  CheckCircle,
  XCircle,
  CheckCircle2,
  Pencil,
  AlertTriangle,
  Clock,
} from 'lucide-react'
import { AdminLayout } from '../../../../app/layouts/AdminLayout'
import { SharedDataTable, type ColumnDef } from '../../../../shared/components/SharedDataTable'
import { VideoModal } from '../components/VideoModal'
import { Modal } from '../../../../shared/components/Modal'
import {
  createAdminVideo,
  deleteAdminVideo,
  getAdminVideos,
  getAdminVideoStats,
  toggleHideVideo,
  updateAdminVideo,
  approveVideo,
  rejectVideo,
} from '../api/adminVideosApi'
import type {
  AdminVideoItem,
  AdminVideoStats,
  VideoFormData,
  VideoStatus,
} from '../types/adminVideos.types'

interface AdminVideosPageProps {
  onNavigate?: (path: string) => void
}

export const AdminVideosPage: React.FC<AdminVideosPageProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<AdminVideoStats | null>(null)
  const [videos, setVideos] = useState<AdminVideoItem[]>([])
  const [total, setTotal] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [currentPage, setCurrentPage] = useState<number>(1)

  // Filters
  const [statusTab, setStatusTab] = useState<'all' | VideoStatus>('all')
  const [keyword, setKeyword] = useState<string>('')

  // UI state
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Modal create/edit state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVideo, setEditingVideo] = useState<AdminVideoItem | null>(null)

  // Confirmation Modals State (replaces window.confirm)
  const [approveTarget, setApproveTarget] = useState<AdminVideoItem | null>(null)
  const [rejectTarget, setRejectTarget] = useState<AdminVideoItem | null>(null)
  const [rejectReason, setRejectReason] = useState<string>('')
  const [hideTarget, setHideTarget] = useState<AdminVideoItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminVideoItem | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

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
            keyword,
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
  }, [statusTab, keyword, currentPage, refreshTrigger])

  const handleOpenCreateModal = () => {
    setEditingVideo(null)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (vid: AdminVideoItem) => {
    setEditingVideo(vid)
    setIsModalOpen(true)
  }

  const handleModalSubmit = async (data: VideoFormData) => {
    try {
      if (editingVideo) {
        await updateAdminVideo(editingVideo.id, data)
        setActionSuccessMsg(`Đã cập nhật video "${data.title}" thành công!`)
      } else {
        await createAdminVideo(data)
        setActionSuccessMsg(`Đã thêm video mới "${data.title}" thành công!`)
      }
      setTimeout(() => setActionSuccessMsg(null), 3000)
      setRefreshTrigger((prev) => prev + 1)
    } catch {
      setError('Lỗi khi lưu video.')
    }
  }

  const handleApprove = async () => {
    if (!approveTarget) return
    try {
      setIsProcessing(true)
      await approveVideo(approveTarget.id)
      setActionSuccessMsg(`Đã phê duyệt video "${approveTarget.title}".`)
      setTimeout(() => setActionSuccessMsg(null), 3000)
      setApproveTarget(null)
      setRefreshTrigger((prev) => prev + 1)
    } catch {
      setError('Lỗi khi phê duyệt video.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!rejectTarget) return
    try {
      setIsProcessing(true)
      await rejectVideo(rejectTarget.id, rejectReason || 'Video chưa đạt tiêu chuẩn hướng dẫn')
      setActionSuccessMsg(`Đã từ chối video "${rejectTarget.title}".`)
      setTimeout(() => setActionSuccessMsg(null), 3000)
      setRejectTarget(null)
      setRejectReason('')
      setRefreshTrigger((prev) => prev + 1)
    } catch {
      setError('Lỗi khi từ chối video.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleToggleHide = async () => {
    if (!hideTarget) return
    try {
      setIsProcessing(true)
      const res = await toggleHideVideo(hideTarget.id)
      setActionSuccessMsg(
        `Đã ${res.status === 'published' ? 'khôi phục' : 'tạm ẩn'} video "${hideTarget.title}".`
      )
      setTimeout(() => setActionSuccessMsg(null), 3000)
      setHideTarget(null)
      setRefreshTrigger((prev) => prev + 1)
    } catch {
      setError('Không thể cập nhật trạng thái video.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setIsProcessing(true)
      await deleteAdminVideo(deleteTarget.id)
      setActionSuccessMsg(`Đã xóa vĩnh viễn video "${deleteTarget.title}".`)
      setTimeout(() => setActionSuccessMsg(null), 3000)
      setDeleteTarget(null)
      setRefreshTrigger((prev) => prev + 1)
    } catch {
      setError('Không thể xóa video.')
    } finally {
      setIsProcessing(false)
    }
  }

  const columns: ColumnDef<AdminVideoItem>[] = [
    {
      key: 'title',
      header: 'VIDEO & NỘI DUNG',
      render: (item) => (
        <div className="flex items-center gap-3 max-w-sm">
          <div className="relative w-16 h-10 rounded-[8px] overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
            {item.thumbnailUrl ? (
              <img
                src={item.thumbnailUrl}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                <Play className="w-4 h-4" />
              </div>
            )}
            <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[9px] font-mono px-1 rounded">
              {item.duration}
            </span>
          </div>

          <div className="space-y-0.5">
            <div className="font-bold text-xs text-[#1f2937] leading-snug line-clamp-2">
              {item.title}
            </div>
            <div className="text-[11px] text-[#6b7280]">
              Đầu bếp: <span className="font-medium text-[#1f2937]">{item.authorName}</span> • {item.resolution}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'CHUYÊN MỤC',
      render: (item) => (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          {item.categoryLabel}
        </span>
      ),
    },
    {
      key: 'publishedAt',
      header: 'NGÀY TẢI LÊN',
      render: (item) => (
        <span className="text-xs text-[#6b7280]">{item.publishedAt}</span>
      ),
    },
    {
      key: 'status',
      header: 'TRẠNG THÁI',
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
                title="Phê duyệt video"
                className="p-1.5 rounded-[8px] text-[#2e7d32] hover:bg-[#e8f5e9] transition-colors cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setRejectTarget(item)}
                title="Từ chối video"
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
              title={item.status === 'published' ? 'Tạm ẩn video' : 'Khôi phục hiển thị'}
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
            onClick={() => handleOpenEditModal(item)}
            title="Chỉnh sửa thông tin"
            className="p-1.5 rounded-[8px] text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setDeleteTarget(item)}
            title="Xóa video"
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
      activeMenu="videos"
      pageTitle="Quản lý &amp; Kiểm duyệt Video Ẩm thực"
      pageSubtitle="Kiểm duyệt các video hướng dẫn nấu món chay, thao tác bếp và chia sẻ công thức trực quan."
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
              <span className="text-xs font-semibold text-[#6b7280]">Tổng video</span>
              <div className="w-8 h-8 rounded-[10px] bg-amber-50 text-amber-600 flex items-center justify-center">
                <VideoIcon className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-[#1f2937] tabular-nums tracking-tight">
                {stats?.totalCount ?? 0}
              </div>
              <p className="text-[11px] text-[#6b7280] mt-0.5">Video trong hệ thống</p>
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
              <p className="text-[11px] text-[#2e7d32] mt-0.5">Công khai tới người dùng</p>
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
              <p className="text-[11px] text-amber-700 mt-0.5">Cần phê duyệt xuất bản</p>
            </div>
          </div>

          <div className="p-5 rounded-[16px] bg-white border border-[#e5e7eb] shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)] flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6b7280]">Đã tạm ẩn</span>
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

        {/* Filter Bar */}
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
              Tất cả video
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
            <div className="relative min-w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Tìm tiêu đề, đầu bếp..."
                className="w-full pl-9 pr-3 py-2 rounded-[10px] border border-[#e5e7eb] text-xs text-[#1f2937] focus:outline-none focus:border-[#2e7d32]"
              />
            </div>

            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="h-9 px-4 rounded-[10px] bg-[#2e7d32] hover:bg-[#1b5e20] text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tải video mới</span>
            </button>
          </div>
        </div>

        {/* Shared Data Table */}
        <SharedDataTable<AdminVideoItem>
          title="Danh sách Video Nấu ăn &amp; Hướng dẫn"
          totalCountBadge={total}
          updatedAtText="Đồng bộ thời gian thực"
          columns={columns}
          data={videos}
          keyExtractor={(item) => item.id}
          isLoading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={total}
          pageSize={6}
          onPageChange={(p) => setCurrentPage(p)}
          emptyMessage="Không tìm thấy video nào phù hợp."
        />

        {/* Video Create / Edit Modal */}
        <VideoModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          videoToEdit={editingVideo}
          onSubmit={handleModalSubmit}
        />

        {/* Modal Confirm Approve */}
        <Modal
          isOpen={Boolean(approveTarget)}
          onClose={() => setApproveTarget(null)}
          title="Xác nhận Phê duyệt Xuất bản Video"
          maxWidth="sm"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-[12px] bg-emerald-50 border border-emerald-200 text-xs text-[#1b5e20] leading-relaxed">
              Bạn có chắc chắn muốn phê duyệt video <strong>"{approveTarget?.title}"</strong>?
              Video sẽ được công khai ngay lập tức trên thư viện video nấu ăn.
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
          title="Từ chối Video"
          maxWidth="sm"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-[12px] bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
              Từ chối video <strong>"{rejectTarget?.title}"</strong> và gửi phản hồi cho tác giả.
            </div>
            <div>
              <label className="text-xs font-semibold text-[#1f2937] block mb-1">
                Lý do từ chối kiểm duyệt
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do cần chỉnh sửa (chất lượng hình ảnh, nguyên liệu không thuần chay...)"
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
          title={hideTarget?.status === 'published' ? 'Xác nhận Tạm ẩn video' : 'Khôi phục hiển thị'}
          maxWidth="sm"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-[12px] bg-slate-50 border border-slate-200 text-xs text-[#1f2937] leading-relaxed">
              Bạn có chắc chắn muốn {hideTarget?.status === 'published' ? 'tạm ẩn' : 'khôi phục'}{' '}
              video <strong>"{hideTarget?.title}"</strong>?
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
              Bạn có chắc chắn muốn xóa vĩnh viễn video <strong>"{deleteTarget?.title}"</strong>?
              Hành động này không thể hoàn tác.
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

export default AdminVideosPage
