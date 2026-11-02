// Chức năng: báo cáo nội dung cần xem xét. Ghép dữ liệu, thao tác và các trạng thái tải/lỗi cho màn hình.
import { useMemo, useState, type FormEvent } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { AdminFrame, Feedback, Pager } from '../../components/ApiWorkspace'
import { useApiData } from '../../hooks/useApiData'
import { fieldClass, formatDate, primaryClass, secondaryClass } from '../../utils/apiUi'
import { Modal } from '../../../../shared/components/Modal'
import {
  REPORT_REASONS,
  REPORT_STATUSES,
  resolveContentReport,
  type ContentReport,
  type ContentReportEntry,
  type ContentReportPage,
  type ReportReason,
  type ReportStatus,
  type ReportTarget,
} from '../../../reports/api/contentReports'

// Cấu trúc GroupedReport đại diện cho một bài viết hoặc video kèm danh sách tất cả báo cáo liên quan.
interface GroupedReport {
  key: string
  targetType: ReportTarget
  targetId: string
  submissionId: string
  contentTitle: string
  contentVersion: number
  status: ReportStatus
  createdAt: string
  pendingReporterCount: number
  reports: ContentReportEntry[]
}

// Gom các báo cáo cùng nội dung (bài viết/video) thành một mục duy nhất để Admin xem tổng số và sổ chi tiết lý do.
function groupContentReports(items: ContentReport[]): GroupedReport[] {
  const map = new Map<string, GroupedReport>()
  for (const item of items) {
    const key = `${item.targetType}:${item.targetId}`
    const entries: ContentReportEntry[] =
      item.reports && item.reports.length > 0
        ? item.reports
        : [
            {
              id: item.id,
              submissionId: item.submissionId,
              contentVersion: item.contentVersion,
              reporterId: item.reporterId,
              reporterName: item.reporterName,
              reason: item.reason,
              details: item.details,
              status: item.status,
              createdAt: item.createdAt,
              resolvedAt: item.resolvedAt,
              resolvedBy: item.resolvedBy,
              resolutionNote: item.resolutionNote,
            },
          ]

    const existing = map.get(key)
    if (!existing) {
      map.set(key, {
        key,
        targetType: item.targetType,
        targetId: item.targetId,
        submissionId: item.submissionId,
        contentTitle: item.contentTitle,
        contentVersion: item.contentVersion,
        status: entries.some(e => e.status === 'Pending') ? 'Pending' : item.status,
        createdAt: item.createdAt,
        pendingReporterCount: item.pendingReporterCount,
        reports: [...entries],
      })
    } else {
      const existingIds = new Set(existing.reports.map(r => r.id))
      for (const entry of entries) {
        if (!existingIds.has(entry.id)) {
          existing.reports.push(entry)
          existingIds.add(entry.id)
        }
      }
      if (existing.reports.some(e => e.status === 'Pending')) {
        existing.status = 'Pending'
      }
      existing.pendingReporterCount = Math.max(existing.pendingReporterCount, item.pendingReporterCount)
    }
  }
  return Array.from(map.values())
}

// Lấy hoặc lọc danh sách theo điều kiện và phạm vi hiện tại (AdminReportsPage); thuộc báo cáo nội dung cần xem xét.
export default function AdminReportsPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  // Lưu dữ liệu và trạng thái thao tác của báo cáo nội dung cần xem xét trong vòng đời màn hình.
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<ReportStatus | ''>('Pending')
  const [type, setType] = useState<ReportTarget | ''>('')
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({})
  const [selectedGroup, setSelectedGroup] = useState<{ title: string; reportIds: string[]; reporterSummary: string } | null>(null)
  const [decision, setDecision] = useState<'Resolved' | 'Dismissed'>('Resolved')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const query = new URLSearchParams({ page: String(page), pageSize: '10', groupByTarget: 'true' })
  if (status) query.set('status', status)
  if (type) query.set('targetType', type)
  const result = useApiData<ContentReportPage>(`/api/admin/content-reports?${query}`)

  const groupedItems = useMemo(() => groupContentReports(result.data?.items || []), [result.data?.items])

  // Bật/tắt danh sách lý do báo cáo bên dưới từng video/bài viết.
  function toggleExpand(key: string) {
    setExpandedKeys(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // Kiểm tra dữ liệu trước khi gửi thao tác và xử lý kết quả trả về (submit); thuộc báo cáo nội dung cần xem xét.
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!selectedGroup || busy || !note.trim() || selectedGroup.reportIds.length === 0) return
    setBusy(true)
    setError('')
    try {
      for (const reportId of selectedGroup.reportIds) {
        await resolveContentReport(reportId, decision, note)
      }
      setSelectedGroup(null)
      setNotice('Đã lưu kết quả xử lý báo cáo.')
      result.reload()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Chưa lưu được kết quả xử lý.')
    } finally {
      setBusy(false)
    }
  }

  // Hiển thị giao diện báo cáo nội dung cần xem xét từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
  return (
    <AdminFrame
      menu="reports"
      title="Báo cáo nội dung"
      subtitle="Xem báo cáo về bài viết và video đã gom theo nội dung, sổ danh sách lý do báo cáo và ghi nhận cách xử lý."
      onNavigate={onNavigate}
    >
      <div className="flex flex-wrap items-end gap-4">
        <label className="text-sm">
          Trạng thái
          <select
            value={status}
            onChange={event => {
              setStatus(event.target.value as ReportStatus | '')
              setPage(1)
            }}
            className={fieldClass}
          >
            <option value="">Tất cả</option>
            {Object.entries(REPORT_STATUSES).map(([value, text]) => (
              <option key={value} value={value}>
                {text}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Loại nội dung
          <select
            value={type}
            onChange={event => {
              setType(event.target.value as ReportTarget | '')
              setPage(1)
            }}
            className={fieldClass}
          >
            <option value="">Tất cả</option>
            <option value="Article">Bài viết</option>
            <option value="Video">Video</option>
          </select>
        </label>
        <button className={secondaryClass} onClick={result.reload} disabled={result.loading}>
          Tải lại
        </button>
      </div>
      <Feedback error={result.error} notice={notice} />
      {result.loading && <p role="status">Đang tải báo cáo...</p>}
      {!result.loading && groupedItems.length === 0 && (
        <p className="rounded-xl border bg-white p-8 text-center text-slate-500">Chưa có báo cáo phù hợp.</p>
      )}
      {groupedItems.map(group => {
        const isExpanded = Boolean(expandedKeys[group.key])
        const pendingReports = group.reports.filter(r => r.status === 'Pending')
        const reasonCounts = group.reports.reduce<Record<string, number>>((acc, r) => {
          acc[r.reason] = (acc[r.reason] || 0) + 1
          return acc
        }, {})
        const detailPath = `/${group.targetType === 'Article' ? 'articles' : 'videos'}/${group.targetId}`
        const moderationPath = `/admin/${group.targetType === 'Article' ? 'articles' : 'videos'}?submissionId=${group.submissionId}`

        return (
          <article key={group.key} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-slate-500">
                  {group.targetType === 'Article' ? 'Bài viết' : 'Video'} · Phiên bản {group.contentVersion} · Báo cáo mới nhất {formatDate(group.createdAt)}
                </p>
                <h2 className="mt-2 break-words text-lg font-bold">{group.contentTitle}</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="h-fit rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
                  {REPORT_STATUSES[group.status]}
                </span>
                <span
                  className="h-fit rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-800"
                  aria-label={`${group.reports.length} báo cáo cho nội dung này`}
                >
                  {group.reports.length} báo cáo
                </span>
                {group.pendingReporterCount > 0 && (
                  <span className="h-fit rounded-full border border-rose-300 bg-rose-100/70 px-3 py-1 text-xs font-semibold text-rose-900">
                    {group.pendingReporterCount} người đang chờ xử lý
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {Object.entries(reasonCounts).map(([reasonKey, count]) => (
                <span
                  key={reasonKey}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-100 bg-rose-50/60 px-2.5 py-1 text-xs font-semibold text-rose-800"
                >
                  {REPORT_REASONS[reasonKey as ReportReason] || reasonKey}
                  <span className="rounded-full bg-rose-200/80 px-1.5 py-0.5 text-[11px] font-bold text-rose-950">
                    {count}
                  </span>
                </span>
              ))}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70">
              <button
                type="button"
                onClick={() => toggleExpand(group.key)}
                aria-expanded={isExpanded}
                className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100"
              >
                <span>
                  {isExpanded
                    ? `Thu gọn danh sách lý do báo cáo (${group.reports.length})`
                    : `Sổ ra xem chi tiết các lý do báo cáo (${group.reports.length})`}
                </span>
                {isExpanded ? <ChevronUp size={18} aria-hidden="true" /> : <ChevronDown size={18} aria-hidden="true" />}
              </button>

              {isExpanded && (
                <div className="divide-y divide-slate-200 border-t border-slate-200 px-4 py-2">
                  {group.reports.map((report, index) => (
                    <div key={report.id} className="space-y-2 py-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-rose-800">
                          #{index + 1} · {REPORT_REASONS[report.reason]}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="rounded-full bg-white px-2.5 py-0.5 font-semibold text-slate-700 ring-1 ring-slate-200">
                            {REPORT_STATUSES[report.status]}
                          </span>
                          <span>{formatDate(report.createdAt)}</span>
                        </div>
                      </div>
                      {report.details && (
                        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">
                          {report.details}
                        </p>
                      )}
                      <p className="break-words text-xs text-slate-500">
                        Tên người gửi: {report.reporterName?.trim() || 'Không có thông tin người gửi'} · Phiên bản {report.contentVersion}
                      </p>
                      {report.resolutionNote && (
                        <div className="rounded-lg bg-white p-3 text-xs ring-1 ring-slate-200">
                          <p className="whitespace-pre-wrap break-words text-slate-700">{report.resolutionNote}</p>
                          <p className="mt-1 break-all text-slate-500">
                            Quản trị viên: {report.resolvedBy} · {formatDate(report.resolvedAt)}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                className={secondaryClass}
                href={`#${detailPath}`}
                onClick={event => {
                  event.preventDefault()
                  onNavigate(detailPath)
                }}
              >
                Xem nội dung hiện tại
              </a>
              <a
                className={secondaryClass}
                href={`#${moderationPath}`}
                onClick={event => {
                  event.preventDefault()
                  onNavigate(moderationPath)
                }}
              >
                Kiểm duyệt phiên bản bị báo cáo
              </a>
              {pendingReports.length > 0 && (
                <button
                  type="button"
                  className={primaryClass}
                  onClick={() => {
                    setSelectedGroup({
                      title: group.contentTitle,
                      reportIds: pendingReports.map(r => r.id),
                      reporterSummary:
                        pendingReports.length === 1
                          ? `Tên người gửi: ${pendingReports[0].reporterName?.trim() || 'Không có thông tin người gửi'}`
                          : `Xử lý đồng thời ${pendingReports.length} báo cáo đang chờ của nội dung này`,
                    })
                    setDecision('Resolved')
                    setNote('')
                    setError('')
                    setNotice('')
                  }}
                >
                  {pendingReports.length > 1 ? `Xử lý tất cả (${pendingReports.length} báo cáo)` : 'Xử lý báo cáo'}
                </button>
              )}
            </div>
          </article>
        )
      })}
      {result.data && <Pager page={page} total={result.data.total} onChange={setPage} />}
      <Modal
        isOpen={selectedGroup !== null}
        onClose={() => {
          if (!busy) setSelectedGroup(null)
        }}
        title="Xử lý báo cáo"
        description={selectedGroup?.title}
      >
        <form onSubmit={submit} className="space-y-4">
          <p className="break-words text-sm">{selectedGroup?.reporterSummary}</p>
          <p className="text-sm text-slate-600">
            Nếu cần gỡ nội dung, hãy thực hiện trong màn hình kiểm duyệt phiên bản bị báo cáo trước khi hoàn tất báo cáo.
          </p>
          <label className="block font-semibold">
            Kết quả
            <select
              value={decision}
              disabled={busy}
              onChange={event => setDecision(event.target.value as 'Resolved' | 'Dismissed')}
              className={fieldClass}
            >
              <option value="Resolved">Đã xử lý</option>
              <option value="Dismissed">Không chấp nhận báo cáo</option>
            </select>
          </label>
          <label className="block font-semibold">
            Ghi chú xử lý (bắt buộc)
            <textarea
              value={note}
              disabled={busy}
              onChange={event => setNote(event.target.value)}
              required
              maxLength={2000}
              rows={5}
              className={fieldClass}
              placeholder="Ghi rõ hành động đã thực hiện hoặc lý do không chấp nhận báo cáo..."
            />
          </label>
          <Feedback error={error} />
          <div className="flex justify-end gap-3">
            <button type="button" disabled={busy} className={secondaryClass} onClick={() => setSelectedGroup(null)}>
              Hủy
            </button>
            <button type="submit" disabled={busy || !note.trim()} className={primaryClass}>
              {busy ? 'Đang lưu...' : 'Lưu kết quả'}
            </button>
          </div>
        </form>
      </Modal>
    </AdminFrame>
  )
}
