import React from 'react'
import {
  X,
  FileText,
  PlayCircle,
  AlertTriangle,
  EyeOff,
  RotateCcw,
  Trash2,
  Calendar,
  User,
} from 'lucide-react'
import type { AdminCommentItem } from '../types/adminComments.types'

interface CommentDetailModalProps {
  isOpen: boolean
  comment: AdminCommentItem | null
  onClose: () => void
  onToggleStatus: (id: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onNavigateToTarget?: (targetType: 'article' | 'video', targetId: string) => void
}

export const CommentDetailModal: React.FC<CommentDetailModalProps> = ({
  isOpen,
  comment,
  onClose,
  onToggleStatus,
  onDelete,
  onNavigateToTarget,
}) => {
  if (!isOpen || !comment) return null

  const isHidden = comment.status === 'hidden'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-gray-100 shadow-xl relative space-y-5">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-gray-900">Chi tiết bình luận</h3>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                !isHidden
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  : 'bg-rose-50 text-rose-700 border border-rose-100'
              }`}
            >
              {comment.statusLabel}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Mã định danh bình luận: <code className="font-mono text-gray-700">{comment.id}</code>
          </p>
        </div>

        {/* Violation Alert if any */}
        {comment.isViolation && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Cảnh báo: {comment.violationReason}</p>
              <p className="text-rose-700 mt-0.5">
                Bình luận này đã bị hệ thống hoặc người dùng báo cáo vi phạm tiêu chuẩn cộng đồng.
              </p>
            </div>
          </div>
        )}

        {/* Comment Body */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-gray-800 leading-relaxed">
          <p className="font-semibold text-gray-500 text-[11px] uppercase tracking-wider mb-1.5">
            Nội dung bình luận
          </p>
          <p className="italic whitespace-pre-wrap">{comment.content}</p>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 bg-white rounded-2xl border border-gray-100">
            <div className="flex items-center gap-1.5 text-gray-400 mb-1">
              <User className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium">Người gửi</span>
            </div>
            <p className="font-bold text-gray-900">{comment.authorName}</p>
            <p className="text-gray-500 text-[11px] truncate">{comment.authorEmail}</p>
          </div>

          <div className="p-3.5 bg-white rounded-2xl border border-gray-100">
            <div className="flex items-center gap-1.5 text-gray-400 mb-1">
              <Calendar className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium">Thời gian đăng</span>
            </div>
            <p className="font-bold text-gray-900">{comment.createdAt}</p>
          </div>
        </div>

        {/* Target Content Link */}
        <div className="p-3.5 bg-white rounded-2xl border border-gray-100 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            {comment.targetType === 'article' ? (
              <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <PlayCircle className="w-5 h-5 text-teal-600 shrink-0" />
            )}
            <div className="min-w-0">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">
                {comment.targetType === 'article' ? 'Bài viết liên kết' : 'Video liên kết'}
              </span>
              <p className="font-bold text-gray-900 truncate">{comment.targetTitle}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateToTarget?.(comment.targetType, comment.targetId)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs shrink-0 transition-colors"
          >
            Mở xem
          </button>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={async () => {
              if (window.confirm('Bạn có chắc muốn xóa vĩnh viễn bình luận này?')) {
                await onDelete(comment.id)
                onClose()
              }
            }}
            className="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa vĩnh viễn</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={async () => {
                await onToggleStatus(comment.id)
                onClose()
              }}
              className={`px-4 py-2 rounded-xl text-white text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 ${
                isHidden
                  ? 'bg-emerald-700 hover:bg-emerald-800'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {isHidden ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Khôi phục hiển thị</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Tạm ẩn bình luận</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
export default CommentDetailModal
