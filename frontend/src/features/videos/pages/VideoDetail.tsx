import { useEffect, useState } from 'react'
import { ArrowLeft, Play, Share2, ThumbsUp } from 'lucide-react'
import { Button, EmptyState, Textarea } from '../../../shared/components'
import AlertError from '../../../shared/components/AlertError'
import { apiClient, getStoredToken } from '../../../shared/api/apiClient'
import { getPublicVideo, listVideos, recordVideoView, type VideoDetails } from '../api/backendVideos'

interface Props {
  videoId?: string
  onNavigate?: (path: string) => void
  isLoggedIn?: boolean
}

interface Comment {
  id: string
  parentId: string | null
  authorId: string
  body: string | null
  createdAt: string
  likeCount: number
}

interface Reaction {
  count: number
  reactedByMe: boolean
}

export default function VideoDetail({ videoId, onNavigate }: Props) {
  const [video, setVideo] = useState<VideoDetails | null>(null)
  const [related, setRelated] = useState<VideoDetails[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [reaction, setReaction] = useState<Reaction>({ count: 0, reactedByMe: false })
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(Boolean(videoId))
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [viewRecorded, setViewRecorded] = useState(false)

  useEffect(() => {
    if (!videoId) return
    let active = true
    const commentsUrl = `/api/comments?targetType=Video&targetId=${encodeURIComponent(videoId)}&page=1&pageSize=100`
    void Promise.all([getPublicVideo(videoId), listVideos()]).then(([detail, all]) => {
      if (!active) return
      setVideo(detail)
      setRelated(all.filter((item) => item.id !== detail.id).slice(0, 4))
      void Promise.allSettled([
        apiClient.get<{ items: Comment[] }>(commentsUrl, { requiresAuth: false }),
        apiClient.get<Reaction>(`/api/videos/${encodeURIComponent(videoId)}/like`),
      ]).then(([commentResult, likeResult]) => {
        if (!active) return
        if (commentResult.status === 'fulfilled') setComments(commentResult.value.items)
        if (likeResult.status === 'fulfilled') setReaction(likeResult.value)
        if (commentResult.status === 'rejected' || likeResult.status === 'rejected') {
          setActionError('Bình luận hoặc lượt thích đang tạm thời không tải được.')
        }
      })
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : 'Không thể tải video.')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [videoId])

  const refreshComments = async () => {
    const page = await apiClient.get<{ items: Comment[] }>(
      `/api/comments?targetType=Video&targetId=${encodeURIComponent(videoId ?? '')}&page=1&pageSize=100`,
      { requiresAuth: false },
    )
    setComments(page.items)
  }

  const sendComment = async () => {
    if (!videoId || !draft.trim()) return
    if (!getStoredToken()) { onNavigate?.(`/login?returnUrl=${encodeURIComponent(`/videos/${videoId}`)}`); return }
    setSending(true)
    setActionError(null)
    try {
      await apiClient.post('/api/comments', { targetType: 'Video', targetId: videoId, body: draft.trim() })
      setDraft('')
      await refreshComments()
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : 'Không thể gửi bình luận.')
    } finally { setSending(false) }
  }

  const toggleLike = async () => {
    if (!videoId) return
    if (!getStoredToken()) { onNavigate?.(`/login?returnUrl=${encodeURIComponent(`/videos/${videoId}`)}`); return }
    setActionError(null)
    try {
      const next = reaction.reactedByMe
        ? await apiClient.delete<Reaction>(`/api/videos/${videoId}/like`)
        : await apiClient.put<Reaction>(`/api/videos/${videoId}/like`)
      setReaction(next)
    } catch (reason) { setActionError(reason instanceof Error ? reason.message : 'Không thể cập nhật lượt thích.') }
  }

  if (loading) return <div className="mx-auto max-w-[1200px] px-4 py-16 text-center text-slate-500">Đang tải video...</div>
  if (error) return <div className="mx-auto max-w-[1200px] px-4 py-12"><AlertError title="Không thể tải video" message={error} /></div>
  if (!video) return <div className="mx-auto max-w-[1200px] px-4 py-12"><EmptyState title="Không tìm thấy video" description="Video chưa được công khai hoặc đã bị gỡ." actionLabel="Về kho video" onAction={() => onNavigate?.('/videos')} /></div>

  return <div className="min-h-screen bg-[#F8FAF8] text-slate-900">
    <main className="mx-auto max-w-[1240px] px-4 py-7 sm:px-6">
      <button type="button" onClick={() => onNavigate?.('/videos')} className="mb-5 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-700"><ArrowLeft size={16} /> Quay lại kho video</button>
      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article>
          <div className="aspect-video overflow-hidden rounded-2xl bg-black shadow-md">
            {video.mediaUrl ? <video key={video.id} src={video.mediaUrl} poster={video.thumbnailUrl ?? undefined} controls preload="metadata" className="h-full w-full"
              onPlay={() => { if (!viewRecorded) { setViewRecorded(true); void recordVideoView(video.id).catch(() => undefined) } }} />
              : <div className="flex h-full items-center justify-center text-white">Tệp video chưa có sẵn.</div>}
          </div>
          <h1 className="mt-6 text-2xl font-bold sm:text-3xl">{video.title}</h1>
          <p className="mt-2 text-sm text-slate-500">{video.viewCount.toLocaleString()} lượt xem · {new Date(video.createdAtUtc).toLocaleDateString('vi-VN')}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" leftIcon={<ThumbsUp size={15} fill={reaction.reactedByMe ? 'currentColor' : 'none'} />} onClick={() => void toggleLike()}>
              {reaction.count} Thích
            </Button>
            <Button variant="outline" size="sm" leftIcon={<Share2 size={15} />} onClick={() => void navigator.clipboard.writeText(window.location.href).catch(() => setActionError('Không thể sao chép liên kết.'))}>Chia sẻ</Button>
          </div>
          {actionError && <div className="mt-4"><AlertError title="Thao tác không thành công" message={actionError} /></div>}
          <p className="mt-6 whitespace-pre-line rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-7 text-slate-700">{video.description || 'Chưa có mô tả.'}</p>

          <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="text-lg font-bold">Bình luận ({comments.length})</h2>
            <div className="mt-4">
              <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Chia sẻ cảm nghĩ về video..." rows={3} fullWidth />
              <div className="mt-3 flex justify-end"><Button variant="primary" disabled={!draft.trim() || sending} isLoading={sending} onClick={() => void sendComment()}>Gửi bình luận</Button></div>
            </div>
            <div className="mt-6 space-y-4">
              {comments.length === 0 && <p className="text-sm text-slate-500">Chưa có bình luận.</p>}
              {comments.map((comment) => <div key={comment.id} className={`border-t border-slate-100 pt-4 ${comment.parentId ? 'ml-6' : ''}`}>
                <p className="text-xs text-slate-500">Thành viên · {new Date(comment.createdAt).toLocaleDateString('vi-VN')}</p>
                <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{comment.body ?? 'Bình luận đã được ẩn hoặc gỡ.'}</p>
              </div>)}
            </div>
          </section>
        </article>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 lg:self-start">
          <h2 className="mb-4 font-bold">Video bạn có thể thích</h2>
          {related.length === 0 && <p className="text-sm text-slate-500">Chưa có video khác.</p>}
          <div className="space-y-4">{related.map((item) => <button key={item.id} type="button" onClick={() => onNavigate?.(`/videos/${item.id}`)} className="block w-full text-left">
            <div className="relative aspect-video overflow-hidden rounded-lg bg-slate-100">
              {item.thumbnailUrl ? <img src={item.thumbnailUrl} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-slate-400"><Play size={22} /></div>}
            </div>
            <p className="mt-2 line-clamp-2 text-sm font-semibold hover:text-emerald-700">{item.title}</p>
            <p className="mt-1 text-xs text-slate-500">{item.viewCount.toLocaleString()} lượt xem</p>
          </button>)}</div>
        </aside>
      </div>
    </main>
  </div>
}
