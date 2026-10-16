import { useEffect, useState } from 'react'
import {
  ArrowUpRight,
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

export function AiReview({ submission }: { submission: Submission }) {
  if (submission.contentType === 'Video')
    return (
      <p className="rounded-xl bg-slate-50 p-4 text-sm">
        Video do Admin xem trực tiếp và quyết định. Không có kết quả kiểm tra
        AI.
      </p>
    )
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2 text-sm">
      <p className="font-bold">AI: {aiStatusLabels[submission.aiFlagStatus]}</p>
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
              <strong>{label}:</strong> {submission[key]}
            </p>
          ),
      )}
      {submission.aiFlagStatus === 'Failed' && (
        <p className="font-semibold text-amber-900">
          AI không hoàn tất kiểm tra. Đây không phải kết quả đạt; Admin cần xem
          trực tiếp toàn bộ nội dung trước khi quyết định.
        </p>
      )}
      {submission.aiFlagStatus === 'Partial' &&
        !submission.aiUncheckedScope && (
          <p>Chưa có thông tin đầy đủ về phạm vi chưa kiểm tra.</p>
        )}
    </div>
  )
}

function PrivateVideo({ submission }: { submission: Submission }) {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
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
  return (
    <div>
      <Feedback error={error} />
      {url ? (
        <video
          aria-label="Video gửi duyệt"
          controls
          preload="metadata"
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

function ArticleSubmissionPreview({ submission }: { submission: Submission }) {
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

export function ModerationWorkspace({
  contentType,
  onNavigate,
}: {
  contentType: 'Article' | 'Video'
  onNavigate?: (path: string) => void
}) {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<'' | 'PendingAdminReview' | 'Rejected'>(
    'PendingAdminReview',
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
  const title =
    contentType === 'Article' ? 'Quản lý bài viết' : 'Quản lý video'
  const ContentIcon = contentType === 'Article' ? FileText : Video
  async function open(id: string) {
    setBusy(true)
    setError(null)
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
        </div>
      ),
    },
    {
      key: 'ownerUserId',
      header: 'ID tác giả',
      render: (item) => (
        <span className="break-all text-xs">{item.ownerUserId}</span>
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
  return (
    <AdminFrame
      menu={contentType === 'Article' ? 'articles' : 'videos'}
      title={title}
      subtitle="Xem đúng phiên bản đã gửi và lịch sử quyết định duyệt."
      onNavigate={onNavigate}
    >
      <Feedback error={error} notice={notice} />
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
                ? 'Xem trực tiếp bài viết và kiểm tra nội dung trước khi đưa ra quyết định xuất bản.'
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
              { value: 'PendingAdminReview', label: 'Chờ Admin duyệt' },
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
            <p>
              Phiên bản {selected.version} ·{' '}
              {adminStatusLabels[selected.adminReviewStatus]} ·{' '}
              {formatDate(selected.submittedAt)}
            </p>
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
                    Admin: {item.adminUserId} · {formatDate(item.decidedAt)}
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
                    const updated = await adminModerationApi.decide(
                      selected.id,
                      decision,
                      reason.trim(),
                    )
                    setSelected(updated)
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
