import { useState } from 'react'
import { apiClient } from '../../../../shared/api/apiClient'
import { AdminFrame, Feedback, Pager } from '../../components/ApiWorkspace'
import { useApiData } from '../../hooks/useApiData'
import { errorMessage, secondaryClass } from '../../utils/apiUi'

interface FeedbackItem {
  id: string
  name: string
  email: string
  subject: string
  message: string
  createdAt: string
  readAt: string | null
}
interface FeedbackPage {
  items: FeedbackItem[]
  total: number
  page: number
  pageSize: number
}

export default function AdminFeedbackPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('all')
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState('')
  const result = useApiData<FeedbackPage>(`/api/admin/feedback?page=${page}&pageSize=10${filter === 'all' ? '' : `&isRead=${filter === 'read'}`}`)

  async function markRead(id: string) {
    setPending(id)
    setError('')
    try {
      await apiClient.post(`/api/admin/feedback/${id}/read`)
      result.reload()
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setPending(null)
    }
  }

  return (
    <AdminFrame menu="feedback" title="Góp ý từ người dùng" subtitle="Tiếp nhận góp ý gửi từ trang Liên hệ. Chỉ Admin có quyền xem." onNavigate={onNavigate}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-3 text-sm">Trạng thái
          <select className="rounded-lg border border-slate-200 bg-white p-2" value={filter} onChange={event => { setFilter(event.target.value); setPage(1) }}>
            <option value="all">Tất cả</option><option value="unread">Chưa đọc</option><option value="read">Đã đọc</option>
          </select>
        </label>
        <button className={secondaryClass} onClick={result.reload} disabled={result.loading}>Tải lại</button>
      </div>
      <Feedback error={error || result.error} />
      {result.loading && <p role="status">Đang tải góp ý...</p>}
      {!result.loading && result.data?.items.length === 0 && <p className="rounded-xl border bg-white p-8 text-center text-slate-500">Chưa có góp ý trong danh sách này.</p>}
      {result.data?.items.map(item => (
        <article key={item.id} className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="break-words text-lg font-bold text-slate-800">{item.subject}</h2>
              <p className="mt-2 break-words text-sm text-slate-600">{item.name} · {item.email}</p>
              <p className="mt-1 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString('vi-VN')}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs ${item.readAt ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-700'}`}>{item.readAt ? 'Đã đọc' : 'Chưa đọc'}</span>
          </div>
          <p className="mt-5 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">{item.message}</p>
          {!item.readAt && <button className={`${secondaryClass} mt-5`} disabled={pending !== null} onClick={() => void markRead(item.id)}>{pending === item.id ? 'Đang cập nhật...' : 'Đánh dấu đã đọc'}</button>}
        </article>
      ))}
      {result.data && <Pager page={page} total={result.data.total} onChange={setPage} />}
    </AdminFrame>
  )
}
