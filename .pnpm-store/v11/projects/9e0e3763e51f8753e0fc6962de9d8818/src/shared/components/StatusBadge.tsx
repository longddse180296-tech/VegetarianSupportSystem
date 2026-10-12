import React from 'react'

export type BadgeStatusType =
  // AI Flag Check
  | 'NotSubmitted'
  | 'Checking'
  | 'Passed'
  | 'Flagged'
  | 'Partial'
  | 'Failed'
  // Admin Review
  | 'Draft'
  | 'Submitted'
  | 'PendingAdminReview'
  | 'Published'
  | 'RevisionRequested'
  | 'Rejected'
  | 'Removed'
  // Food Scan suitability
  | 'suitable'
  | 'unsuitable'
  | 'insufficient'
  // Generic variants
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'

export interface StatusBadgeProps {
  status: BadgeStatusType
  label?: string
  size?: 'sm' | 'md'
  className?: string
}

interface StatusConfig {
  defaultLabel: string
  bg: string
  text: string
  border: string
  dotColor?: string
}

const STATUS_MAP: Record<BadgeStatusType, StatusConfig> = {
  // AI Flag
  NotSubmitted: {
    defaultLabel: 'Chưa kiểm tra',
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dotColor: 'bg-slate-400',
  },
  Checking: {
    defaultLabel: 'AI đang kiểm tra',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dotColor: 'bg-blue-500 animate-pulse',
  },
  Passed: {
    defaultLabel: 'AI Đạt',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dotColor: 'bg-emerald-500',
  },
  Flagged: {
    defaultLabel: 'AI Gắn cờ',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    dotColor: 'bg-red-500',
  },
  Partial: {
    defaultLabel: 'Kiểm tra một phần',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dotColor: 'bg-amber-500',
  },
  Failed: {
    defaultLabel: 'Lỗi AI',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dotColor: 'bg-rose-500',
  },

  // Admin Review
  Draft: {
    defaultLabel: 'Bản nháp',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dotColor: 'bg-slate-400',
  },
  Submitted: {
    defaultLabel: 'Đã gửi duyệt',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    dotColor: 'bg-indigo-500',
  },
  PendingAdminReview: {
    defaultLabel: 'Chờ Admin duyệt',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dotColor: 'bg-amber-500',
  },
  Published: {
    defaultLabel: 'Đã xuất bản',
    bg: 'bg-[#e8f5e9]',
    text: 'text-[#2e7d32]',
    border: 'border-[#c8e6c9]',
    dotColor: 'bg-[#2e7d32]',
  },
  RevisionRequested: {
    defaultLabel: 'Yêu cầu chỉnh sửa',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    dotColor: 'bg-orange-500',
  },
  Rejected: {
    defaultLabel: 'Từ chối',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    dotColor: 'bg-red-500',
  },
  Removed: {
    defaultLabel: 'Đã gỡ',
    bg: 'bg-zinc-100',
    text: 'text-zinc-600',
    border: 'border-zinc-300',
    dotColor: 'bg-zinc-400',
  },

  // Food Scan Suitability
  suitable: {
    defaultLabel: 'Phù hợp theo thông tin cung cấp',
    bg: 'bg-[#e8f5e9]',
    text: 'text-[#2e7d32]',
    border: 'border-[#c8e6c9]',
    dotColor: 'bg-[#2e7d32]',
  },
  unsuitable: {
    defaultLabel: 'Không phù hợp',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    dotColor: 'bg-red-500',
  },
  insufficient: {
    defaultLabel: 'Chưa đủ thông tin',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dotColor: 'bg-amber-500',
  },

  // Generic
  success: {
    defaultLabel: 'Thành công',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dotColor: 'bg-emerald-500',
  },
  warning: {
    defaultLabel: 'Cảnh báo',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dotColor: 'bg-amber-500',
  },
  danger: {
    defaultLabel: 'Nguy hiểm',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    dotColor: 'bg-red-500',
  },
  info: {
    defaultLabel: 'Thông tin',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dotColor: 'bg-blue-500',
  },
  neutral: {
    defaultLabel: 'Mặc định',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dotColor: 'bg-slate-400',
  },
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'md',
  className = '',
}) => {
  const config = STATUS_MAP[status] || STATUS_MAP.neutral
  const displayText = label || config.defaultLabel

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClass} ${className} tracking-tight select-none`}
    >
      {config.dotColor && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dotColor}`} />
      )}
      <span>{displayText}</span>
    </span>
  )
}

export default StatusBadge
