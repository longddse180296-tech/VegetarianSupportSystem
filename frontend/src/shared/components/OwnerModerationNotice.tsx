interface Props {
  status: string | null | undefined
  reason: string | null | undefined
}

// Chỉ hiện quyết định dành cho chủ nội dung, không đưa kết quả AI lên giao diện người đăng.
export function OwnerModerationNotice({ status, reason }: Props) {
  if (!['Published', 'Rejected', 'RevisionRequested', 'Removed'].includes(status ?? '')) return null
  if (!reason?.trim()) return null
  const approved = status === 'Published'
  const label = approved ? 'Nội dung đã được chấp nhận' : status === 'Removed' ? 'Nội dung đã được gỡ' : 'Nội dung đã bị từ chối'
  return <div role="status" className={`rounded-xl border p-3 text-sm ${approved
    ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
    : 'border-red-200 bg-red-50 text-red-900'}`}>
    <p className="font-semibold">Thông báo từ Quản trị viên: {label}</p>
    <p className="mt-1 whitespace-pre-wrap [overflow-wrap:anywhere]">{reason.trim()}</p>
  </div>
}
