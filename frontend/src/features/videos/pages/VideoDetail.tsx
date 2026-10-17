import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Bookmark, Play, Reply, Share2, ThumbsUp } from 'lucide-react'
import { Button, EmptyState, SkeletonLoader, Textarea } from '../../../shared/components'
import AlertError from '../../../shared/components/AlertError'
import { apiClient, getStoredToken } from '../../../shared/api/apiClient'
import { getPublicVideo, listVideos, recordVideoView, type VideoDetails } from '../api/backendVideos'
import { getSavedVideo, toggleVideoLike, toggleVideoSave } from '../api/videoApi'

interface Props { videoId?: string; onNavigate?: (path: string) => void; isLoggedIn?: boolean }
interface Comment { id: string; parentId: string | null; authorId: string; body: string | null; createdAt: string; likeCount: number }
interface Reaction { count: number; reactedByMe: boolean }

export default function VideoDetail(props: Props) {
  return <VideoDetailContent key={props.videoId ?? ''} {...props} />
}

function VideoDetailContent({ videoId, onNavigate }: Props) {
  const [video, setVideo] = useState<VideoDetails | null>(null)
  const [related, setRelated] = useState<VideoDetails[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [reaction, setReaction] = useState<Reaction>({ count: 0, reactedByMe: false })
  const [saved, setSaved] = useState(false)
  const [interactionsLoading, setInteractionsLoading] = useState(true)
  const [draft, setDraft] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [loading, setLoading] = useState(Boolean(videoId))
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [liking, setLiking] = useState(false)
  const [saving, setSaving] = useState(false)
  const viewRecorded = useRef(false)

  useEffect(() => {
    if (!videoId) return
    let active = true
    void getPublicVideo(videoId).then((detail) => {
      if (!active) return
      setVideo(detail)
      void Promise.allSettled([
        listVideos(), loadComments(videoId),
        apiClient.get<Reaction>(`/api/videos/${encodeURIComponent(videoId)}/like`),
        getStoredToken() ? getSavedVideo(videoId) : Promise.resolve(null),
      ]).then(([relatedResult, commentResult, likeResult, savedResult]) => {
        if (!active) return
        if (relatedResult.status === 'fulfilled') setRelated(relatedResult.value.filter((item) => item.id !== detail.id).slice(0, 4))
        if (commentResult.status === 'fulfilled') setComments(commentResult.value)
        if (likeResult.status === 'fulfilled') setReaction(likeResult.value)
        if (savedResult.status === 'fulfilled') setSaved(Boolean(savedResult.value))
        if ([relatedResult, commentResult, likeResult, savedResult].some((result) => result.status === 'rejected')) {
          setActionError('Một số thông tin liên quan, bình luận hoặc tương tác chưa tải được. Hãy tải lại trang để thử lại.')
        }
        setInteractionsLoading(false)
      })
    }).catch((reason: unknown) => {
      if (active) setError(errorMessage(reason, 'Không thể tải video.'))
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [videoId])

  const { rootComments, replies } = useMemo(() => {
    const rootComments: Comment[] = []
    const replies = new Map<string, Comment[]>()
    const ids = new Set(comments.map((comment) => comment.id))
    for (const comment of comments) {
      if (!comment.parentId || !ids.has(comment.parentId)) rootComments.push(comment)
      else replies.set(comment.parentId, [...(replies.get(comment.parentId) ?? []), comment])
    }
    return { rootComments, replies }
  }, [comments])

  const requireLogin = () => {
    if (getStoredToken()) return true
    onNavigate?.(`/login?returnUrl=${encodeURIComponent(`/videos/${videoId ?? ''}`)}`)
    return false
  }

  const sendComment = async () => {
    if (!videoId || !draft.trim() || sending || !requireLogin()) return
    setSending(true); setActionError(null); setNotice(null)
    try {
      const comment = await apiClient.post<Comment>('/api/comments', {
        targetType: 'Video', targetId: videoId, parentId: replyTo, body: draft.trim(),
      })
      if (!comment?.id) throw new Error('Máy chủ không trả về bình luận đã lưu hợp lệ.')
      setComments((current) => [comment, ...current])
      setDraft(''); setReplyTo(null); setNotice('Đã gửi bình luận.')
    } catch (reason) { setActionError(errorMessage(reason, 'Không thể gửi bình luận.')) }
    finally { setSending(false) }
  }

  const toggleLike = async () => {
    if (!videoId || liking || !requireLogin()) return
    setLiking(true); setActionError(null); setNotice(null)
    try { setReaction(await toggleVideoLike(videoId, !reaction.reactedByMe)) }
    catch (reason) { setActionError(errorMessage(reason, 'Không thể cập nhật lượt thích.')) }
    finally { setLiking(false) }
  }

  const toggleSave = async () => {
    if (!videoId || saving || !requireLogin()) return
    setSaving(true); setActionError(null); setNotice(null)
    try {
      const next = await toggleVideoSave(videoId, !saved)
      setSaved(next); setNotice(next ? 'Đã lưu video vào danh sách yêu thích.' : 'Đã bỏ lưu video.')
    } catch (reason) { setActionError(errorMessage(reason, 'Không thể cập nhật video đã lưu.')) }
    finally { setSaving(false) }
  }

  const shareVideo = async () => {
    setActionError(null); setNotice(null)
    try {
      if (!navigator.clipboard) throw new Error('Trình duyệt không hỗ trợ sao chép. Hãy sao chép liên kết từ thanh địa chỉ.')
      await navigator.clipboard.writeText(window.location.href)
      setNotice('Đã sao chép liên kết video.')
    } catch (reason) { setActionError(errorMessage(reason, 'Không thể sao chép liên kết.')) }
  }

  const recordView = async () => {
    if (!videoId || viewRecorded.current) return
    viewRecorded.current = true
    try { await recordVideoView(videoId) }
    catch { viewRecorded.current = false }
  }

  if (loading) return <div className="ui-page-container py-8"><SkeletonLoader count={3} variant="card" /></div>
  if (error) return <div className="ui-page-container py-12"><AlertError title="Không thể tải video" message={error} /></div>
  if (!video) return <div className="ui-page-container py-12"><EmptyState title="Không tìm thấy video" description="Video chưa được công khai hoặc đã bị gỡ." actionLabel="Về kho video" onAction={() => onNavigate?.('/videos')} /></div>

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`border-t border-slate-100 pt-4 ${isReply ? 'ml-6' : ''}`}>
      <p className="text-xs text-slate-500">Thành viên · {new Date(comment.createdAt).toLocaleDateString('vi-VN')}</p>
      <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{comment.body ?? 'Bình luận đã được ẩn hoặc gỡ.'}</p>
      <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
        <span>{comment.likeCount} lượt thích</span>
        {!isReply && comment.body !== null && <button type="button" className="inline-flex items-center gap-1 hover:text-emerald-700" onClick={() => { if (requireLogin()) setReplyTo(comment.id) }}><Reply size={13} /> Phản hồi</button>}
      </div>
    </div>
  )

  return <div className="min-h-screen bg-[#F8FAF8] text-slate-900">
    <main className="ui-page-container py-7">
      <button type="button" onClick={() => onNavigate?.('/videos')} className="mb-5 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-700"><ArrowLeft size={16} /> Quay lại kho video</button>
      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article className="min-w-0">
          <div className="aspect-video overflow-hidden rounded-2xl bg-black shadow-md">
            {video.mediaUrl ? <video key={video.id} src={video.mediaUrl} poster={video.thumbnailUrl ?? undefined} controls preload="metadata" className="h-full w-full"
              onPlay={() => void recordView()} onError={() => setActionError('Không thể phát tệp video. Hãy thử lại hoặc kiểm tra định dạng được trình duyệt hỗ trợ.')} />
              : <div className="flex h-full items-center justify-center text-white">Tệp video chưa có sẵn.</div>}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold sm:text-3xl">{video.title}</h1>
            <span className="inline-flex items-center rounded-full bg-[#E8F5E9] px-3 py-1 text-xs font-semibold text-[#2E7D32]">
              {video.dietType || 'Chưa có thông tin chế độ ăn'}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-500">{video.viewCount.toLocaleString('vi-VN')} lượt xem · {new Date(video.createdAtUtc).toLocaleDateString('vi-VN')}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" disabled={interactionsLoading} isLoading={liking} aria-pressed={reaction.reactedByMe} leftIcon={<ThumbsUp size={15} fill={reaction.reactedByMe ? 'currentColor' : 'none'} />} onClick={() => void toggleLike()}>{reaction.count} Thích</Button>
            <Button variant="outline" size="sm" disabled={interactionsLoading} isLoading={saving} aria-pressed={saved} leftIcon={<Bookmark size={15} fill={saved ? 'currentColor' : 'none'} />} onClick={() => void toggleSave()}>{saved ? 'Đã lưu' : 'Lưu video'}</Button>
            <Button variant="outline" size="sm" leftIcon={<Share2 size={15} />} onClick={() => void shareVideo()}>Chia sẻ</Button>
          </div>
          {actionError && <div className="mt-4"><AlertError title="Thao tác không thành công" message={actionError} /></div>}
          {notice && <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-white p-3 text-sm text-emerald-800">{notice}</p>}
          <p className="mt-6 whitespace-pre-line rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-7 text-slate-700">{video.description || 'Chưa có mô tả.'}</p>

          <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="text-lg font-bold">Bình luận ({comments.length})</h2>
            <div className="mt-4">
              {replyTo && <div className="mb-3 flex items-center justify-between gap-3 rounded-lg bg-emerald-50 p-3 text-sm"><span>Đang phản hồi bình luận</span><button type="button" disabled={sending} onClick={() => setReplyTo(null)} className="text-emerald-700">Hủy phản hồi</button></div>}
              <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} disabled={sending} placeholder={replyTo ? 'Nhập phản hồi...' : 'Chia sẻ cảm nghĩ về video...'} rows={3} fullWidth />
              <div className="mt-3 flex justify-end"><Button variant="primary" disabled={!draft.trim()} isLoading={sending} onClick={() => void sendComment()}>{replyTo ? 'Gửi phản hồi' : 'Gửi bình luận'}</Button></div>
            </div>
            <div className="mt-6 space-y-4">
              {interactionsLoading && <SkeletonLoader count={2} variant="text" />}
              {!interactionsLoading && comments.length === 0 && <p className="text-sm text-slate-500">Chưa có bình luận.</p>}
              {rootComments.map((comment) => <div key={comment.id} className="space-y-3">{renderComment(comment)}{replies.get(comment.id)?.map((reply) => renderComment(reply, true))}</div>)}
            </div>
          </section>
        </article>

        <aside className="space-y-5 lg:self-start">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 font-bold">Video bạn có thể thích</h2>
            {!interactionsLoading && related.length === 0 && <p className="text-sm text-slate-500">Chưa có video khác.</p>}
            <div className="space-y-4">{related.map((item) => <button key={item.id} type="button" onClick={() => onNavigate?.(`/videos/${item.id}`)} className="block w-full text-left">
              <div className="relative aspect-video overflow-hidden rounded-lg bg-slate-100">
                {item.thumbnailUrl ? <img src={item.thumbnailUrl} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-slate-400"><Play size={22} /></div>}
              </div>
              <p className="mt-2 line-clamp-2 text-sm font-semibold hover:text-emerald-700">{item.title}</p>
              <p className="mt-1 text-xs text-slate-500">{item.viewCount.toLocaleString('vi-VN')} lượt xem</p>
            </button>)}</div>
          </section>
        </aside>
      </div>
    </main>
  </div>
}

function errorMessage(reason: unknown, fallback: string): string {
  return reason instanceof Error ? reason.message : fallback
}

async function loadComments(videoId: string): Promise<Comment[]> {
  const comments: Comment[] = []
  for (let page = 1; ; page++) {
    const result = await apiClient.get<{ items: Comment[]; totalCount: number }>(
      `/api/comments?targetType=Video&targetId=${encodeURIComponent(videoId)}&page=${page}&pageSize=100`, { requiresAuth: false },
    )
    comments.push(...result.items)
    if (comments.length >= result.totalCount || result.items.length === 0) return comments
  }
}
