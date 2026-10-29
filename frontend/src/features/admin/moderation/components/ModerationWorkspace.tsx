// Chức năng: kiểm duyệt nội dung và kết quả kiểm tra AI. Hiển thị một phần giao diện và phát sự kiện cho màn hình cha xử lý.
import { useEffect, useState } from 'react'
import { formatSystemReviewMessage } from '../utils/moderationMessages'
import {
  ArrowUpRight,
  AlertTriangle,
  FileText,
  RefreshCw,
  ShieldCheck,
  Video,
} from 'lucide-react'
import {
  SharedDataTable,
  type ColumnDef,
} from '../../../../shared/components/SharedDataTable'
import { Modal } from '../../../../shared/components/Modal'
import { Select } from '../../../../shared/components/Select'
import { getStoredToken } from '../../../../shared/api/apiClient'
import { RichContentRenderer } from '../../../articles/components/RichContentRenderer'
import { formatVideoDuration } from '../../../videos/utils/videoMetadata'
import { AdminFrame, Feedback } from '../../components/ApiWorkspace'
import { useApiData } from '../../hooks/useApiData'
import {
  fieldClass,
  primaryClass,
  errorMessage,
  formatDate,
} from '../../utils/apiUi'
import {
  adminModerationApi,
  adminStatusLabels,
  aiStatusLabels,
  decisionLabels,
  type Submission,
  type Decision,
  type AdminStatus,
  type AiStatus,
} from '../api/adminModerationApi'

const adminStatusStyles: Record<AdminStatus, string> = {
  Draft: 'border-slate-200 bg-slate-50 text-slate-600',
  Submitted: 'border-sky-200 bg-sky-50 text-sky-700',
  PendingAdminReview: 'border-amber-200 bg-amber-50 text-amber-800',
  Published: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  RevisionRequested: 'border-orange-200 bg-orange-50 text-orange-800',
  Rejected: 'border-rose-200 bg-rose-50 text-rose-700',
  Removed: 'border-slate-200 bg-slate-100 text-slate-600',
}



const statusBadgeClass =
  'inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap'

// Tách kết quả AI khỏi quyết định Admin; lỗi dịch vụ không được diễn giải thành bài viết vi phạm.
const aiReviewMessages: Record<AiStatus, string> = {
  NotSubmitted: 'Phiên bản này chưa có kết quả kiểm tra của Hệ thống.',
  Checking: 'Hệ thống đang kiểm tra bài viết. Cập nhật kết quả sau ít giây.',
  Passed: 'Hệ thống chưa ghi nhận vấn đề trong phạm vi đã kiểm tra. Quản trị viên cần đọc bài trước khi quyết định.',
  Flagged: 'Hệ thống phát hiện nội dung cần xem xét. Đối chiếu lý do và bằng chứng trước khi quyết định.',
  Partial: 'Hệ thống chỉ kiểm tra được một phần bài viết. Quản trị viên cần xem thêm phạm vi chưa được kiểm tra.',
  Failed: 'Hệ thống chưa hoàn tất kiểm tra. Đây là lỗi xử lý, không phải kết luận bài viết vi phạm; Quản trị viên cần kiểm tra trực tiếp.',
}
const aiReviewStyles: Record<AiStatus, string> = {
  NotSubmitted: 'border-slate-200 bg-slate-50 text-slate-700',
  Checking: 'border-sky-200 bg-sky-50 text-sky-800',
  Passed: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  Flagged: 'border-red-300 bg-red-50 text-red-900',
  Partial: 'border-red-300 bg-red-50 text-red-900',
  Failed: 'border-red-300 bg-red-50 text-red-900',
}

// Thành phần AiReview nhận dữ liệu đầu vào và hiển thị phần giao diện thuộc kiểm duyệt nội dung và kết quả kiểm tra AI.
export function AiReview({ submission }: { submission: Submission }) {
  if (submission.systemRejectionReason)
    return <section aria-label="Kết quả tiền kiểm tiêu đề" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900 space-y-2">
      <h4 className="font-bold">Hệ thống từ chối: tiêu đề trùng</h4>
      <p>{submission.systemRejectionReason}</p>
      <p>Hệ thống chưa kiểm tra nội dung và ảnh của phiên bản này. Tác giả có thể đổi tiêu đề và gửi lại.</p>
    </section>
  if (submission.contentType === 'Video')
    return (
      <p className="rounded-xl bg-slate-50 p-4 text-sm">
        Video do Quản trị viên xem trực tiếp và quyết định, không qua kiểm tra tự động.
      </p>
    )
  // Hiển thị giao diện kiểm duyệt nội dung và kết quả kiểm tra AI từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
  return (
    <section aria-label="Kết quả kiểm tra của Hệ thống" className={`rounded-xl border p-4 space-y-2 text-sm break-words ${aiReviewStyles[submission.aiFlagStatus]}`}>
      <h4 className="flex items-center gap-2 font-bold">
        {['Flagged', 'Partial', 'Failed'].includes(submission.aiFlagStatus) && <AlertTriangle size={18} className="shrink-0 text-red-600" aria-hidden="true" />}
        Hệ thống: {aiStatusLabels[submission.aiFlagStatus]}
      </h4>
      <p role="status">{aiReviewMessages[submission.aiFlagStatus]}</p>
      {submission.aiCheckedAt && <p className="text-xs">Thời điểm kiểm tra: {formatDate(submission.aiCheckedAt)}</p>}
      {(
        [
          ['aiSummary', 'Tóm tắt'],
          ['aiFlagType', 'Loại cờ'],
          ['aiPriority', 'Mức ưu tiên'],
          ['aiFlagReason', 'Lý do'],
          ['aiEvidence', 'Bằng chứng'],
          ['aiCheckedScope', 'Phạm vi đã kiểm tra'],
          ['aiUncheckedScope', 'Phạm vi chưa kiểm tra'],
        ] as const
      ).map(
        ([key, label]) =>
          submission[key] && (
            <p key={key} className="whitespace-pre-wrap">
              <strong>{label}:</strong> {key === 'aiFlagType' ? ({ Spam: 'Nội dung rác', Abuse: 'Nội dung không phù hợp', Advertising: 'Quảng cáo', HealthClaim: 'Tuyên bố sức khỏe cần kiểm chứng', OffTopic: 'Không liên quan', InappropriateImage: 'Ảnh đại diện cần xem xét' }[submission[key]] || submission[key]) : key === 'aiPriority' ? ({ Low: 'Thấp', Medium: 'Trung bình', High: 'Cao' }[submission[key]] || submission[key]) : key === 'aiEvidence' ? submission[key] : formatSystemReviewMessage(submission[key])}
            </p>
          ),
      )}
      {submission.aiFlagStatus === 'Partial' &&
        !submission.aiUncheckedScope && (
          <p>Chưa có thông tin đầy đủ về phạm vi chưa kiểm tra.</p>
        )}
    </section>
  )
}

// Thành phần PrivateVideo nhận dữ liệu đầu vào và hiển thị phần giao diện thuộc kiểm duyệt nội dung và kết quả kiểm tra AI.
function PrivateVideo({ submission }: { submission: Submission }) {
  const [metadata, setMetadata] = useState<{ id: string; seconds: number } | null>(null)
  // Lưu dữ liệu và trạng thái thao tác của kiểm duyệt nội dung và kết quả kiểm tra AI trong vòng đời màn hình.
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Đồng bộ dữ liệu theo thay đổi đầu vào; hủy hoặc bỏ qua kết quả cũ khi màn hình thay đổi.
  useEffect(() => {
    const controller = new AbortController()
    let objectUrl: string | null = null
    fetch(
      `/api/videos/${submission.contentId}/media?submissionId=${submission.id}`,
      {
        headers: { Authorization: `Bearer ${getStoredToken() || ''}` },
        signal: controller.signal,
      },
    )
      .then(async (response) => {
        if (!response.ok)
          throw new Error(`Không tải được video (${response.status}).`)
        const blob = await response.blob()
        if (!controller.signal.aborted) {
          objectUrl = URL.createObjectURL(blob)
          setUrl(objectUrl)
        }
      })
      .catch((reason) => {
        if (!controller.signal.aborted) setError(errorMessage(reason))
      })
    return () => {
      controller.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [submission.id, submission.contentId])
  // Hiển thị giao diện kiểm duyệt nội dung và kết quả kiểm tra AI từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
  return (
    <div>
      <Feedback error={error} />
      {url ? (
        <video
          aria-label="Video gửi duyệt"
          controls
          preload="metadata"
          onLoadedMetadata={(event) => setMetadata({ id: submission.id, seconds: event.currentTarget.duration })}
          onError={() =>
            setError(
              'Trình duyệt không phát được định dạng video này. Tải tệp để kiểm tra nội dung.',
            )
          }
          src={url}
          className="w-full rounded-xl"
        />
      ) : (
        !error && <p className="text-sm">Đang tải video riêng tư...</p>
      )}
      {metadata?.id === submission.id && formatVideoDuration(metadata.seconds) && <p className="mt-2 text-xs text-slate-500">Thời lượng: {formatVideoDuration(metadata.seconds)}</p>}
      {url && error && (
        <a
          href={url}
          download="video-gui-duyet"
          className="text-sm font-bold text-emerald-800"
        >
          Tải video để kiểm tra
        </a>
      )}
    </div>
  )
}

// Tính hoặc tổng hợp chỉ số từ dữ liệu đầu vào của tính năng (ArticleSubmissionPreview); thuộc kiểm duyệt nội dung và kết quả kiểm tra AI.
function ArticleSubmissionPreview({ submission }: { submission: Submission }) {
  // Hiển thị giao diện kiểm duyệt nội dung và kết quả kiểm tra AI từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
  return (
    <section aria-label="Xem trước bài viết đã gửi" className="space-y-3">
      <div>
        <h4 className="text-base font-bold text-slate-900">Xem trước bài viết</h4>
        <p className="text-xs text-slate-500">
          Nội dung của phiên bản {submission.version} đã gửi, chưa công khai.
        </p>
      </div>
      <article className="overflow-hidden rounded-2xl border bg-white">
        {submission.mediaReference &&
          /^https?:\/\//i.test(submission.mediaReference) && (
            <img
              src={submission.mediaReference}
              alt="Ảnh đại diện bài viết đã gửi"
              referrerPolicy="no-referrer"
              className="max-h-72 w-full object-cover"
            />
          )}
        <div className="space-y-4 p-5 sm:p-6">
          <h3 className="text-2xl font-extrabold text-[#184d28]">
            {submission.title}
          </h3>
          <RichContentRenderer content={submission.textContent} />
        </div>
      </article>
    </section>
  )
}

// Thành phần ModerationWorkspace nhận dữ liệu đầu vào và hiển thị phần giao diện thuộc kiểm duyệt nội dung và kết quả kiểm tra AI.
export function ModerationWorkspace({
  contentType,
  onNavigate,
}: {
  contentType: 'Article' | 'Video'
  onNavigate?: (path: string) => void
}) {
  const requestedSubmissionId = new URLSearchParams(window.location.hash.split('?')[1] || '').get('submissionId')
  // Lưu dữ liệu và trạng thái thao tác của kiểm duyệt nội dung và kết quả kiểm tra AI trong vòng đời màn hình.
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<'' | 'PendingAdminReview' | 'Rejected'>(
    '',
  )
  const query = new URLSearchParams({ page: String(page), pageSize: '10' })
  query.set('contentType', contentType)
  if (status) query.set('adminStatus', status)
  const result = useApiData<{ items: Submission[]; totalCount: number }>(
    `/api/admin/moderation/submissions?${query}`,
  )
  const [selected, setSelected] = useState<Submission | null>(null)
  const [decision, setDecision] = useState<Decision | ''>('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  // Đồng bộ trạng thái hoặc tác động bên ngoài khi các phụ thuộc thay đổi.
  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(null), 5000)
    return () => window.clearTimeout(timeout)
  }, [notice])
  const title =
    contentType === 'Article' ? 'Quản lý bài viết' : 'Quản lý video'
  const ContentIcon = contentType === 'Article' ? FileText : Video
  // Đồng bộ dữ liệu theo thay đổi đầu vào; hủy hoặc bỏ qua kết quả cũ khi màn hình thay đổi.
  useEffect(() => {
    if (!requestedSubmissionId) return
    let active = true
    void adminModerationApi.get(requestedSubmissionId).then(submission => {
      if (!active) return
      if (submission.contentType !== contentType) {
        setError('Phiên bản không thuộc loại nội dung này.')
        return
      }
      setSelected(submission)
      setDecision('')
      setReason('')
    }).catch(reason => { if (active) setError(errorMessage(reason)) })
    return () => { active = false }
  }, [requestedSubmissionId, contentType])
  // Xử lý lựa chọn hoặc chuyển trạng thái giao diện theo thao tác người dùng (open); thuộc kiểm duyệt nội dung và kết quả kiểm tra AI.
  async function open(id: string) {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      setSelected(await adminModerationApi.get(id))
      setDecision('')
      setReason('')
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setBusy(false)
    }
  }
  const columns: ColumnDef<Submission>[] = [
    {
      key: 'title',
      header: 'Nội dung',
      render: (item) => (
        <div className="min-w-48 max-w-sm space-y-1.5">
          <strong className="text-sm font-semibold leading-relaxed text-slate-900">
            {item.title}
          </strong>
          <p className="text-xs text-slate-500">
            {item.contentType === 'Article' ? 'Bài viết' : 'Video'} · Phiên bản{' '}
            {item.version}
            {item.isCurrentPublished ? ' · Đang công khai' : ''}
          </p>
          {item.pendingReporterCount > 0 && (
            <span className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-800">
              {item.pendingReporterCount} người đang báo cáo
            </span>
          )}
          {item.systemRejectionReason && <p className="text-xs font-semibold text-red-700">Hệ thống từ chối: tiêu đề trùng</p>}
        </div>
      ),
    },
    {
      key: 'ownerName',
      header: 'Tên tác giả',
      render: (item) => (
        <span className="break-words text-xs">{item.ownerName?.trim() || 'Không có thông tin tác giả'}</span>
      ),
    },
    {
      key: 'adminReviewStatus',
      header: 'Trạng thái duyệt',
      render: (item) => (
        <span
          className={`${statusBadgeClass} ${adminStatusStyles[item.adminReviewStatus]}`}
        >
          {adminStatusLabels[item.adminReviewStatus]}
        </span>
      ),
    },
    {
      key: 'submittedAt',
      header: 'Ngày gửi',
      render: (item) => formatDate(item.submittedAt),
    },
    // Video chỉ do Admin kiểm duyệt; cột AI dành riêng cho bài viết.
    ...(contentType === 'Article' ? [{
      key: 'aiFlagStatus',
      header: 'Kiểm tra của Hệ thống',
      render: (item: Submission) => (
        <div className="min-w-40 max-w-xs space-y-2">
          <span className={`${statusBadgeClass} ${aiReviewStyles[item.aiFlagStatus]}`}>
            {aiStatusLabels[item.aiFlagStatus]}
          </span>
          <p className="text-xs leading-relaxed text-slate-600">{formatSystemReviewMessage(item.aiSummary) || aiReviewMessages[item.aiFlagStatus]}</p>
        </div>
      ),
    }] : []),
    {
      key: 'actions',
      header: 'Thao tác',
      render: (item) => (
        <button
          type="button"
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-wait disabled:opacity-50"
          onClick={() => void open(item.id)}
        >
          Xem / kiểm duyệt
          <ArrowUpRight size={14} className="shrink-0" aria-hidden="true" />
        </button>
      ),
    },
  ]
  // Hiển thị giao diện kiểm duyệt nội dung và kết quả kiểm tra AI từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
  return (
    <AdminFrame
      menu={contentType === 'Article' ? 'articles' : 'videos'}
      title={title}
      subtitle="Xem đúng phiên bản đã gửi và lịch sử quyết định duyệt."
      onNavigate={onNavigate}
    >
      <Feedback error={error} />
      {notice && (
        <div role="status" className="fixed right-4 top-20 z-[110] max-w-sm rounded-xl border border-emerald-200 bg-white px-5 py-4 text-sm font-semibold text-emerald-800 shadow-xl">
          {notice}
        </div>
      )}
      <section className="flex flex-col gap-5 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-3.5">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <ShieldCheck size={22} aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Duyệt nội dung cộng đồng
            </h2>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-500">
              {contentType === 'Article'
                ? 'Xem kết quả kiểm tra của Hệ thống, đối chiếu bài viết và đưa ra quyết định xuất bản.'
                : 'Xem trực tiếp video và kiểm tra nội dung trước khi xuất bản.'}
            </p>
          </div>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
          <ContentIcon size={14} aria-hidden="true" />
          {contentType === 'Article' ? 'Bài viết' : 'Video'}
        </span>
      </section>
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:p-6">
        <div className="w-full sm:max-w-xs">
          <Select
            label="Trạng thái kiểm duyệt"
            aria-label="Trạng thái kiểm duyệt"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as typeof status)
              setPage(1)
            }}
            options={[
              { value: '', label: 'Tất cả' },
              { value: 'PendingAdminReview', label: 'Chờ Quản trị viên duyệt' },
              { value: 'Rejected', label: 'Đã từ chối' },
            ]}
          />
        </div>
        <button
          type="button"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-wait disabled:opacity-50"
          disabled={result.loading}
          onClick={result.reload}
        >
          <RefreshCw
            size={16}
            className={result.loading ? 'motion-safe:animate-spin' : ''}
            aria-hidden="true"
          />
          Làm mới
        </button>
      </div>
      <SharedDataTable
        title={
          status === 'PendingAdminReview'
            ? 'Nội dung chờ duyệt'
            : status === 'Rejected'
              ? 'Nội dung đã từ chối'
              : 'Tất cả nội dung'
        }
        totalCountBadge={
          result.loading || result.error
            ? undefined
            : result.data?.totalCount ?? 0
        }
        columns={columns}
        data={result.data?.items || []}
        keyExtractor={(item) => item.id}
        isLoading={result.loading}
        error={result.error}
        onRetry={result.reload}
        currentPage={page}
        totalPages={Math.max(1, Math.ceil((result.data?.totalCount || 0) / 10))}
        totalItems={result.data?.totalCount || 0}
        pageSize={10}
        onPageChange={setPage}
        emptyMessage="Không có nội dung phù hợp."
      />
      <Modal
        isOpen={!!selected}
        onClose={() => {
          if (!busy) setSelected(null)
        }}
        title={selected?.title}
        maxWidth="2xl"
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <p className="break-words">Tên tác giả: {selected.ownerName?.trim() || 'Không có thông tin tác giả'}</p>
            <p>
              Phiên bản {selected.version} ·{' '}
              {adminStatusLabels[selected.adminReviewStatus]} ·{' '}
              {formatDate(selected.submittedAt)}
            </p>
            {selected.pendingReporterCount > 0 && (
              <p className="w-fit rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-800">
                {selected.pendingReporterCount} người đang báo cáo nội dung này
              </p>
            )}
            {selected.contentType === 'Article' && (
              <div className="space-y-2">
                <AiReview submission={selected} />
                <button type="button" disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 font-semibold text-emerald-800 disabled:opacity-50"
                  onClick={async () => {
                    setBusy(true)
                    setError(null)
                    try {
                      // Chỉ đọc lại đúng phiên bản đang xem, giữ lựa chọn và lý do Admin đã nhập.
                      setSelected(await adminModerationApi.get(selected.id))
                      result.reload()
                    } catch (reason) {
                      setError(errorMessage(reason))
                    } finally {
                      setBusy(false)
                    }
                  }}>
                  <RefreshCw size={14} aria-hidden="true" />
                  {busy ? 'Đang cập nhật...' : 'Cập nhật kết quả hệ thống'}
                </button>
                <Feedback error={error} />
              </div>
            )}
            {selected.contentType === 'Article' ? (
              <ArticleSubmissionPreview submission={selected} />
            ) : (
              <p className="whitespace-pre-wrap break-words">
                {selected.textContent}
              </p>
            )}
            {selected.contentType === 'Video' && selected.mediaReference && (
              <PrivateVideo key={selected.id} submission={selected} />
            )}
            <h4 className="font-bold">Lịch sử quyết định</h4>
            {selected.decisions.length ? (
              selected.decisions.map((item) => (
                <div key={item.id} className="rounded-xl bg-slate-50 p-3">
                  <p>
                    {decisionLabels[item.decision]} · Phiên bản {item.version}
                  </p>
                  <p className="break-all">
                    Quản trị viên: {item.adminUserId} · {formatDate(item.decidedAt)}
                  </p>
                  <p className="whitespace-pre-wrap">{item.reason}</p>
                </div>
              ))
            ) : (
              <p>Chưa có quyết định.</p>
            )}
            {(selected.adminReviewStatus === 'PendingAdminReview' ||
              (selected.adminReviewStatus === 'Published' &&
                selected.isCurrentPublished)) && (
              <form
                className="space-y-3 border-t pt-4"
                onSubmit={async (event) => {
                  event.preventDefault()
                  if (!decision || !reason.trim() || busy) return
                  setBusy(true)
                  setError(null)
                  try {
                    await adminModerationApi.decide(
                      selected.id,
                      decision,
                      reason.trim(),
                    )
                    setSelected(null)
                    setNotice('Đã lưu quyết định kiểm duyệt.')
                    setDecision('')
                    setReason('')
                    result.reload()
                  } catch (reason) {
                    setError(errorMessage(reason))
                    try {
                      setSelected(await adminModerationApi.get(selected.id))
                    } catch {
                      /* Keep the reviewed version visible. */
                    }
                  } finally {
                    setBusy(false)
                  }
                }}
              >
                <Select
                  label="Quyết định"
                  aria-label="Quyết định"
                  required
                  disabled={busy}
                  value={decision}
                  onChange={(e) => setDecision(e.target.value as Decision)}
                  options={[
                    { value: '', label: 'Chọn quyết định' },
                    ...(selected.adminReviewStatus === 'Published'
                      ? ['Remove']
                      : ['Approve', 'RequestRevision', 'Reject']
                    ).map((value) => ({
                      value,
                      label: decisionLabels[value as Decision],
                    })),
                  ]}
                />
                <label className="block">
                  Lý do
                  <textarea
                    required
                    maxLength={2000}
                    disabled={busy}
                    className={fieldClass}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </label>
                <Feedback error={error} />
                <button
                  disabled={busy || !decision || !reason.trim()}
                  className={primaryClass}
                >
                  {busy ? 'Đang lưu...' : 'Lưu quyết định'}
                </button>
              </form>
            )}
          </div>
        )}
      </Modal>
    </AdminFrame>
  )
}
export type { AdminStatus }
