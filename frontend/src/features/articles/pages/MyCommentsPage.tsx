import { useState } from 'react'
import {
  ExternalLink,
  MessageSquare,
  Pencil,
  Search,
  ThumbsUp,
  Trash2,
} from 'lucide-react'
import { UserProfileShell } from '../../profile/components/UserProfileShell'
import { Select } from '../../../shared/components/Select'
import { Button, EmptyState } from '../../../shared/components'
import { Feedback, Pager } from '../../admin/components/ApiWorkspace'
import { useApiData } from '../../admin/hooks/useApiData'
import { errorMessage, formatDate } from '../../admin/utils/apiUi'
import {
  commentApi,
  type CommentRecord,
  type ContentPage,
} from '../api/articles.api'

function getCommentStatusBadge(status: string) {
  switch (status) {
    case 'Visible':
      return 'bg-emerald-50 text-[#2E7D32] border border-emerald-200'
    case 'Hidden':
      return 'bg-amber-50 text-amber-800 border border-amber-200'
    case 'Removed':
      return 'bg-rose-50 text-rose-700 border border-rose-200'
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-200'
  }
}

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
      breadcrumbs={[
        { label: 'Trang chủ', path: '/' },
        { label: 'Tài khoản', path: '/profile' },
        { label: 'Bình luận của tôi' },
      ]}
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-8 space-y-6 shadow-xs">
        {/* Header */}
        <div className="border-b border-slate-100 pb-5">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Bình luận của tôi
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Theo dõi các ý kiến thảo luận và đóng góp của bạn trên bài viết và video.
          </p>
        </div>

        {/* Thanh tìm kiếm & lọc */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              aria-label="Tìm bình luận của tôi"
              placeholder="Tìm kiếm nội dung bình luận..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32]"
              maxLength={120}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </div>
          <div className="w-48">
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
          <Button variant="outline" size="sm" onClick={result.reload}>
            Thử lại
          </Button>
        )}

        {/* Danh sách bình luận */}
        {result.loading ? (
          <div className="space-y-3 py-4">
            <div className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
            <div className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
          </div>
        ) : result.data?.items.length ? (
          <div className="space-y-4">
            {result.data.items.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 hover:border-emerald-200 transition-all shadow-xs"
              >
                {/* Meta header */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md">
                      {item.targetType === 'Article' ? 'Bài viết' : 'Video'}
                    </span>
                    <span>#{item.targetId.slice(0, 8)}</span>
                    <span>·</span>
                    <span>{formatDate(item.createdAt)}</span>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getCommentStatusBadge(item.status)}`}
                  >
                    {item.status === 'Visible'
                      ? 'Đang hiển thị'
                      : item.status === 'Hidden'
                        ? 'Đã ẩn'
                        : 'Đã gỡ'}
                  </span>
                </div>

                {/* Nội dung bình luận hoặc form chỉnh sửa */}
                {editing?.id === item.id ? (
                  <form
                    className="space-y-3 pt-1"
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
                      rows={3}
                      aria-label="Sửa nội dung bình luận"
                      disabled={busy}
                      className="w-full p-3 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32]"
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        size="sm"
                        variant="primary"
                        disabled={busy}
                        isLoading={busy}
                      >
                        Lưu thay đổi
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setEditing(null)}
                      >
                        Hủy
                      </Button>
                    </div>
                  </form>
                ) : (
                  <p className="whitespace-pre-wrap text-sm text-slate-800 leading-relaxed bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                    {item.body}
                  </p>
                )}

                {/* Hàng hành động */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-3">
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<ExternalLink size={13} />}
                      onClick={() =>
                        onNavigate(
                          `/${item.targetType === 'Article' ? 'articles' : 'videos'}/${item.targetId}`,
                        )
                      }
                    >
                      Mở nội dung
                    </Button>
                    <span className="inline-flex items-center gap-1.5 text-slate-500 font-medium">
                      <ThumbsUp size={13} className="text-emerald-600" />
                      <span>{item.likeCount} lượt thích</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.status === 'Visible' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        leftIcon={<Pencil size={12} />}
                        onClick={() => {
                          setEditing(item)
                          setBody(item.body || '')
                        }}
                      >
                        Sửa
                      </Button>
                    )}
                    {item.status !== 'Removed' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        leftIcon={<Trash2 size={12} />}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
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
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !result.loading &&
          result.data?.totalCount === 0 && (
            <EmptyState
              title="Chưa có bình luận nào"
              description="Bạn chưa đăng bình luận nào trên các bài viết hoặc video."
              icon={<MessageSquare size={44} className="text-[#2E7D32]" />}
            />
          )
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
