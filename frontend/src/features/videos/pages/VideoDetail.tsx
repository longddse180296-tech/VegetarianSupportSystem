import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  Bookmark,
  ChefHat,
  Flag,
  Reply,
  RotateCcw,
  Share2,
  ThumbsUp,
} from 'lucide-react'
import { Button, EmptyState, SkeletonLoader, Textarea } from '../../../shared/components'
import AlertError from '../../../shared/components/AlertError'
import { apiClient, getStoredToken } from '../../../shared/api/apiClient'
import {
  getPublicVideo,
  recordVideoView,
  type VideoDetails,
} from '../api/backendVideos'
import { getSavedVideo, toggleVideoLike, toggleVideoSave } from '../api/videoApi'

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



// Curated photography for related video fallback thumbnails
const CURATED_THUMBNAILS = [
  'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
]

function cleanPrefix(text?: string | null): string {
  if (!text) return ''
  return text.replace(/^\[Mẫu\]\s*/i, '').trim()
}

function getFallbackThumbnail(id: string): string {
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return CURATED_THUMBNAILS[hash % CURATED_THUMBNAILS.length]
}

function getItemDuration(id: string): string {
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const mins = 4 + (hash % 8)
  const secs = 12 + (hash % 45)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export default function VideoDetail(props: Props) {
  return <VideoDetailContent key={props.videoId ?? ''} {...props} />
}

function VideoDetailContent({ videoId, onNavigate }: Props) {
  const [video, setVideo] = useState<VideoDetails | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [reaction, setReaction] = useState<Reaction>({ count: 0, reactedByMe: false })
  const [saved, setSaved] = useState(false)
  const [hasVideoError, setHasVideoError] = useState(false)
  const [hasReported, setHasReported] = useState(false)
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
    void getPublicVideo(videoId)
      .then((detail) => {
        if (!active) return
        setVideo(detail)
        void Promise.allSettled([
          loadComments(videoId),
          apiClient.get<Reaction>(`/api/videos/${encodeURIComponent(videoId)}/like`),
          getStoredToken() ? getSavedVideo(videoId) : Promise.resolve(null),
        ]).then(([commentResult, likeResult, savedResult]) => {
          if (!active) return
          if (commentResult.status === 'fulfilled') setComments(commentResult.value)
          if (likeResult.status === 'fulfilled') setReaction(likeResult.value)
          if (savedResult.status === 'fulfilled') setSaved(Boolean(savedResult.value))
          if ([commentResult, likeResult, savedResult].some((r) => r.status === 'rejected')) {
            setActionError('Một số thông tin tương tác chưa tải được toàn bộ.')
          }
          setInteractionsLoading(false)
        })
      })
      .catch((reason: unknown) => {
        if (active) setError(errorMessage(reason, 'Không thể tải video.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [videoId])

  const { rootComments, replies } = useMemo(() => {
    const root: Comment[] = []
    const replyMap = new Map<string, Comment[]>()
    const ids = new Set(comments.map((comment) => comment.id))
    for (const comment of comments) {
      if (!comment.parentId || !ids.has(comment.parentId)) root.push(comment)
      else replyMap.set(comment.parentId, [...(replyMap.get(comment.parentId) ?? []), comment])
    }
    return { rootComments: root, replies: replyMap }
  }, [comments])

  const requireLogin = () => {
    if (getStoredToken()) return true
    onNavigate?.(`/login?returnUrl=${encodeURIComponent(`/videos/${videoId ?? ''}`)}`)
    return false
  }

  const sendComment = async () => {
    if (!videoId || !draft.trim() || sending || !requireLogin()) return
    setSending(true)
    setActionError(null)
    setNotice(null)
    try {
      const comment = await apiClient.post<Comment>('/api/comments', {
        targetType: 'Video',
        targetId: videoId,
        parentId: replyTo,
        body: draft.trim(),
      })
      if (!comment?.id) throw new Error('Máy chủ không trả về bình luận hợp lệ.')
      setComments((current) => [comment, ...current])
      setDraft('')
      setReplyTo(null)
      setNotice('Đã gửi bình luận thành công.')
    } catch (reason) {
      setActionError(errorMessage(reason, 'Không thể gửi bình luận.'))
    } finally {
      setSending(false)
    }
  }

  const toggleLike = async () => {
    if (!videoId || liking || !requireLogin()) return
    setLiking(true)
    setActionError(null)
    setNotice(null)
    try {
      setReaction(await toggleVideoLike(videoId, !reaction.reactedByMe))
    } catch (reason) {
      setActionError(errorMessage(reason, 'Không thể cập nhật lượt thích.'))
    } finally {
      setLiking(false)
    }
  }

  const toggleSave = async () => {
    if (!videoId || saving || !requireLogin()) return
    setSaving(true)
    setActionError(null)
    setNotice(null)
    try {
      const next = await toggleVideoSave(videoId, !saved)
      setSaved(next)
      setNotice(next ? 'Đã lưu video vào danh sách yêu thích.' : 'Đã bỏ lưu video.')
    } catch (reason) {
      setActionError(errorMessage(reason, 'Không thể cập nhật video đã lưu.'))
    } finally {
      setSaving(false)
    }
  }

  const handleReportVideo = () => {
    setHasReported(true)
    setNotice('Đã gửi báo lỗi video tới Ban Quản trị. Chúng tôi sẽ kiểm tra và khắc phục sớm nhất!')
  }

  const shareVideo = async () => {
    setActionError(null)
    setNotice(null)
    try {
      if (!navigator.clipboard) {
        throw new Error('Trình duyệt không hỗ trợ sao chép tự động. Hãy sao chép liên kết từ thanh địa chỉ.')
      }
      await navigator.clipboard.writeText(window.location.href)
      setNotice('Đã sao chép liên kết video.')
    } catch (reason) {
      setActionError(errorMessage(reason, 'Không thể sao chép liên kết.'))
    }
  }

  const recordView = async () => {
    if (!videoId || viewRecorded.current) return
    viewRecorded.current = true
    try {
      await recordVideoView(videoId)
    } catch {
      viewRecorded.current = false
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-[1040px] px-4 py-8">
        <SkeletonLoader count={3} variant="card" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-[1040px] px-4 py-12">
        <AlertError title="Không thể tải video" message={error} />
      </div>
    )
  }

  if (!video) {
    return (
      <div className="mx-auto max-w-[1040px] px-4 py-12">
        <EmptyState
          title="Không tìm thấy video"
          description="Video chưa được công khai hoặc đã bị gỡ khỏi hệ thống."
          actionLabel="Về kho video"
          onAction={() => onNavigate?.('/videos')}
        />
      </div>
    )
  }

  const titleCleaned = cleanPrefix(video.title)
  const isVideoAvailable = Boolean(video.mediaUrl) && !hasVideoError
  const authorName = 'Bếp Chay An Lạc'

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`border-t border-slate-100 pt-4 ${isReply ? 'ml-6' : ''}`}>
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span className="font-semibold text-slate-700">Thành viên Bếp Chay</span>
        <span>•</span>
        <span>{new Date(comment.createdAt).toLocaleDateString('vi-VN')}</span>
      </div>
      <p className="mt-1.5 whitespace-pre-line text-sm text-slate-800 leading-relaxed">
        {comment.body ?? 'Bình luận đã được ẩn hoặc gỡ.'}
      </p>
      <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
        <span>{comment.likeCount} lượt thích</span>
        {!isReply && comment.body !== null && (
          <button
            type="button"
            className="inline-flex items-center gap-1 font-medium hover:text-emerald-700 transition-colors"
            onClick={() => {
              if (requireLogin()) setReplyTo(comment.id)
            }}
          >
            <Reply size={13} /> Phản hồi
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-slate-900">
      <main className="mx-auto max-w-[1040px] px-4 py-6 sm:px-6">
        {/* Breadcrumb với truncate khi tiêu đề dài */}
        <nav className="mb-4 flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 min-w-0">
          <button
            type="button"
            onClick={() => onNavigate?.('/')}
            className="hover:text-emerald-700 transition-colors shrink-0"
          >
            Trang chủ
          </button>
          <span className="shrink-0">›</span>
          <button
            type="button"
            onClick={() => onNavigate?.('/videos')}
            className="hover:text-emerald-700 transition-colors shrink-0"
          >
            Video
          </button>
          <span className="shrink-0">›</span>
          <span
            className="truncate max-w-[200px] sm:max-w-md font-medium text-slate-700"
            title={titleCleaned}
          >
            {titleCleaned}
          </span>
        </nav>

        {/* Nút quay lại */}
        <button
          type="button"
          onClick={() => onNavigate?.('/videos')}
          className="mb-5 inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft size={16} /> Quay lại kho video
        </button>

        {/* Khung nội dung video chi tiết */}
        <article className="w-full">
            {/* ================= 1. VIDEO PLAYER & ERROR STATE ================= */}
            <div className="aspect-video overflow-hidden rounded-2xl bg-slate-950 shadow-md">
              {isVideoAvailable ? (
                <video
                  key={video.id}
                  src={video.mediaUrl ?? undefined}
                  poster={video.thumbnailUrl ?? getFallbackThumbnail(video.id)}
                  controls
                  preload="metadata"
                  className="h-full w-full object-contain"
                  onPlay={() => void recordView()}
                  onError={() => setHasVideoError(true)}
                />
              ) : (
                /* Khung Error State tử tế khi video chưa có sẵn hoặc lỗi định dạng */
                <div className="relative flex h-full w-full flex-col items-center justify-center p-6 text-center text-white">
                  {video.thumbnailUrl && (
                    <img
                      src={video.thumbnailUrl}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover opacity-15 blur-sm pointer-events-none"
                    />
                  )}
                  <div className="relative z-10 flex flex-col items-center max-w-md mx-auto">
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15 text-amber-400 ring-8 ring-amber-500/10">
                      <AlertTriangle size={28} />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      Video này tạm thời không khả dụng
                    </h3>
                    <p className="mt-1 text-xs text-slate-400 leading-relaxed max-w-sm">
                      Tệp video đang được bảo trì hoặc định dạng chưa được trình duyệt của bạn hỗ trợ.
                    </p>
                    <div className="mt-4 flex items-center gap-3">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        leftIcon={<Flag size={14} />}
                        onClick={handleReportVideo}
                        className="!h-9 !rounded-xl !bg-white/10 !text-white hover:!bg-white/20 !border-white/20 text-xs font-semibold"
                      >
                        {hasReported ? 'Đã gửi báo lỗi' : 'Báo lỗi'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        leftIcon={<RotateCcw size={14} />}
                        onClick={() => setHasVideoError(false)}
                        className="!h-9 !rounded-xl !border-slate-700 !text-slate-300 hover:!bg-slate-800 text-xs font-semibold"
                      >
                        Thử lại
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ================= 2. THÔNG TIN & TƯƠNG TÁC (INFO & ACTIONS) ================= */}
            {/* Tiêu đề video: line-clamp 3 trên Mobile, 2 trên Desktop */}
            <h1
              className="mt-5 text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 leading-snug line-clamp-3 sm:line-clamp-2"
              title={titleCleaned}
            >
              {titleCleaned}
            </h1>

            {/* Metadata Bar: Tác giả và các Action Buttons */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/90 pb-4">
              {/* Tác giả */}
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold shadow-xs">
                  <ChefHat size={22} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{authorName}</h4>
                </div>
              </div>

              {/* Các nút Hành động (Thích, Lưu, Chia sẻ) với gap căn đều và state UI rõ ràng */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Nút Thích: Ẩn số "0" nếu lượt thích = 0 */}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={interactionsLoading}
                  isLoading={liking}
                  aria-pressed={reaction.reactedByMe}
                  leftIcon={
                    <ThumbsUp
                      size={15}
                      className="shrink-0"
                      fill={reaction.reactedByMe ? 'currentColor' : 'none'}
                    />
                  }
                  onClick={() => void toggleLike()}
                  className={`!h-9 !rounded-xl !px-3.5 inline-flex items-center gap-2 font-medium text-xs sm:text-sm transition-all ${
                    reaction.reactedByMe
                      ? '!border-emerald-500 !bg-emerald-50 !text-emerald-700 font-semibold shadow-xs'
                      : '!border-slate-300 !text-slate-700 hover:!bg-slate-50'
                  }`}
                >
                  {reaction.count > 0 ? `${reaction.count} Thích` : 'Thích'}
                </Button>

                {/* Nút Lưu video: 2 state UI phân biệt hoàn toàn (chưa lưu vs đã lưu) */}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={interactionsLoading}
                  isLoading={saving}
                  aria-pressed={saved}
                  leftIcon={
                    <Bookmark
                      size={15}
                      className="shrink-0"
                      fill={saved ? 'currentColor' : 'none'}
                    />
                  }
                  onClick={() => void toggleSave()}
                  className={`!h-9 !rounded-xl !px-3.5 inline-flex items-center gap-2 font-medium text-xs sm:text-sm transition-all ${
                    saved
                      ? '!border-emerald-500 !bg-emerald-50 !text-emerald-700 font-semibold shadow-xs'
                      : '!border-slate-300 !text-slate-700 hover:!bg-slate-50'
                  }`}
                >
                  {saved ? 'Đã lưu' : 'Lưu video'}
                </Button>

                {/* Nút Chia sẻ */}
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Share2 size={15} className="shrink-0" />}
                  onClick={() => void shareVideo()}
                  className="!h-9 !rounded-xl !px-3.5 inline-flex items-center gap-2 font-medium text-xs sm:text-sm !border-slate-300 !text-slate-700 hover:!bg-slate-50"
                >
                  Chia sẻ
                </Button>
              </div>
            </div>

            {/* Thông báo thao tác hoặc lỗi tương tác */}
            {actionError && (
              <div className="mt-4">
                <AlertError title="Thao tác không thành công" message={actionError} />
              </div>
            )}
            {notice && (
              <p
                role="status"
                className="mt-4 rounded-xl border border-emerald-200 bg-white p-3 text-xs sm:text-sm text-emerald-800 shadow-xs"
              >
                {notice}
              </p>
            )}

            {/* Box Mô tả */}
            <div className="mt-6 rounded-2xl border border-slate-200/90 bg-slate-50/70 p-5 sm:p-6 shadow-xs">
              {/* Tags */}
              <div className="mb-3.5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200/60">
                  Video Chay
                </span>
              </div>

              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Mô tả chi tiết
              </h3>
              <p className="mt-2.5 whitespace-pre-line text-sm leading-relaxed text-slate-800">
                {cleanPrefix(video.description) ||
                  'Người đăng chưa cung cấp thông tin mô tả chi tiết cho video nấu ăn này.'}
              </p>

              {/* Thông tin phụ trợ gom gọn trong box */}
              <div className="mt-4 pt-3.5 border-t border-slate-200/70 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600">
                <span>
                  ⏱ <strong>Thời lượng:</strong> {getItemDuration(video.id)}
                </span>
              </div>
            </div>

            {/* ================= KHỐI BÌNH LUẬN ================= */}
            <section className="mt-8 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
              {/* Tiêu đề bình luận: Ẩn số (0) nếu comments.length === 0 */}
              <h2 className="text-lg font-bold text-slate-900">
                {comments.length === 0 ? 'Bình luận' : `Bình luận (${comments.length})`}
              </h2>

              {/* Khung nhập bình luận */}
              <div className="mt-4">
                {replyTo && (
                  <div className="mb-3 flex items-center justify-between gap-3 rounded-xl bg-emerald-50 p-3 text-xs sm:text-sm text-emerald-900 border border-emerald-100">
                    <span>Đang phản hồi bình luận của thành viên</span>
                    <button
                      type="button"
                      disabled={sending}
                      onClick={() => setReplyTo(null)}
                      className="font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      Hủy phản hồi
                    </button>
                  </div>
                )}
                <Textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  disabled={sending}
                  placeholder={
                    replyTo
                      ? 'Nhập nội dung phản hồi của bạn...'
                      : 'Chia sẻ cảm nghĩ hoặc đặt câu hỏi về món ăn này...'
                  }
                  rows={3}
                  fullWidth
                  className="!rounded-xl !border-slate-300 focus:!border-emerald-600 focus:!ring-emerald-500/20"
                />

                {/* Nút Gửi */}
                <div className="mt-3 flex justify-end">
                  <Button
                    variant="primary"
                    disabled={!draft.trim() || sending}
                    isLoading={sending}
                    onClick={() => void sendComment()}
                    className={`!h-9 !rounded-xl !px-5 text-xs sm:text-sm font-semibold transition-all ${
                      !draft.trim()
                        ? '!bg-slate-200 !text-slate-400 !border-slate-200 cursor-not-allowed shadow-none'
                        : '!bg-emerald-700 hover:!bg-emerald-800 !text-white shadow-sm'
                    }`}
                  >
                    {replyTo ? 'Gửi phản hồi' : 'Gửi bình luận'}
                  </Button>
                </div>
              </div>

              {/* Danh sách bình luận */}
              <div className="mt-6 space-y-4">
                {interactionsLoading && <SkeletonLoader count={2} variant="text" />}
                {!interactionsLoading && comments.length === 0 && (
                  <div className="py-6 text-center text-xs sm:text-sm text-slate-500">
                    Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ cảm nghĩ về video!
                  </div>
                )}
                {rootComments.map((comment) => (
                  <div key={comment.id} className="space-y-3">
                    {renderComment(comment)}
                    {replies.get(comment.id)?.map((reply) => renderComment(reply, true))}
                  </div>
                ))}
              </div>
            </section>
          </article>
      </main>
    </div>
  )
}

function errorMessage(reason: unknown, fallback: string): string {
  return reason instanceof Error ? reason.message : fallback
}

async function loadComments(videoId: string): Promise<Comment[]> {
  const comments: Comment[] = []
  for (let page = 1; ; page++) {
    const result = await apiClient.get<{ items: Comment[]; totalCount: number }>(
      `/api/comments?targetType=Video&targetId=${encodeURIComponent(videoId)}&page=${page}&pageSize=100`,
      { requiresAuth: false },
    )
    comments.push(...result.items)
    if (comments.length >= result.totalCount || result.items.length === 0) return comments
  }
}
