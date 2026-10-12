import React, { useState } from 'react'
import { Lock, Unlock, X, Loader2, AlertCircle } from 'lucide-react'
import type { MemberSummary } from '../types'

interface LockMemberModalProps {
  member: MemberSummary | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (memberId: string, reason?: string) => Promise<void>
  isLoading?: boolean
}

const DEFAULT_REASONS = [
  'Vi phạm tiêu chuẩn cộng đồng về nội dung',
  'Spam bài viết hoặc bình luận quảng cáo',
  'Sử dụng ngôn từ không chuẩn mực, quấy rối',
  'Đăng tải hình ảnh / công thức có thành phần động vật',
  'Lý do khác',
]

export const LockMemberModal: React.FC<LockMemberModalProps> = ({
  member,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const [selectedReason, setSelectedReason] = useState(DEFAULT_REASONS[0])
  const [customReason, setCustomReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!isOpen || !member) return null

  const isLocking = member.status === 'active'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const finalReason = selectedReason === 'Lý do khác' ? customReason.trim() : selectedReason
    if (isLocking && !finalReason) {
      setError('Vui lòng chọn hoặc nhập lý do khóa tài khoản.')
      return
    }

    try {
      await onConfirm(member.id, finalReason)
      onClose()
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Thao tác không thành công. Vui lòng thử lại.')
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-6 shadow-xl flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isLocking ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              {isLocking ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isLocking ? 'Khóa tài khoản thành viên' : 'Mở khóa tài khoản'}
              </h3>
              <p className="text-xs text-slate-500">{member.fullName} ({member.email})</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isLocking ? (
            <>
              <p className="text-xs text-slate-600 leading-relaxed">
                Khi bị khóa, thành viên này sẽ không thể đăng bài, bình luận hoặc tương tác trên hệ
                thống cho đến khi được mở khóa.
              </p>

              <div className="flex flex-col gap-2">
                <label htmlFor="lock-reason" className="text-xs font-semibold text-slate-700">
                  Lý do khóa tài khoản <span className="text-rose-500">*</span>
                </label>
                <select
                  id="lock-reason"
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  disabled={isLoading}
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  {DEFAULT_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>

                {selectedReason === 'Lý do khác' && (
                  <textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Nhập lý do cụ thể..."
                    rows={2}
                    className="w-full p-2.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 mt-1"
                  />
                )}
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn mở khóa cho tài khoản <strong>{member.fullName}</strong>? Thành
              viên sẽ được khôi phục toàn bộ quyền đăng tải và sử dụng hệ thống.
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 disabled:opacity-50 ${
                isLocking
                  ? 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500'
                  : 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : isLocking ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Xác nhận khóa</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Xác nhận mở khóa</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
export default LockMemberModal
