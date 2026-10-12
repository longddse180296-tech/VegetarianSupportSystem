import { useState } from 'react'
import { useAuth } from '../../auth'
import { apiClient } from '../../../shared/api/apiClient'
import { Feedback, Pager } from '../../admin/components/ApiWorkspace'
import { useApiData } from '../../admin/hooks/useApiData'
import {
  primaryClass,
  secondaryClass,
  fieldClass,
  errorMessage,
  formatDate,
} from '../../admin/utils/apiUi'
import {
  commentApi,
  type CommentRecord,
  type ContentPage,
  type PublicArticleDetail,
  type Reaction,
} from '../api/articles.api'
import { RichContentRenderer } from '../components/RichContentRenderer'

function CommentLike({
  comment,
  signedIn,
}: {
  comment: CommentRecord
  signedIn: boolean
}) {
  const reaction = useApiData<Reaction>(`/api/comments/${comment.id}/like`)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  return (
    <div>
      <button
        disabled={
          !signedIn || busy || !reaction.data || comment.status !== 'Visible'
        }
        className="fe1-link text-xs font-semibold text-emerald-800 disabled:text-slate-500"
        onClick={async () => {
          if (!reaction.data || busy) return
          setBusy(true)
          setError(null)
          try {
            reaction.setData(
              await commentApi.react(comment.id, reaction.data.reactedByMe),
            )
          } catch (reason) {
            setError(errorMessage(reason))
          } finally {
            setBusy(false)
          }
        }}
      >
        {reaction.data?.reactedByMe ? 'Bỏ thích' : 'Thích'} ·{' '}
        {reaction.data?.count ?? comment.likeCount}
      </button>
      {(error || reaction.error) && (
        <p role="alert" className="text-xs text-rose-700">
          {error || reaction.error}
        </p>
      )}
    </div>
  )
}

export const ArticleDetail = ({
  articleId,
  onBackToList,
  onCreateArticle,
  onEditArticle,
  onSelectRelatedArticle,
}: {
  articleId: string
  onBackToList: () => void
  onCreateArticle?: () => void
  onEditArticle?: (id: string) => void
  onSelectRelatedArticle?: (id: string) => void
}) => {
  const { user } = useAuth()
  const article = useApiData<PublicArticleDetail>(
    `/api/articles/${encodeURIComponent(articleId)}`,
  )
  const helpful = useApiData<Reaction>(
    `/api/articles/${encodeURIComponent(articleId)}/helpful`,
  )
  const [page, setPage] = useState(1)
  const comments = useApiData<ContentPage<CommentRecord>>(
    `/api/comments?targetType=Article&targetId=${encodeURIComponent(articleId)}&page=${page}&pageSize=10`,
  )
  const [body, setBody] = useState('')
  const [reply, setReply] = useState<CommentRecord | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [editBody, setEditBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function action(work: () => Promise<unknown>) {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      await work()
      comments.reload()
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <button
        className="fe1-link font-bold text-sm text-emerald-800"
        onClick={onBackToList}
      >
        ← Danh sách bài viết
      </button>
      <Feedback error={article.error} />
      {article.error && (
        <button className={secondaryClass} onClick={article.reload}>
          Thử tải lại
        </button>
      )}
      {article.loading && <p>Đang tải bài viết...</p>}
      {article.data && (
        <>
          <article className="rounded-3xl border bg-white overflow-hidden">
            {article.data.coverImageUrl && (
              <img
                alt=""
                src={article.data.coverImageUrl}
                className="w-full max-h-96 object-cover"
              />
            )}
            <div className="p-5 sm:p-9 space-y-5">
              <p className="text-sm font-bold text-emerald-800">
                {article.data.category}
              </p>
              <h1 className="text-3xl font-extrabold text-[#184d28]">
                {article.data.title}
              </h1>
              <p className="text-xs text-slate-500 break-all">
                Tác giả (ID): {article.data.authorId} ·{' '}
                {formatDate(article.data.publishedAt)} · Phiên bản{' '}
                {article.data.version}
              </p>
              <RichContentRenderer content={article.data.content} />
              <div className="flex flex-wrap gap-3 border-t pt-5">
                <button
                  disabled={!user || busy || !helpful.data}
                  className={secondaryClass}
                  onClick={async () => {
                    if (!helpful.data) return
                    setBusy(true)
                    setError(null)
                    try {
                      const path = `/api/articles/${articleId}/helpful`
                      helpful.setData(
                        helpful.data.reactedByMe
                          ? await apiClient.delete<Reaction>(path)
                          : await apiClient.put<Reaction>(path),
                      )
                    } catch (reason) {
                      setError(errorMessage(reason))
                    } finally {
                      setBusy(false)
                    }
                  }}
                >
                  {helpful.data?.reactedByMe
                    ? 'Bỏ đánh giá hữu ích'
                    : 'Hữu ích'}{' '}
                  · {helpful.data?.count ?? '—'}
                </button>
                {user?.id === article.data.authorId && (
                  <button
                    className={secondaryClass}
                    onClick={() => onEditArticle?.(articleId)}
                  >
                    Mở bản nháp của tôi
                  </button>
                )}
                <button className={primaryClass} onClick={onCreateArticle}>
                  Chia sẻ bài viết
                </button>
              </div>
              <Feedback error={error || helpful.error} />
            </div>
          </article>
          <section className="rounded-2xl border bg-white p-5 sm:p-8 space-y-5">
            <h2 className="text-xl font-bold text-[#184d28]">Bình luận</h2>
            <Feedback error={error || comments.error} />
            {comments.error && (
              <button className={secondaryClass} onClick={comments.reload}>
                Thử tải bình luận lại
              </button>
            )}
            {user ? (
              <form
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault()
                  if (!body.trim()) return
                  void action(async () => {
                    await commentApi.create(
                      articleId,
                      body.trim(),
                      reply?.id || null,
                    )
                    setBody('')
                    setReply(null)
                  })
                }}
              >
                {reply && (
                  <p className="text-sm text-emerald-800">
                    Trả lời bình luận của {reply.authorId.slice(0, 8)}{' '}
                    <button className="fe1-control" type="button" onClick={() => setReply(null)}>
                      · Hủy trả lời
                    </button>
                  </p>
                )}
                <textarea
                  aria-label="Nội dung bình luận"
                  required
                  maxLength={2000}
                  rows={3}
                  disabled={busy}
                  className={fieldClass}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Chia sẻ ý kiến của bạn..."
                />
                <button
                  className={primaryClass}
                  disabled={busy || !body.trim()}
                >
                  Gửi bình luận
                </button>
              </form>
            ) : (
              <p className="text-sm text-slate-500">
                Đăng nhập để bình luận và đánh giá hữu ích.
              </p>
            )}
            {comments.loading ? (
              <p>Đang tải bình luận...</p>
            ) : (
              comments.data?.items.map((comment) => (
                <div
                  key={comment.id}
                  className={`rounded-xl border p-4 space-y-2 ${comment.parentId ? 'sm:ml-8 bg-slate-50' : ''}`}
                >
                  <p className="text-xs text-slate-500 break-all">
                    Tác giả (ID): {comment.authorId} ·{' '}
                    {formatDate(comment.createdAt)}
                  </p>
                  {comment.parentId && (
                    <p className="text-xs text-slate-500">
                      Phản hồi bình luận #{comment.parentId.slice(0, 8)}
                    </p>
                  )}
                  {editing === comment.id ? (
                    <form
                      className="space-y-2"
                      onSubmit={(event) => {
                        event.preventDefault()
                        void action(async () => {
                          await commentApi.update(comment.id, editBody.trim())
                          setEditing(null)
                        })
                      }}
                    >
                      <textarea
                        aria-label="Sửa bình luận"
                        required
                        maxLength={2000}
                        disabled={busy}
                        className={fieldClass}
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                      />
                      <button
                        disabled={busy || !editBody.trim()}
                        className={primaryClass}
                      >
                        Lưu bình luận
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
                    <p className="whitespace-pre-wrap break-words text-sm">
                      {comment.body ??
                        (comment.status === 'Hidden'
                          ? 'Bình luận đã được ẩn.'
                          : 'Bình luận đã được gỡ.')}
                    </p>
                  )}
                  {comment.status === 'Visible' && (
                    <div className="flex flex-wrap items-center gap-4">
                      <CommentLike comment={comment} signedIn={!!user} />
                      {user && !comment.parentId && (
                        <button
                          className="fe1-link text-xs text-emerald-800"
                          onClick={() => setReply(comment)}
                        >
                          Trả lời
                        </button>
                      )}
                      {user?.id === comment.authorId && (
                        <>
                          <button
                            className="fe1-link text-xs text-emerald-800"
                            onClick={() => {
                              setEditing(comment.id)
                              setEditBody(comment.body || '')
                            }}
                          >
                            Sửa
                          </button>
                          <button
                            disabled={busy}
                            className="fe1-link text-xs text-rose-700"
                            onClick={() => {
                              if (window.confirm('Gỡ bình luận này?'))
                                void action(() => commentApi.remove(comment.id))
                            }}
                          >
                            Gỡ
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
            {!comments.loading && comments.data?.totalCount === 0 && (
              <p className="text-sm text-slate-500">Chưa có bình luận.</p>
            )}
            <Pager
              page={page}
              total={comments.data?.totalCount || 0}
              onChange={setPage}
            />
          </section>
          {!!article.data.relatedArticles.length && (
            <section className="space-y-3">
              <h2 className="font-bold text-xl text-[#184d28]">
                Bài viết liên quan
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {article.data.relatedArticles.map((item) => (
                  <button
                    key={item.id}
                    className="fe1-control rounded-xl border bg-white p-5 text-left font-bold"
                    onClick={() => onSelectRelatedArticle?.(item.id)}
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
export default ArticleDetail
