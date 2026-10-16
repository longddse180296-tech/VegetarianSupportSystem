import { useState } from 'react'
import { UserProfileShell } from '../../profile/components/UserProfileShell'
import { Select } from '../../../shared/components/Select'
import { Feedback, Pager } from '../../admin/components/ApiWorkspace'
import { useApiData } from '../../admin/hooks/useApiData'
import {
  fieldClass,
  primaryClass,
  secondaryClass,
  errorMessage,
  formatDate,
} from '../../admin/utils/apiUi'
import {
  commentApi,
  type CommentRecord,
  type ContentPage,
} from '../api/articles.api'
export const MyCommentsPage = ({
  onNavigate,
}: {
  onNavigate: (path: string) => void
}) => {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const result = useApiData<ContentPage<CommentRecord>>(
    `/api/me/comments?page=${page}&pageSize=10&search=${encodeURIComponent(search)}${type ? `&targetType=${type}` : ''}`,
  )
  const [editing, setEditing] = useState<CommentRecord | null>(null)
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  return (
    <UserProfileShell
      activeTab="my-comments"
      onNavigate={onNavigate}
      statBadge={{ count: result.data?.totalCount || 0, label: 'Bình luận' }}
    >
      <div className="rounded-2xl border bg-white p-5 sm:p-8 space-y-5">
        <h1 className="font-bold text-2xl text-[#184d28]">Bình luận của tôi</h1>
        <div className="flex flex-wrap items-center gap-3">
          <input
            aria-label="Tìm bình luận của tôi"
            placeholder="Tìm nội dung..."
            className={`${fieldClass} max-w-md`}
            maxLength={120}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
          <div className="min-w-44">
            <Select
              aria-label="Nguồn bình luận"
              value={type}
              onChange={(e) => {
                setType(e.target.value)
                setPage(1)
              }}
              options={[
                { value: '', label: 'Tất cả nguồn' },
                { value: 'Article', label: 'Bài viết' },
                { value: 'Video', label: 'Video' },
              ]}
            />
          </div>
        </div>
        <Feedback error={error || result.error} />
        {result.error && (
          <button className={secondaryClass} onClick={result.reload}>
            Thử lại
          </button>
        )}
        {result.loading ? (
          <p>Đang tải...</p>
        ) : (
          result.data?.items.map((item) => (
            <div key={item.id} className="rounded-xl border p-4 space-y-3">
              <p className="text-xs text-slate-500">
                {item.targetType === 'Article' ? 'Bài viết' : 'Video'} #
                {item.targetId.slice(0, 8)} · {formatDate(item.createdAt)} ·{' '}
                {item.status === 'Visible'
                  ? 'Đang hiển thị'
                  : item.status === 'Hidden'
                    ? 'Đã ẩn'
                    : 'Đã gỡ'}
              </p>
              {editing?.id === item.id ? (
                <form
                  className="space-y-3"
                  onSubmit={async (event) => {
                    event.preventDefault()
                    if (busy || !body.trim()) return
                    setBusy(true)
                    setError(null)
                    try {
                      await commentApi.update(item.id, body.trim())
                      setEditing(null)
                      result.reload()
                    } catch (reason) {
                      setError(errorMessage(reason))
                    } finally {
                      setBusy(false)
                    }
                  }}
                >
                  <textarea
                    required
                    maxLength={2000}
                    aria-label="Sửa nội dung bình luận"
                    disabled={busy}
                    className={fieldClass}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                  />
                  <button disabled={busy} className={primaryClass}>
                    Lưu
                  </button>
                  <button
                    type="button"
                    className={`fe1-control ${secondaryClass} ml-2`}
                    onClick={() => setEditing(null)}
                  >
                    Hủy
                  </button>
                </form>
              ) : (
                <p className="whitespace-pre-wrap text-sm">{item.body}</p>
              )}
              <div className="flex flex-wrap gap-3">
                <button
                  className="fe1-link text-sm text-emerald-800"
                  onClick={() =>
                    onNavigate(
                      `/${item.targetType === 'Article' ? 'articles' : 'videos'}/${item.targetId}`,
                    )
                  }
                >
                  Mở nội dung
                </button>
                <span className="text-sm text-slate-500">
                  {item.likeCount} lượt thích
                </span>
                {item.status === 'Visible' && (
                  <button
                    disabled={busy}
                    className="fe1-link text-sm text-emerald-800"
                    onClick={() => {
                      setEditing(item)
                      setBody(item.body || '')
                    }}
                  >
                    Sửa
                  </button>
                )}
                {item.status !== 'Removed' && (
                  <button
                    disabled={busy}
                    className="fe1-link text-sm text-rose-700"
                    onClick={async () => {
                      if (!window.confirm('Gỡ bình luận này?')) return
                      setBusy(true)
                      setError(null)
                      try {
                        await commentApi.remove(item.id)
                        result.reload()
                      } catch (reason) {
                        setError(errorMessage(reason))
                      } finally {
                        setBusy(false)
                      }
                    }}
                  >
                    Gỡ
                  </button>
                )}
              </div>
            </div>
          ))
        )}
        {!result.loading && result.data?.totalCount === 0 && (
          <p>Chưa có bình luận phù hợp.</p>
        )}
        <Pager
          page={page}
          total={result.data?.totalCount || 0}
          onChange={setPage}
        />
      </div>
    </UserProfileShell>
  )
}
export default MyCommentsPage
