import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft as ArrowLeftIcon,
  Bookmark as BookmarkIcon,
  ChevronRight,
  Eye as EyeIcon,
  Fullscreen as FullscreenIcon,
  MessageSquare,
  Pause as PauseIcon,
  Play as PlayIcon,
  Reply as ReplyIcon,
  Send as SendIcon,
  Settings as SettingsIcon,
  Share2 as ShareIcon,
  Sparkles as SparklesIcon,
  ThumbsUp as ThumbsUpIcon,
  User as UserIcon,
  Video as VideoIcon,
  Volume2 as VolumeIcon,
} from 'lucide-react'
import {
  Button,
  EmptyState,
  SkeletonLoader,
  Textarea,
} from '../../../shared/components'
import {
  getVideoDetail,
  getVideoDetailComments,
  getRelatedVideos,
  getVideoDetailMeta,
  type CommentItem,
  type RelatedVideo,
} from '../api/videoApi'
import type { VideoItem } from '../types/video.types'
import { formatDuration } from '../types/video.types'

/* ============================= HELPERS ============================= */

const THUMB = (seed: string) =>
  `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${encodeURIComponent(seed)}&image_size=landscape_16_9`

function formatCountCompact(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace('.0', '')}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace('.0', '')}K`
  return String(v)
}

/* ============================= PAGE COMPONENT ============================= */

export interface VideoDetailPageProps {
  videoId?: string
  onNavigate?: (path: string) => void
  isLoggedIn?: boolean
}

export default function VideoDetail({
  videoId = 'dau-hu-sot-nam',
  onNavigate,
  isLoggedIn: _isLoggedIn,
}: VideoDetailPageProps) {
  const [video, setVideo] = useState<VideoItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [commentDraft, setCommentDraft] = useState('')
  const [comments, setComments] = useState<CommentItem[]>([])
  const [relatedVideos, setRelatedVideos] = useState<RelatedVideo[]>([])
  const [meta, setMeta] = useState<{
    title: string
    creator: { initials: string; name: string; verified: boolean; subscribers: number; postedAgo: string }
    pills: { label: string; tone: 'green' | 'blue' | 'neutral' }[]
    actions: { key: string; label: string }[]
    description: string
  } | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setIsLoading(true)
      try {
        const [data, commentData, relatedData, metaData] = await Promise.all([
          getVideoDetail(videoId),
          getVideoDetailComments(videoId),
          getRelatedVideos(videoId),
          getVideoDetailMeta(videoId),
        ])
        if (cancelled) return
        setVideo(data)
        setComments(commentData)
        setRelatedVideos(relatedData)
        setMeta(metaData)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [videoId])

  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 1800)
  }

  const currentVideoTitle = useMemo(
    () => meta?.title ?? video?.title ?? 'Đậu hũ sốt nấm đơn giản trong 20 phút',
    [meta, video],
  )

  const displayDuration = useMemo(() => {
    const total = 522 // 08:42
    const watched = 225 // 03:45
    return {
      watched: formatDuration(watched),
      total: formatDuration(total),
      percent: (watched / total) * 100,
    }
  }, [])

  const handleSubmitComment = () => {
    const text = commentDraft.trim()
    if (!text) return
    const newComment: CommentItem = {
      id: `new-${Date.now()}`,
      initials: 'BẠN',
      author: 'Bạn (Thành viên)',
      badges: [{ label: 'Thành viên tích cực', tone: 'member' }],
      timeAgo: 'Vừa xong',
      content: text,
      likes: 0,
    }
    setComments((prev) => [newComment, ...prev])
    setCommentDraft('')
    showToast('✅ Đã gửi bình luận')
  }

  // Group top-level comments and replies
  const { topLevelComments, repliesMap } = useMemo(() => {
    const top: CommentItem[] = []
    const replies: Record<string, CommentItem[]> = {}
    for (const c of comments) {
      if (c.replyToId) {
        if (!replies[c.replyToId]) replies[c.replyToId] = []
        replies[c.replyToId].push(c)
      } else {
        top.push(c)
      }
    }
    return { topLevelComments: top, repliesMap: replies }
  }, [comments])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAF8]">
        <div className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6">
          <Button
            type="button"
            size="sm"
            variant="outline"
            leftIcon={<ArrowLeftIcon size={14} />}
            onClick={() => onNavigate?.('/videos')}
            className="mb-6"
          >
            Quay lại danh sách video
          </Button>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <SkeletonLoader count={1} variant="card" />
              <SkeletonLoader count={2} variant="text" />
            </div>
            <div className="space-y-4">
              <SkeletonLoader count={3} variant="card" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!video || !meta) {
    return (
      <div className="min-h-screen bg-[#F8FAF8]">
        <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6">
          <EmptyState
            title="Không tìm thấy video này"
            description={`ID "${videoId || '(trống)'}" không tồn tại trong kho video cộng đồng.`}
            actionLabel="Quay lại kho video"
            onAction={() => onNavigate?.('/videos')}
            icon={<VideoIcon size={36} className="text-[#2e7d32]" />}
          />
        </div>
      </div>
    )
  }

  const creator = meta.creator

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-[#1F2937] font-['Inter']">
      <div className="mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-6">
        {/* ============= BREADCRUMBS ============= */}
        <nav
          aria-label="Breadcrumb"
          className="mb-4 flex flex-wrap items-center gap-2 text-[14px] text-[#6B7280]"
        >
          <button
            type="button"
            onClick={() => onNavigate?.('/')}
            className="hover:text-[#2e7d32] transition"
          >
            Trang chủ
          </button>
          <span className="text-[#9CA3AF]" aria-hidden>
            ›
          </span>
          <button
            type="button"
            onClick={() => onNavigate?.('/videos')}
            className="hover:text-[#2e7d32] transition"
          >
            Video
          </button>
          <span className="text-[#9CA3AF]" aria-hidden>
            ›
          </span>
          <span className="text-[#1F2937] font-medium">{currentVideoTitle}</span>
        </nav>

        {/* ============= MAIN 2 COLUMNS ============= */}
        <main className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* ============= LEFT COLUMN: PLAYER & CONTENT ============= */}
          <article className="lg:col-span-8 flex flex-col gap-5">
            {/* 16:9 Video Player */}
            <div className="relative aspect-video w-full overflow-hidden rounded-[16px] bg-black shadow-[0_4px_20px_rgba(0,0,0,0.15)] group">
              <img
                src={video.thumbnailUrl}
                alt={currentVideoTitle}
                className="h-full w-full object-cover opacity-90 transition duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30 pointer-events-none" />

              {/* Big Center Play Button */}
              <button
                type="button"
                aria-label="Phát video"
                onClick={() => setIsPlaying((p) => !p)}
                className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer"
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/95 shadow-2xl ring-4 ring-white/20 transition duration-200 transform group-hover:scale-110">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#2e7d32] text-white">
                    {isPlaying ? (
                      <PauseIcon size={24} />
                    ) : (
                      <PlayIcon size={26} className="ml-1 fill-white" />
                    )}
                  </div>
                </div>
              </button>

              {/* Video Control Bar */}
              <div className="absolute inset-x-0 bottom-0 z-20 px-4 pb-3 pt-6 bg-gradient-to-t from-black/90 to-transparent">
                {/* Progress bar */}
                <div className="mb-2 flex items-center gap-3">
                  <div className="relative h-[5px] flex-1 cursor-pointer rounded-full bg-white/30">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-[#2e7d32]"
                      style={{ width: `${displayDuration.percent}%` }}
                    />
                    <span
                      aria-hidden
                      className="absolute -top-1 h-3 w-3 -translate-x-1/2 rounded-full bg-white shadow-md ring-2 ring-[#2e7d32]"
                      style={{ left: `${displayDuration.percent}%` }}
                    />
                  </div>
                </div>

                {/* Control buttons & duration */}
                <div className="flex items-center justify-between text-white text-[13px]">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      aria-label="Tạm dừng / Tiếp tục"
                      onClick={() => setIsPlaying((p) => !p)}
                      className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/20 transition text-white"
                    >
                      {isPlaying ? <PauseIcon size={16} /> : <PlayIcon size={16} className="fill-white" />}
                    </button>
                    <button
                      type="button"
                      aria-label="Âm lượng"
                      className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/20 transition text-white"
                    >
                      <VolumeIcon size={16} />
                    </button>
                    <div className="font-medium tabular-nums text-white/90 text-[12px]">
                      <span>{displayDuration.watched}</span>
                      <span className="mx-1 text-white/60">/</span>
                      <span className="text-white/80">{displayDuration.total}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Cài đặt"
                      className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/20 transition text-white"
                    >
                      <SettingsIcon size={16} />
                    </button>
                    <button
                      type="button"
                      aria-label="Toàn màn hình"
                      className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/20 transition text-white"
                    >
                      <FullscreenIcon size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Tags Row */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center rounded-full border border-[#C8E6C9] bg-[#E8F5E9] px-3 py-1 text-[12px] font-bold text-[#2e7d32]">
                Món chính chay
              </span>
              <span className="inline-flex items-center rounded-full border border-[#E5E7EB] bg-white px-3 py-1 text-[12px] font-medium text-[#4B5563]">
                Nấu nhanh 20 phút
              </span>
              <span className="inline-flex items-center rounded-full border border-[#E5E7EB] bg-white px-3 py-1 text-[12px] font-medium text-[#4B5563]">
                Giàu đạm thực vật
              </span>
            </div>

            {/* Title */}
            <h1 className="text-[24px] sm:text-[28px] font-extrabold tracking-tight text-[#111827] leading-tight">
              {currentVideoTitle}
            </h1>

            {/* Channel Bar & Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-1 border-b border-[#E5E7EB] pb-5">
              {/* Channel Profile */}
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E8F5E9] text-[15px] font-extrabold text-[#2e7d32] border border-[#C8E6C9]">
                  {creator.initials}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[15px] font-bold text-[#1F2937]">
                      {creator.name}
                    </span>
                    {creator.verified && (
                      <span
                        className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-[#2e7d32] text-white text-[10px] font-bold"
                        title="Đã xác thực"
                      >
                        ✓
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-[#6B7280]">
                    {formatCountCompact(creator.subscribers)} người theo dõi • {creator.postedAgo}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setSubscribed((v) => !v)
                    showToast(subscribed ? 'Đã bỏ theo dõi' : '✅ Đã theo dõi kênh')
                  }}
                  className="ml-2 !rounded-full !bg-[#2e7d32] hover:!bg-[#1b5e20] !text-white !px-4 !py-1.5 !text-[13px] !font-semibold"
                >
                  {subscribed ? '✓ Đang theo dõi' : '+ Theo dõi'}
                </Button>
              </div>

              {/* Action Buttons: Like, Share, Save */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLiked((v) => !v)
                    showToast(liked ? 'Đã bỏ thích' : '👍 Đã thích video này')
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] px-3.5 py-1.5 text-[13px] font-medium transition ${
                    liked
                      ? 'bg-[#E8F5E9] text-[#2e7d32] border-[#C8E6C9]'
                      : 'bg-white hover:bg-[#F9FAFB] text-[#374151]'
                  }`}
                >
                  <ThumbsUpIcon size={14} className={liked ? 'fill-[#2e7d32]' : ''} />
                  <span>1.2K Thích</span>
                </button>
                <button
                  type="button"
                  onClick={() => showToast('🔗 Link video đã được sao chép')}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] px-3.5 py-1.5 text-[13px] font-medium text-[#374151] transition"
                >
                  <ShareIcon size={14} />
                  <span>Chia sẻ</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSaved((v) => !v)
                    showToast(saved ? 'Đã bỏ lưu video' : '🔖 Đã lưu video vào danh sách')
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] px-3.5 py-1.5 text-[13px] font-medium transition ${
                    saved
                      ? 'bg-[#E8F5E9] text-[#2e7d32] border-[#C8E6C9]'
                      : 'bg-white hover:bg-[#F9FAFB] text-[#374151]'
                  }`}
                >
                  <BookmarkIcon size={14} className={saved ? 'fill-[#2e7d32]' : ''} />
                  <span>{saved ? 'Đã lưu' : 'Lưu video'}</span>
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="text-[14px] leading-relaxed text-[#4B5563]">
              <p>{meta.description}</p>
            </div>

            {/* Comments Section */}
            <section className="mt-4 rounded-[16px] border border-[#E5E7EB] bg-white p-5 sm:p-6 shadow-sm">
              {/* Header */}
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-[18px] font-bold text-[#1F2937]">Bình luận</h2>
                  <span className="inline-flex items-center rounded-full bg-[#E8F5E9] px-2.5 py-0.5 text-[12px] font-bold text-[#2e7d32]">
                    48
                  </span>
                </div>
                <div className="inline-flex items-center gap-1 text-[12px] font-medium text-[#6B7280]">
                  <span>Sắp xếp:</span>
                  <span className="font-semibold text-[#1F2937]">Mới nhất</span>
                  <span className="text-[#D1D5DB]">•</span>
                  <span className="text-[#6B7280]">Hàng đầu</span>
                </div>
              </div>

              {/* Comment composer */}
              <div className="mb-7 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8F5E9] text-[12px] font-bold text-[#2e7d32] border border-[#C8E6C9]">
                  BẠN
                </div>
                <div className="min-w-0 flex-1">
                  <Textarea
                    placeholder="Chia sẻ cảm nghĩ hoặc đặt câu hỏi về món ăn này..."
                    value={commentDraft}
                    onChange={(e) => setCommentDraft(e.target.value)}
                    rows={3}
                    className="!rounded-[10px] !text-[14px]"
                  />
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#2e7d32]">
                      <span className="text-[14px]">🛡</span>
                      Giữ thảo luận văn minh &amp; tích cực
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setCommentDraft('')}
                        className="!text-[#6B7280]"
                      >
                        Hủy
                      </Button>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        leftIcon={<SendIcon size={13} />}
                        onClick={handleSubmitComment}
                        disabled={!commentDraft.trim()}
                        className="!bg-[#2e7d32] hover:!bg-[#1b5e20] !text-white !rounded-[8px]"
                      >
                        Gửi bình luận
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-6">
                {topLevelComments.map((comment) => (
                  <div key={comment.id} className="space-y-3">
                    {/* Top level item */}
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${
                          comment.isExpert
                            ? 'bg-[#E8F5E9] text-[#2e7d32] border border-[#C8E6C9]'
                            : 'bg-[#F3F4F6] text-[#4B5563]'
                        }`}
                      >
                        {comment.initials ?? <UserIcon size={16} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <span className="text-[14px] font-bold text-[#1F2937]">
                            {comment.author}
                          </span>
                          {comment.badges?.map((b) => (
                            <span
                              key={b.label}
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                b.tone === 'pro'
                                  ? 'bg-[#E8F5E9] text-[#2e7d32] border border-[#C8E6C9]'
                                  : b.tone === 'author'
                                    ? 'bg-[#2e7d32] text-white'
                                    : 'bg-[#E8F5E9] text-[#2e7d32]'
                              }`}
                            >
                              {b.label}
                            </span>
                          ))}
                          <span className="text-[12px] text-[#6B7280]">
                            • {comment.timeAgo}
                          </span>
                        </div>
                        <p className="text-[14px] leading-relaxed text-[#374151]">
                          {comment.content}
                        </p>
                        <div className="mt-2 flex items-center gap-4 text-[12px] font-medium text-[#6B7280]">
                          <button
                            type="button"
                            onClick={() => showToast(`👍 Đã thích bình luận của ${comment.author}`)}
                            className="inline-flex items-center gap-1 hover:text-[#2e7d32] transition"
                          >
                            <ThumbsUpIcon size={13} />
                            <span>{comment.likes}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setCommentDraft(`@${comment.author} `)}
                            className="hover:text-[#2e7d32] transition"
                          >
                            Trả lời
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Nested replies if any */}
                    {repliesMap[comment.id]?.map((reply) => (
                      <div
                        key={reply.id}
                        className="ml-6 sm:ml-12 rounded-[12px] border-l-4 border-[#2e7d32] bg-[#F5FBF6] p-3.5 flex items-start gap-3"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2e7d32] text-[11px] font-bold text-white">
                          {reply.initials ?? 'AN'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <span className="text-[14px] font-bold text-[#1F2937]">
                              {reply.author}
                            </span>
                            {reply.badges?.map((b) => (
                              <span
                                key={b.label}
                                className="inline-flex items-center rounded-full bg-[#2e7d32] px-2 py-0.5 text-[10px] font-semibold text-white"
                              >
                                {b.label}
                              </span>
                            ))}
                            <span className="text-[12px] text-[#6B7280]">
                              • {reply.timeAgo}
                            </span>
                          </div>
                          <p className="text-[14px] leading-relaxed text-[#374151]">
                            {reply.content}
                          </p>
                          <div className="mt-2 flex items-center gap-4 text-[12px] font-medium text-[#6B7280]">
                            <button
                              type="button"
                              onClick={() => showToast(`👍 Đã thích phản hồi của ${reply.author}`)}
                              className="inline-flex items-center gap-1 hover:text-[#2e7d32] transition"
                            >
                              <ThumbsUpIcon size={13} />
                              <span>{reply.likes}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setCommentDraft(`@${reply.author} `)}
                              className="hover:text-[#2e7d32] transition"
                            >
                              Trả lời
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </section>
          </article>

          {/* ============= RIGHT COLUMN: SIDEBAR ============= */}
          <aside className="lg:col-span-4 flex flex-col gap-6">
            {/* Box 1: Video bạn có thể thích */}
            <div className="rounded-[16px] border border-[#E5E7EB] bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[16px] font-bold text-[#1F2937]">
                  Video bạn có thể thích
                </h2>
                <button
                  type="button"
                  onClick={() => onNavigate?.('/videos')}
                  className="inline-flex items-center gap-0.5 text-[12px] font-semibold text-[#2e7d32] hover:underline"
                >
                  Xem tất cả
                  <ChevronRight size={14} />
                </button>
              </div>

              {/* 3 Related Video Cards stacked */}
              <div className="space-y-4">
                {relatedVideos.map((rv) => (
                  <div
                    key={rv.id}
                    className="flex flex-col gap-2 rounded-[12px] border border-[#F3F4F6] p-2.5 transition hover:border-[#C8E6C9] hover:bg-[#F9FAF8]"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video w-full overflow-hidden rounded-[10px] bg-[#E5E7EB]">
                      <img
                        src={THUMB(rv.thumbnailSeed)}
                        alt={rv.title}
                        className="h-full w-full object-cover transition duration-300 hover:scale-105"
                      />
                      <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {rv.duration}
                      </span>
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-col gap-1">
                      <span className="w-fit rounded-full bg-[#E8F5E9] px-2 py-0.5 text-[10px] font-bold text-[#2e7d32]">
                        {rv.category}
                      </span>
                      <h3
                        className="text-[13px] font-bold text-[#1F2937] line-clamp-2 leading-snug cursor-pointer hover:text-[#2e7d32]"
                        onClick={() => onNavigate?.(`/videos/${rv.id}`)}
                      >
                        {rv.title}
                      </h3>
                      <div className="flex items-center justify-between text-[11px] text-[#6B7280] pt-0.5">
                        <span className="font-medium">{rv.author}</span>
                        <span className="flex items-center gap-1 font-semibold">
                          <EyeIcon size={11} />
                          {rv.views}
                        </span>
                      </div>
                    </div>

                    {/* Button Xem video */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      fullWidth
                      leftIcon={<PlayIcon size={12} className="fill-[#2e7d32]" />}
                      onClick={() => onNavigate?.(`/videos/${rv.id}`)}
                      className="!mt-1 !h-8 !rounded-[8px] !border-none !bg-[#E8F5E9] !text-[12px] !font-semibold !text-[#2e7d32] hover:!bg-[#2e7d32] hover:!text-white transition"
                    >
                      Xem video
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Box 2: TRỢ LÝ DINH DƯỠNG AI */}
            <div className="rounded-[16px] border border-[#DCFCE7] bg-[#F0FDF4] p-5 shadow-sm">
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#2e7d32]">
                <span className="h-2 w-2 rounded-full bg-[#2e7d32]" />
                TRỢ LÝ DINH DƯỠNG AI
              </div>
              <h3 className="mb-2 text-[16px] font-bold text-[#111827]">
                Cần giải đáp về video này?
              </h3>
              <p className="mb-4 text-[13px] leading-relaxed text-[#4B5563]">
                Bạn muốn thay thế nguyên liệu hay điều chỉnh gia vị cho người tiểu đường? Hãy hỏi Trợ lý AI ngay.
              </p>
              <Button
                type="button"
                variant="primary"
                fullWidth
                leftIcon={<SparklesIcon size={15} />}
                onClick={() => onNavigate?.('/ai-chat')}
                className="!rounded-[10px] !bg-[#2e7d32] hover:!bg-[#1b5e20] !text-white !py-2.5 !font-semibold !text-[14px]"
              >
                Chat với AI dinh dưỡng
              </Button>
            </div>
          </aside>
        </main>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 pointer-events-none">
          <div className="rounded-[10px] border border-[#C8E6C9] bg-white px-4 py-2.5 text-[13px] font-medium text-[#1F2937] shadow-xl">
            {toast}
          </div>
        </div>
      )}

      {/* Hidden icon silencer */}
      <div className="hidden" aria-hidden>
        <MessageSquare size={1} />
        <ReplyIcon size={1} />
      </div>
    </div>
  )
}
