import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, Bookmark, Calendar, Edit3, Heart, Leaf, MessageSquare, Plus, ThumbsUp, User } from 'lucide-react'
import { useAuth } from '../../auth'
import { apiClient, getStoredToken } from '../../../shared/api/apiClient'
import { Feedback, Pager } from '../../admin/components/ApiWorkspace'
import { useApiData } from '../../admin/hooks/useApiData'
import { Badge, Button, PageHeading } from '../../../shared/components'
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
import { BACKEND_DIETARY_TYPE_LABELS } from '../../../shared/constants'
import { findFavorite, toggleFavorite } from '../../favorites/api/favoritesApi'

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
        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-900 disabled:text-slate-400 transition"
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
        <Heart size={13} className={reaction.data?.reactedByMe ? 'fill-emerald-700 text-emerald-700' : ''} />
        <span>{reaction.data?.reactedByMe ? 'Đã thích' : 'Thích'}</span>
        <span className="font-bold">({reaction.data?.count ?? comment.likeCount})</span>
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
  const currentUserId = user?.id
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
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!currentUserId || !getStoredToken()) return
    let active = true

    void findFavorite('Article', articleId)
      .then((favorite) => {
        if (active) setSaved(Boolean(favorite))
      })
      .catch(() => {
        if (active) setSaved(false)
      })

    return () => {
      active = false
    }
  }, [articleId, currentUserId])

  const toggleSavedArticle = async () => {
    if (!user || !getStoredToken()) {
      window.location.hash = `/auth/login?returnUrl=${encodeURIComponent(`/articles/${articleId}`)}`
      return
    }

    setSaving(true)
    setError(null)
    try {
      const nextSaved = await toggleFavorite('Article', articleId, !saved)
      setSaved(nextSaved)
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setSaving(false)
    }
  }

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
    <div className="ui-page-container py-8 space-y-6">
      {/* Header đồng bộ: Bài viết về lối sống chay */}
      <PageHeading
        title="Bài viết về lối sống chay"
        description="Khám phá kiến thức, cẩm nang dinh dưỡng thực vật khoa học và câu chuyện truyền cảm hứng từ cộng đồng."
        breadcrumbs={[
          { label: 'Trang chủ', onClick: () => { window.location.hash = '#/' } },
          { label: 'Bài viết', onClick: onBackToList },
          { label: 'Chi tiết bài viết' },
        ]}
        eyebrow={
          <Badge icon={<Leaf size={14} className="text-[#2E7D32]" />}>
            Kiến thức &amp; cộng đồng
          </Badge>
        }
      />

      <Feedback error={article.error} />
      {article.error && (
        <button className={secondaryClass} onClick={article.reload}>
          Thử tải lại
        </button>
      )}

      {article.loading && (
        <div className="rounded-[24px] border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Đang tải nội dung bài viết...
        </div>
      )}

      {article.data && (
        <>
          {/* Main Article Container */}
          <article className="rounded-[24px] border border-slate-200 bg-white overflow-hidden shadow-xs">
            {article.data.coverImageUrl ? (
              <div className="relative aspect-[21/9] max-h-[400px] w-full overflow-hidden bg-slate-100">
                <img
                  alt={article.data.title}
                  src={article.data.coverImageUrl}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="h-28 bg-gradient-to-r from-emerald-100 via-teal-50 to-emerald-50 flex items-center px-8 text-emerald-700">
                <Leaf size={32} />
              </div>
            )}

            <div className="p-6 sm:p-10 space-y-6">
              {/* Category & dietary tags */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-bold">
                  {article.data.category}
                </span>
                {article.data.dietaryTypes?.map((type) => (
                  <span
                    key={type}
                    className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 text-xs font-semibold"
                  >
                    {BACKEND_DIETARY_TYPE_LABELS[type]}
                  </span>
                ))}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {article.data.title}
              </h1>

              {/* Author & Meta Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-slate-100 text-xs sm:text-sm text-slate-500">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-sm">
                    <User size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">
                      {article.data.authorName || (article.data.authorId === user?.id ? user?.fullName : null) || 'Người đăng'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs font-medium">
                  <span className="flex items-center gap-1.5"><Calendar size={14} /> Xuất bản: {formatDate(article.data.publishedAt)}</span>
                </div>
              </div>

              {/* Article Content */}
              <div className="prose prose-emerald max-w-none text-slate-800 leading-relaxed pt-2">
                <RichContentRenderer content={article.data.content} />
              </div>

              {/* Actions Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-6">
                <div className="flex items-center gap-2">
                  <button
                    disabled={!user || busy || !helpful.data}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
                      helpful.data?.reactedByMe
                        ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    } disabled:opacity-50`}
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
                    <ThumbsUp size={16} className={helpful.data?.reactedByMe ? 'fill-current' : ''} />
                    <span>{helpful.data?.reactedByMe ? 'Đã thích hữu ích' : 'Hữu ích'}</span>
                    <span className="px-2 py-0.5 rounded-full bg-black/10 text-xs font-bold">
                      {helpful.data?.count ?? 0}
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={saving}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50 ${
                      saved
                        ? 'bg-amber-500 text-white shadow-xs hover:bg-amber-600'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                    onClick={() => void toggleSavedArticle()}
                  >
                    <Bookmark size={16} className={saved ? 'fill-current' : ''} />
                    <span>{saved ? 'Đã lưu' : 'Lưu bài viết'}</span>
                  </button>

                  {user?.id === article.data.authorId && (
                    <button
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold transition"
                      onClick={() => onEditArticle?.(articleId)}
                    >
                      <Edit3 size={15} />
                      Mở bản nháp của tôi
                    </button>
                  )}
                </div>

                {onCreateArticle && (
                  <Button
                    leftIcon={<Plus size={16} />}
                    variant="primary"
                    onClick={onCreateArticle}
                  >
                    Chia sẻ bài viết mới
                  </Button>
                )}
              </div>
              <Feedback error={error || helpful.error} />
            </div>
          </article>

          {/* Comments Section */}
          <section className="rounded-[24px] border border-slate-200 bg-white p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex items-center gap-2 text-slate-900">
              <MessageSquare size={20} className="text-emerald-700" />
              <h2 className="text-xl font-bold">Bình luận cộng đồng</h2>
              {comments.data?.totalCount != null && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {comments.data.totalCount}
                </span>
              )}
            </div>

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
                  <div className="p-3 bg-emerald-50 rounded-xl flex items-center justify-between text-xs text-emerald-800">
                    <span>Đang trả lời bình luận của <strong>{reply.authorName || 'Người dùng'}</strong></span>
                    <button
                      className="font-bold underline text-emerald-900 hover:text-emerald-950"
                      type="button"
                      onClick={() => setReply(null)}
                    >
                      Hủy trả lời
                    </button>
                  </div>
                )}
                <textarea
                  aria-label="Nội dung bình luận"
                  required
                  maxLength={2000}
                  rows={3}
                  disabled={busy}
                  className="w-full rounded-xl border border-slate-300 p-3.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 transition"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Chia sẻ suy nghĩ, thắc mắc hoặc góc nhìn của bạn về bài viết này..."
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={busy || !body.trim()}
                  >
                    Gửi bình luận
                  </Button>
                </div>
              </form>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-sm text-slate-600">
                Vui lòng đăng nhập để gửi bình luận và tương tác cùng cộng đồng.
              </div>
            )}

            {comments.loading ? (
              <p className="text-sm text-slate-500 text-center py-4">Đang tải bình luận...</p>
            ) : (
              <div className="space-y-3 pt-2">
                {comments.data?.items.map((comment) => (
                  <div
                    key={comment.id}
                    className={`rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-2.5 ${
                      comment.parentId ? 'sm:ml-8 bg-slate-50/70 border-slate-200' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          {(comment.authorName || 'ND').trim().slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-700">{comment.authorName || 'Người dùng'}</span>
                      </div>
                      <span>{formatDate(comment.createdAt)}</span>
                    </div>

                    {comment.parentId && (
                      <p className="text-xs text-emerald-700 font-medium">
                        Phản hồi bình luận #{comment.parentId.slice(0, 8)}
                      </p>
                    )}

                    {editing === comment.id ? (
                      <form
                        className="space-y-2 pt-1"
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
                        <div className="flex gap-2">
                          <button
                            disabled={busy || !editBody.trim()}
                            className={primaryClass}
                          >
                            Lưu bình luận
                          </button>
                          <button
                            type="button"
                            className={secondaryClass}
                            onClick={() => setEditing(null)}
                          >
                            Hủy
                          </button>
                        </div>
                      </form>
                    ) : (
                      <p className="whitespace-pre-wrap break-words text-sm text-slate-800 leading-relaxed">
                        {comment.body ??
                          (comment.status === 'Hidden'
                            ? 'Bình luận đã được ẩn.'
                            : 'Bình luận đã được gỡ.')}
                      </p>
                    )}

                    {comment.status === 'Visible' && (
                      <div className="flex flex-wrap items-center gap-4 pt-1">
                        <CommentLike comment={comment} signedIn={!!user} />
                        {user && !comment.parentId && (
                          <button
                            className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 transition"
                            onClick={() => setReply(comment)}
                          >
                            Trả lời
                          </button>
                        )}
                        {user?.id === comment.authorId && (
                          <>
                            <button
                              className="text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
                              onClick={() => {
                                setEditing(comment.id)
                                setEditBody(comment.body || '')
                              }}
                            >
                              Sửa
                            </button>
                            <button
                              disabled={busy}
                              className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition"
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
                ))}
              </div>
            )}

            {!comments.loading && comments.data?.totalCount === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ cảm nghĩ!</p>
            )}

            {comments.data && comments.data.totalCount > 10 && (
              <div className="pt-2 flex justify-center">
                <Pager
                  page={page}
                  total={comments.data?.totalCount || 0}
                  onChange={setPage}
                />
              </div>
            )}
          </section>

          {/* Related Articles Section */}
          {!!article.data.relatedArticles?.length && (
            <section className="space-y-4 pt-4">
              <h2 className="font-bold text-xl text-slate-900 flex items-center gap-2">
                <BookOpen size={20} className="text-emerald-700" />
                <span>Bài viết liên quan</span>
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {article.data.relatedArticles.map((item) => (
                  <article
                    key={item.id}
                    onClick={() => onSelectRelatedArticle?.(item.id)}
                    className="group flex flex-col rounded-[16px] border border-slate-200 bg-white overflow-hidden shadow-xs hover:shadow-md hover:border-emerald-300 transition duration-200 cursor-pointer text-left"
                  >
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                      {item.coverImageUrl ? (
                        <img
                          src={item.coverImageUrl}
                          alt={item.title}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-emerald-50 text-emerald-700">
                          <Leaf size={32} />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-between p-4 space-y-2">
                      <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-emerald-700 transition">
                        {item.title}
                      </h3>
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>{formatDate(item.publishedAt)}</span>
                        <span className="font-semibold text-emerald-700 group-hover:underline flex items-center gap-1">
                          Đọc tiếp <ArrowRight size={12} />
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Nút quay lại danh sách bài viết ở cuối trang */}
          <div className="mt-12 pt-6 border-t border-slate-200 flex justify-start">
            <Button
              type="button"
              variant="outline"
              size="md"
              leftIcon={<ArrowLeft size={16} />}
              onClick={onBackToList}
              className="!rounded-[12px] !border-slate-300 hover:!border-[#2E7D32] hover:!text-[#2E7D32] font-semibold"
            >
              Quay lại danh sách bài viết
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
export default ArticleDetail
