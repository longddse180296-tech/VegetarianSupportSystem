import { useState } from 'react'
import { RefreshCw, Search } from 'lucide-react'
import {
  SharedDataTable,
  type ColumnDef,
} from '../../../../shared/components/SharedDataTable'
import { Modal } from '../../../../shared/components/Modal'
import { Select } from '../../../../shared/components/Select'
import { apiClient } from '../../../../shared/api/apiClient'
import { AdminFrame, Feedback } from '../../components/ApiWorkspace'
import { useApiData } from '../../hooks/useApiData'
import {
  fieldClass,
  primaryClass,
  secondaryClass,
  errorMessage,
  formatDate,
} from '../../utils/apiUi'
import type {
  CommentRecord,
  ContentPage,
} from '../../../articles/api/articles.api'
export const AdminCommentsPage = ({
  onNavigate,
}: {
  onNavigate?: (path: string) => void
}) => {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')
  const result = useApiData<ContentPage<CommentRecord>>(
    `/api/admin/comments?page=${page}&pageSize=10&search=${encodeURIComponent(search)}${status ? `&status=${status}` : ''}${type ? `&targetType=${type}` : ''}`,
  )
  const [selected, setSelected] = useState<CommentRecord | null>(null)
  const [action, setAction] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const labels = { Visible: 'Đang hiển thị', Hidden: 'Đã ẩn', Removed: 'Đã gỡ' }
  const columns: ColumnDef<CommentRecord>[] = [
    {
      key: 'body',
      header: 'Bình luận',
      render: (item) => (
        <p className="line-clamp-3 max-w-sm whitespace-pre-wrap">
          {item.body || '—'}
        </p>
      ),
    },
    {
      key: 'authorId',
      header: 'ID tác giả',
      render: (item) => (
        <span className="break-all text-xs">{item.authorId}</span>
      ),
    },
    {
      key: 'target',
      header: 'Nội dung',
      render: (item) => (
        <span className="text-xs">
          {item.targetType === 'Article' ? 'Bài viết' : 'Video'} #
          {item.targetId.slice(0, 8)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (item) => labels[item.status],
    },
    {
      key: 'createdAt',
      header: 'Ngày tạo',
      render: (item) => formatDate(item.createdAt),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (item) => (
        <button
          className="fe1-link font-bold text-emerald-800"
          onClick={() => {
            setSelected(item)
            setReason('')
            setAction('')
            setError(null)
          }}
        >
          Xem / xử lý
        </button>
      ),
    },
  ]
  return (
    <AdminFrame
      menu="comments"
      title="Quản lý bình luận"
      subtitle="Theo dõi thảo luận cộng đồng và quản lý nội dung bình luận."
      onNavigate={onNavigate}
    >
      <div className="admin-filter-bar grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] xl:items-end">
        <label className="min-w-0 space-y-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500"><Search aria-hidden="true" size={14} />Tìm kiếm</span>
        <input
          type="search"
          aria-label="Tìm bình luận"
          maxLength={120}
          className={fieldClass}
          placeholder="Tìm nội dung..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
        </label>
        <div className="min-w-44 space-y-2">
          <Select
            label="Trạng thái"
            aria-label="Trạng thái bình luận"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
            options={[
              { value: '', label: 'Tất cả trạng thái' },
              ...Object.entries(labels).map(([value, label]) => ({
                value,
                label,
              })),
            ]}
          />
        </div>
        <div className="min-w-44 space-y-2">
          <Select
            label="Loại nội dung"
            aria-label="Loại nội dung bình luận"
            value={type}
            onChange={(e) => {
              setType(e.target.value)
              setPage(1)
            }}
            options={[
              { value: '', label: 'Tất cả nội dung' },
              { value: 'Article', label: 'Bài viết' },
              { value: 'Video', label: 'Video' },
            ]}
          />
        </div>
        <button type="button" className={`${secondaryClass} inline-flex min-h-11 items-center justify-center gap-2 self-end`} disabled={result.loading} onClick={result.reload}>
          <RefreshCw aria-hidden="true" size={15} className={result.loading ? 'motion-safe:animate-spin' : ''} />
          Làm mới
        </button>
      </div>
      <SharedDataTable
        title="Bình luận cộng đồng"
        totalCountBadge={result.data?.totalCount}
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
      />
      <Modal
        isOpen={!!selected}
        onClose={() => {
          if (!busy) setSelected(null)
        }}
        title="Chi tiết bình luận"
        maxWidth="xl"
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <p className="whitespace-pre-wrap break-words">{selected.body}</p>
            <p>Trạng thái: {labels[selected.status]}</p>
            <p className="break-all">Tác giả (ID): {selected.authorId}</p>
            <p className="break-all">
              Nội dung: {selected.targetType} · {selected.targetId}
            </p>
            {selected.parentId && (
              <p className="break-all">
                Trả lời bình luận: {selected.parentId}
              </p>
            )}
            <p>
              {selected.likeCount} lượt thích · {formatDate(selected.createdAt)}
            </p>
            {selected.moderationReason && (
              <div className="rounded-xl bg-amber-50 p-3">
                <p>Lý do: {selected.moderationReason}</p>
                <p className="break-all">
                  Admin: {selected.moderatedBy} ·{' '}
                  {formatDate(selected.moderatedAt)}
                </p>
              </div>
            )}
            {selected.status !== 'Removed' && (
              <form
                className="space-y-3 border-t pt-4"
                onSubmit={async (event) => {
                  event.preventDefault()
                  if (!action || !reason.trim() || busy) return
                  setBusy(true)
                  setError(null)
                  try {
                    setSelected(
                      await apiClient.post<CommentRecord>(
                        `/api/admin/comments/${selected.id}/${action}`,
                        { reason: reason.trim() },
                      ),
                    )
                    setAction('')
                    setReason('')
                    result.reload()
                  } catch (reason) {
                    setError(errorMessage(reason))
                  } finally {
                    setBusy(false)
                  }
                }}
              >
                <Select
                  label="Thao tác"
                  aria-label="Thao tác"
                  required
                  disabled={busy}
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  options={[
                    { value: '', label: 'Chọn thao tác' },
                    ...(selected.status === 'Visible'
                      ? [{ value: 'hide', label: 'Ẩn bình luận' }]
                      : []),
                    { value: 'remove', label: 'Gỡ bình luận' },
                  ]}
                />
                <label className="block">
                  Lý do
                  <textarea
                    required
                    disabled={busy}
                    maxLength={1000}
                    className={fieldClass}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </label>
                <Feedback error={error} />
                <button
                  className={primaryClass}
                  disabled={busy || !action || !reason.trim()}
                >
                  Lưu quyết định
                </button>
              </form>
            )}
          </div>
        )}
      </Modal>
    </AdminFrame>
  )
}
export default AdminCommentsPage
