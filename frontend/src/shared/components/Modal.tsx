// Chức năng: giao diện và thành phần dùng chung. Hiển thị một phần giao diện và phát sự kiện cho màn hình cha xử lý.
import React, { useEffect, useId, useRef } from 'react'

// Cấu trúc ModalProps quy định dữ liệu trao đổi trong giao diện và thành phần dùng chung.
export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: React.ReactNode
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className?: string
}

// Thành phần Modal nhận dữ liệu đầu vào và hiển thị phần giao diện thuộc giao diện và thành phần dùng chung.
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'md',
  className = '',
}) => {
  const panel = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const descriptionId = useId()
  const close = useRef(onClose)
  useEffect(() => { close.current = onClose }, [onClose])
  // Đăng ký sự kiện phục vụ màn hình và dọn bộ lắng nghe khi không còn sử dụng.
  useEffect(() => {
    if (!isOpen) return
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    const focusable = () => Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex="0"]') ?? [])
      .filter(element => element.getClientRects().length > 0)
    // Thực hiện bước xử lý riêng được các thành phần trong tính năng sử dụng (handleKeyDown); thuộc giao diện và thành phần dùng chung.
    const handleKeyDown = (e: KeyboardEvent) => {
      const dialogs = document.querySelectorAll('[role="dialog"][aria-modal="true"]')
      if (dialogs[dialogs.length - 1] !== panel.current?.parentElement) return
      if (e.key === 'Escape') {
        e.preventDefault()
        close.current()
      }
      // Giữ vòng Tab trong hộp thoại để người dùng bàn phím không thao tác nhầm nội dung phía sau.
      if (e.key === 'Tab') {
        const elements = focusable()
        if (!elements.length) { e.preventDefault(); panel.current?.focus(); return }
        const first = elements[0], last = elements[elements.length - 1]
        if (e.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
      ;(focusable()[0] ?? panel.current)?.focus()
    }
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }[maxWidth]

  // Hiển thị thành phần giao diện dùng chung từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descriptionId : undefined}
      aria-label={!title ? 'Hộp thoại' : undefined}
    >
      {/* Lớp nền đóng hộp thoại khi bấm ra ngoài. */}
      <div
        className="ui-modal-backdrop fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Khung nội dung và thao tác của hộp thoại. */}
      <div
        ref={panel}
        tabIndex={-1}
        className={`ui-modal-panel relative w-full ${maxWidthClass} max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3.5rem)] my-auto bg-white rounded-[24px] shadow-2xl border border-slate-200 flex flex-col overflow-hidden transition-all duration-200 transform scale-100 z-10 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tiêu đề và thao tác chính. */}
        {(title || description) && (
          <div className="ui-modal-header px-6 pt-5 pb-3.5 border-b border-slate-100 flex items-start justify-between gap-4 shrink-0">
            <div>
              {title && (
                <h3 id={titleId} className="text-lg font-bold text-slate-900 leading-snug tracking-tight">
                  {title}
                </h3>
              )}
              {description && (
                <p id={descriptionId} className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-full transition-colors shrink-0"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Nội dung chính của khu vực hiển thị. */}
        <div className="ui-modal-body px-6 py-4 overflow-y-auto flex-1 min-h-0 text-sm text-slate-700">
          {children}
        </div>

        {/* Các thao tác ở cuối khu vực hiển thị. */}
        {footer && (
          <div className="ui-modal-footer px-6 py-3.5 bg-slate-50/90 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal
