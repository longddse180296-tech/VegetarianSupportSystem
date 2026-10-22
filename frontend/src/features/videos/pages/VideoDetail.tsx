import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  Bookmark,
  Calendar,
  ChefHat,
  MessageSquare,
  Reply,
  RotateCcw,
  ThumbsUp,
  Video as VideoIcon,
} from 'lucide-react'
import { Badge, Button, EmptyState, PageHeading, SkeletonLoader, Textarea } from '../../../shared/components'
import AlertError from '../../../shared/components/AlertError'
import { apiClient, getStoredToken } from '../../../shared/api/apiClient'
import {
  getPublicVideo,
  recordVideoView,
  type VideoDetails,
} from '../api/backendVideos'
import { getSavedVideo, toggleVideoLike, toggleVideoSave } from '../api/videoApi'
import { useAuth } from '../../auth/hooks/useAuth'

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
  return text.replace(/^\[Chế độ:[^\]]+\]\s*/i, '').replace(/^\[Mẫu\]\s*/i, '').trim()
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

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return 'Gần đây'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return 'Gần đây'
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default function VideoDetail(props: Props) {
  return <VideoDetailContent key={props.videoId ?? ''} {...props} />
}

function VideoDetailContent({ videoId, onNavigate }: Props) {
  const { user } = useAuth()
  const [video, setVideo] = useState<VideoDetails | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [reaction, setReaction] = useState<Reaction>({ count: 0, reactedByMe: false })
  const [saved, setSaved] = useState(false)
  const [hasVideoError, setHasVideoError] = useState(false)
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
        setError(null)
      })
      .catch((reason: unknown) => {
        if (!active) return
        setError(errorMessage(reason, 'Không thể tải nội dung video.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [videoId])

  useEffect(() => {
    if (!videoId) return
    let active = true

    const token = getStoredToken()
    const taskLike = apiClient
      .get<Reaction>(`/api/videos/${encodeURIComponent(videoId)}/reactions/like`, {
        requiresAuth: Boolean(token),
      })
      .then((result) => (active ? setReaction(result) : undefined))
      .catch(() => undefined)

    const taskSave = token
      ? getSavedVideo(videoId)
          .then((item) => (active ? setSaved(Boolean(item)) : undefined))
          .catch(() => undefined)
      : Promise.resolve()

    const taskComments = loadComments(videoId)
      .then((items) => (active ? setComments(items) : undefined))
      .catch(() => undefined)

    void Promise.allSettled([taskLike, taskSave, taskComments]).finally(() => {
      if (active) setInteractionsLoading(false)
    })

    return () => {
      active = false
    }
  }, [videoId])

  const requireLogin = () => {
    if (getStoredToken()) return true
    onNavigate?.(`/auth/login?returnUrl=${encodeURIComponent(`/videos/${videoId ?? ''}`)}`)
    return false
  }

  const rootComments = useMemo(
    () => comments.filter((comment) => !comment.parentId),
    [comments],
  )
  const replies = useMemo(() => {
    const map = new Map<string, Comment[]>()
    for (const comment of comments) {
      if (!comment.parentId) continue
      const list = map.get(comment.parentId) ?? []
      list.push(comment)
      map.set(comment.parentId, list)
    }
    return map
  }, [comments])

  const toggleLike = async () => {
    if (!videoId || !requireLogin()) return
    setLiking(true)
    setActionError(null)
    const prevReaction = reaction
    const nextLiked = !prevReaction.reactedByMe
    setReaction((prev) => ({
      count: prev.reactedByMe ? Math.max(0, prev.count - 1) : prev.count + 1,
      reactedByMe: nextLiked,
    }))
    try {
      const result = await toggleVideoLike(videoId, nextLiked)
      setReaction(result)
    } catch (reason) {
      setReaction(prevReaction)
      setActionError(errorMessage(reason, 'Không thể gửi lượt thích.'))
    } finally {
      setLiking(false)
    }
  }

  const toggleSave = async () => {
    if (!videoId || !requireLogin()) return
    setSaving(true)
    setActionError(null)
    const prevSaved = saved
    const nextSaved = !prevSaved
    setSaved(nextSaved)
    try {
      const updatedSaved = await toggleVideoSave(videoId, nextSaved)
      setSaved(updatedSaved)
      setNotice(updatedSaved ? 'Đã lưu video vào danh sách yêu thích.' : 'Đã bỏ lưu video.')
    } catch (reason) {
      setSaved(prevSaved)
      setActionError(errorMessage(reason, 'Không thể cập nhật danh sách đã lưu.'))
    } finally {
      setSaving(false)
    }
  }

  const sendComment = async () => {
    if (!videoId || !requireLogin()) return
    const content = draft.trim()
    if (!content) return
    setSending(true)
    setActionError(null)
    try {
      const created = await apiClient.post<Comment>('/api/comments', {
        targetType: 'Video',
        targetId: videoId,
        parentId: replyTo,
        body: content,
      })
      setComments((prev) => [...prev, created])
      setDraft('')
      setReplyTo(null)
      setNotice('Đã gửi bình luận.')
    } catch (reason) {
      setActionError(errorMessage(reason, 'Không thể gửi bình luận.'))
    } finally {
      setSending(false)
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
      <div className="ui-page-container py-8">
        <SkeletonLoader count={3} variant="card" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="ui-page-container py-12">
        <AlertError title="Không thể tải video" message={error} />
      </div>
    )
  }

  if (!video) {
    return (
      <div className="ui-page-container py-12">
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
  const authorName = (user?.role === 'Admin' ? user.fullName : null) || 'Quản Trị Viên Hệ Thống'

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
    <div className="ui-page-container py-8 space-y-6">
      {/* Header kho video cộng đồng */}
      <PageHeading
        title="Video nấu ăn chay"
        description="Kho video hướng dẫn nấu ăn chay trực quan, hấp dẫn từ cộng đồng ẩm thực chay."
        breadcrumbs={[
          { label: 'Trang chủ', onClick: () => onNavigate?.('/') },
          { label: 'Video', onClick: () => onNavigate?.('/videos') },
          { label: 'Chi tiết video' },
        ]}
        eyebrow={
          <Badge icon={<VideoIcon size={14} className="text-[#2E7D32]" />}>
            Kho video cộng đồng
          </Badge>
        }
      />

      {notice && (
        <div className="rounded-[16px] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 flex items-center justify-between shadow-2xs">
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold"
          >
            Đóng
          </button>
        </div>
      )}
      {actionError && (
        <AlertError title="Thao tác không thành công" message={actionError} />
      )}

      {/* Main Video Container (đồng bộ hoàn toàn style bài viết) */}
      <article className="rounded-[24px] border border-slate-200 bg-white overflow-hidden shadow-xs">
        {/* Video Player */}
        <div className="relative aspect-video max-h-[540px] w-full overflow-hidden bg-slate-950">
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
                  Tệp video đang được bảo trì hoặc định dạng chưa được trình duyệt hỗ trợ.
                </p>
                <div className="mt-4 flex items-center gap-3">
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

        {/* Nội dung chi tiết */}
        <div className="p-6 sm:p-10 space-y-6">
          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-bold">
              Video Hướng Dẫn
            </span>
            {video.dietType && (
              <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 text-xs font-semibold">
                {video.dietType}
              </span>
            )}
            <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 px-3 py-1 text-xs font-medium">
              ⏱ {getItemDuration(video.id)}
            </span>
          </div>

          {/* Tiêu đề video lớn */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {titleCleaned}
          </h1>

          {/* Author & Meta Bar */}
          <div className="flex flex-col gap-4 border-y border-slate-100 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-sm">
                <ChefHat size={20} />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">{authorName}</p>
              </div>
            </div>
            <div className="text-xs font-medium text-slate-500 sm:text-right">
              <span className="flex items-center gap-1.5">
                <Calendar size={14} /> Xuất bản: {formatDate(video.createdAtUtc)}
              </span>
            </div>
          </div>

          {/* Mô tả video */}
          <div className="prose prose-emerald max-w-none text-slate-800 leading-relaxed pt-2 whitespace-pre-line text-base">
            {cleanPrefix(video.description) ||
              'Người đăng chưa cung cấp thông tin mô tả chi tiết cho video nấu ăn này.'}
          </div>

          {/* Actions Footer */}
          <div className="flex flex-col gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:items-center">
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <button
                type="button"
                disabled={interactionsLoading || liking}
                className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  reaction.reactedByMe
                    ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                } disabled:opacity-50`}
                onClick={() => void toggleLike()}
              >
                <ThumbsUp
                  size={16}
                  className={reaction.reactedByMe ? 'fill-current' : ''}
                />
                <span>{reaction.reactedByMe ? 'Đã thích' : 'Thích'}</span>
                <span className="px-2 py-0.5 rounded-full bg-black/10 text-xs font-bold">
                  {reaction.count}
                </span>
              </button>

              <button
                type="button"
                disabled={interactionsLoading || saving}
                className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  saved
                    ? 'bg-amber-500 text-white shadow-xs hover:bg-amber-600'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                } disabled:opacity-50`}
                onClick={() => void toggleSave()}
              >
                <Bookmark size={16} className={saved ? 'fill-current' : ''} />
                <span>{saved ? 'Đã lưu' : 'Lưu video'}</span>
              </button>
            </div>

          </div>
        </div>
      </article>

      {/* ================= KHỐI BÌNH LUẬN (ĐỒNG BỘ BÀI VIẾT) ================= */}
      <section className="rounded-[24px] border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
            <MessageSquare size={16} />
          </span>
          <h2 className="text-xl font-bold text-slate-900">
            {comments.length === 0 ? 'Bình luận' : `Bình luận (${comments.length})`}
          </h2>
        </div>

        {/* Khung nhập bình luận */}
        <div>
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

          <div className="mt-3 flex justify-end">
            <Button
              variant="primary"
              disabled={!draft.trim() || sending}
              isLoading={sending}
              onClick={() => void sendComment()}
              className="!h-9 !rounded-xl !bg-[#2E7D32] hover:!bg-[#1B5E20] !px-5 text-xs sm:text-sm font-semibold shadow-xs"
            >
              {replyTo ? 'Gửi phản hồi' : 'Gửi bình luận'}
            </Button>
          </div>
        </div>

        {/* Danh sách bình luận */}
        <div className="space-y-4 pt-2">
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

      {/* Nút quay lại danh sách video ở cuối trang */}
      <div className="mt-12 pt-6 border-t border-slate-200 flex justify-start">
        <Button
          type="button"
          variant="outline"
          size="md"
          leftIcon={<ArrowLeft size={16} />}
          onClick={() => onNavigate?.('/videos')}
          className="!rounded-[12px] !border-slate-300 hover:!border-[#2E7D32] hover:!text-[#2E7D32] font-semibold"
        >
          Quay lại danh sách video
        </Button>
      </div>
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
