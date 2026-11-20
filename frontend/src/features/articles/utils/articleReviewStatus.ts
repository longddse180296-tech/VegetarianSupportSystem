// Trạng thái duyệt hiển thị cho tác giả; bản nháp chưa gửi vẫn được nhận biết riêng.
export function articleReviewStatus(status: string) {
  if (status === 'Published') return { label: 'Đã được chấp nhận', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' }
  if (['Rejected', 'RevisionRequested', 'Removed'].includes(status))
    return { label: 'Đã bị từ chối', className: 'border-red-200 bg-red-50 text-red-700' }
  if (status === 'Draft') return { label: 'Bản nháp', className: 'border-slate-200 bg-slate-100 text-slate-600' }
  return { label: 'Đang đợi duyệt', className: 'border-amber-200 bg-amber-50 text-amber-800' }
}
