import React from 'react'
import Button from './Button'

export interface EmptyStateProps {
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  onReset?: () => void
  icon?: React.ReactNode
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Không có dữ liệu',
  description = 'Hiện chưa có mục nào trong danh sách hoặc không tìm thấy kết quả phù hợp.',
  actionLabel,
  onAction,
  onReset,
  icon,
  className = '',
}) => {
  const handleAction = onAction || onReset
  const buttonLabel = actionLabel || (onReset ? 'Xóa bộ lọc' : 'Thử lại')

  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-white rounded-[16px] border border-dashed border-[#e5e7eb] my-4 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="w-16 h-16 rounded-full bg-[#e8f5e9] text-[#2e7d32] flex items-center justify-center mb-4">
        {icon || (
          <svg
            className="w-8 h-8 opacity-80"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        )}
      </div>

      <h3 className="text-base font-bold text-[#1f2937] tracking-tight">{title}</h3>
      <p className="text-sm text-[#6b7280] max-w-md mt-1.5 leading-relaxed">{description}</p>

      {handleAction && (
        <div className="mt-5">
          <Button variant="outline" size="sm" onClick={handleAction}>
            {buttonLabel}
          </Button>
        </div>
      )}
    </div>
  )
}

export default EmptyState
