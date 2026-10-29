// Chức năng: báo cáo nội dung cần xem xét. Ghép dữ liệu, thao tác và các trạng thái tải/lỗi cho màn hình.
import { useState, type FormEvent } from 'react'
import { AdminFrame, Feedback, Pager } from '../../components/ApiWorkspace'
import { useApiData } from '../../hooks/useApiData'
import { fieldClass, formatDate, primaryClass, secondaryClass } from '../../utils/apiUi'
import { Modal } from '../../../../shared/components/Modal'
import { REPORT_REASONS, REPORT_STATUSES, resolveContentReport, type ContentReport, type ContentReportPage, type ReportStatus, type ReportTarget } from '../../../reports/api/contentReports'

// Lấy hoặc lọc danh sách theo điều kiện và phạm vi hiện tại (AdminReportsPage); thuộc báo cáo nội dung cần xem xét.
export default function AdminReportsPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  // Lưu dữ liệu và trạng thái thao tác của báo cáo nội dung cần xem xét trong vòng đời màn hình.
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<ReportStatus | ''>('Pending')
  const [type, setType] = useState<ReportTarget | ''>('')
  const [selected, setSelected] = useState<ContentReport | null>(null)
  const [decision, setDecision] = useState<'Resolved' | 'Dismissed'>('Resolved')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const query = new URLSearchParams({ page: String(page), pageSize: '10' })
  if (status) query.set('status', status)
  if (type) query.set('targetType', type)
  const result = useApiData<ContentReportPage>(`/api/admin/content-reports?${query}`)

  // Kiểm tra dữ liệu trước khi gửi thao tác và xử lý kết quả trả về (submit); thuộc báo cáo nội dung cần xem xét.
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!selected || busy || !note.trim()) return
    setBusy(true)
    setError('')
    try {
      await resolveContentReport(selected.id, decision, note)
      setSelected(null)
      setNotice('Đã lưu kết quả xử lý báo cáo.')
      result.reload()
    } catch (error) { setError(error instanceof Error ? error.message : 'Chưa lưu được kết quả xử lý.') }
    finally { setBusy(false) }
  }

  // Hiển thị giao diện báo cáo nội dung cần xem xét từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
  return <AdminFrame menu="reports" title="Báo cáo nội dung" subtitle="Xem báo cáo về bài viết và video, kiểm tra nội dung và ghi nhận cách xử lý." onNavigate={onNavigate}>
    <div className="flex flex-wrap items-end gap-4">
      <label className="text-sm">Trạng thái<select value={status} onChange={event => { setStatus(event.target.value as ReportStatus | ''); setPage(1) }} className={fieldClass}><option value="">Tất cả</option>{Object.entries(REPORT_STATUSES).map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>
      <label className="text-sm">Loại nội dung<select value={type} onChange={event => { setType(event.target.value as ReportTarget | ''); setPage(1) }} className={fieldClass}><option value="">Tất cả</option><option value="Article">Bài viết</option><option value="Video">Video</option></select></label>
      <button className={secondaryClass} onClick={result.reload} disabled={result.loading}>Tải lại</button>
    </div>
    <Feedback error={result.error} notice={notice} />
    {result.loading && <p role="status">Đang tải báo cáo...</p>}
    {!result.loading && result.data?.items.length === 0 && <p className="rounded-xl border bg-white p-8 text-center text-slate-500">Chưa có báo cáo phù hợp.</p>}
    {result.data?.items.map(item => <article key={item.id} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap justify-between gap-3">
        <div className="min-w-0"><p className="text-xs text-slate-500">{item.targetType === 'Article' ? 'Bài viết' : 'Video'} · Phiên bản {item.contentVersion} · {formatDate(item.createdAt)}</p><h2 className="mt-2 break-words text-lg font-bold">{item.contentTitle}</h2></div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="h-fit rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">{REPORT_STATUSES[item.status]}</span>
          {item.pendingReporterCount > 0 && <span className="h-fit rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-800" aria-label={`${item.pendingReporterCount} người đang báo cáo nội dung này`}>{item.pendingReporterCount} người đang báo cáo</span>}
        </div>
      </div>
      <p className="font-semibold text-rose-800">{REPORT_REASONS[item.reason]}</p>
      {item.details && <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">{item.details}</p>}
      <p className="break-words text-xs text-slate-500">Tên người gửi: {item.reporterName?.trim() || 'Không có thông tin người gửi'}</p>
      <div className="flex flex-wrap gap-3">
        <a className={secondaryClass} href={`#/${item.targetType === 'Article' ? 'articles' : 'videos'}/${item.targetId}`} target="_blank" rel="noopener noreferrer">Xem nội dung hiện tại</a>
        <a className={secondaryClass} href={`#/admin/${item.targetType === 'Article' ? 'articles' : 'videos'}?submissionId=${item.submissionId}`} target="_blank" rel="noopener noreferrer">Kiểm duyệt phiên bản bị báo cáo</a>
        {item.status === 'Pending' && <button className={primaryClass} onClick={() => { setSelected(item); setDecision('Resolved'); setNote(''); setError(''); setNotice('') }}>Xử lý báo cáo</button>}
      </div>
      {item.resolutionNote && <div className="rounded-xl bg-slate-50 p-4 text-sm"><p className="whitespace-pre-wrap break-words">{item.resolutionNote}</p><p className="mt-2 break-all text-xs text-slate-500">Quản trị viên: {item.resolvedBy} · {formatDate(item.resolvedAt)}</p></div>}
    </article>)}
    {result.data && <Pager page={page} total={result.data.total} onChange={setPage} />}
    <Modal isOpen={selected !== null} onClose={() => { if (!busy) setSelected(null) }} title="Xử lý báo cáo" description={selected?.contentTitle}>
      <form onSubmit={submit} className="space-y-4">
        <p className="break-words text-sm">Tên người gửi: {selected?.reporterName?.trim() || 'Không có thông tin người gửi'}</p>
        <p className="text-sm text-slate-600">Nếu cần gỡ nội dung, hãy thực hiện trong màn hình kiểm duyệt phiên bản bị báo cáo trước khi hoàn tất báo cáo.</p>
        <label className="block font-semibold">Kết quả<select value={decision} disabled={busy} onChange={event => setDecision(event.target.value as 'Resolved' | 'Dismissed')} className={fieldClass}><option value="Resolved">Đã xử lý</option><option value="Dismissed">Không chấp nhận báo cáo</option></select></label>
        <label className="block font-semibold">Ghi chú xử lý (bắt buộc)<textarea value={note} disabled={busy} onChange={event => setNote(event.target.value)} required maxLength={2000} rows={5} className={fieldClass} placeholder="Ghi rõ hành động đã thực hiện hoặc lý do không chấp nhận báo cáo..." /></label>
        <Feedback error={error} />
        <div className="flex justify-end gap-3"><button type="button" disabled={busy} className={secondaryClass} onClick={() => setSelected(null)}>Hủy</button><button type="submit" disabled={busy || !note.trim()} className={primaryClass}>{busy ? 'Đang lưu...' : 'Lưu kết quả'}</button></div>
      </form>
    </Modal>
  </AdminFrame>
}
