import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft as ArrowLeftIcon,
  BookmarkPlus as BookmarkIcon,
  ChevronRight,
  Eye as EyeIcon,
  Heart as HeartIcon,
  MessageCircleHeart as CommentIcon,
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
  Maximize2 as FullscreenIcon,
} from 'lucide-react'
import {
  Button,
  EmptyState,
  SkeletonLoader,
  StatusBadge,
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
import type { VideoItem, VideoModerationStatus } from '../types/video.types'
import { CATEGORY_LABELS, MODERATION_STATUS_LABELS, formatDuration } from '../types/video.types'

/* ============================= HELPERS ============================= */

const THUMB = (seed: string) =>
  `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${encodeURIComponent(seed)}&image_size=landscape_16_9`

const AVATAR_IMG = (seed: string) =>
  `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${encodeURIComponent(seed)}&image_size=square`

function formatCountCompact(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace('.0', '')}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace('.0', '')}K`
  return String(v)
}

function mapModerationBadge(s: VideoModerationStatus) {
  switch (s) {
    case 'published':
      return 'suitable' as const
    case 'ai_checking':
      return 'info' as const
    case 'pending_admin':
      return 'insufficient' as const
    case 'rejected':
      return 'unsuitable' as const
    default:
      return 'neutral' as const
  }
}

/* ============================= PAGE COMPONENT ============================= */

interface VideoDetailPageProps {
  videoId?: string
  onNavigate?: (path: string) => void
  isLoggedIn?: boolean
}

type DetailTabKey = 'ingredients' | 'steps'

export default function VideoDetail({
  videoId = '',
  onNavigate,
  isLoggedIn: _isLoggedIn,
}: VideoDetailPageProps) {
  const [video, setVideo] = useState<VideoItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

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
  const [activeTab, setActiveTab] = useState<DetailTabKey>('ingredients')

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

  const currentVideoTitle = useMemo(() => meta?.title ?? video?.title ?? '', [meta, video])

  const displayDuration = useMemo(() => {
    const total = video?.durationSeconds ?? 522
    const watched = Math.min(total * 0.43, 225)
    return {
      watched: formatDuration(watched),
      total: formatDuration(total),
      percent: (watched / total) * 100,
    }
  }, [video])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FF]">
        <div className="mx-auto max-w-[1200px] px-[24px] py-8 sm:px-[16px]">
          <Button
            type="button"
            size="sm"
            variant="outline"
            leftIcon={<ArrowLeftIcon size={13} />}
            onClick={() => onNavigate?.('/videos')}
            className="mb-6"
          >
            Quay lại danh sách video
          </Button>
          <SkeletonLoader count={1} variant="card" />
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <SkeletonLoader count={2} variant="card" />
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
      <div className="min-h-screen bg-[#F8F9FF]">
        <div className="mx-auto max-w-[1200px] px-[24px] py-10 sm:px-[16px]">
          <EmptyState
            title="Không tìm thấy video này"
            description={`ID "${videoId || '(trống)'}" không tồn tại trong kho video cộng đồng. Có thể video chưa được Admin phê duyệt hoặc đã bị xóa.`}
            actionLabel="Quay lại trang videos"
            onAction={() => onNavigate?.('/videos')}
            icon={<VideoIcon size={36} className="text-[#2E7D32]" />}
          />
        </div>
      </div>
    )
  }

  const handleSubmitComment = () => {
    const text = commentDraft.trim()
    if (!text) return
    const newComment: CommentItem = {
      id: `new-${Date.now()}`,
      initials: 'BAN',
      author: 'Bạn',
      timeAgo: 'vừa xong',
      content: text,
      likes: 0,
    }
    setComments((prev) => [newComment, ...prev])
    setCommentDraft('')
    showToast('✅ Đã gửi bình luận')
  }

  const pills = meta.pills
  const creator = meta.creator

  return (
    <div className="min-h-screen bg-[#F8F9FF] text-[#1F2937] font-['Inter']">
      <div className="mx-auto w-full max-w-[1200px] px-[24px] py-8 sm:px-[16px]">
        {/* ============= BREADCRUMBS ============= */}
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex flex-wrap items-center gap-2 text-[#6B7280]"
          style={{ fontSize: '14px', lineHeight: '20px' }}
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => (window.location.hash = '/')}
            className="!rounded-full !px-2.5 !py-1 !text-[#6B7280] hover:!text-[#2E7D32]"
          >
            Trang chủ
          </Button>
          <span className="text-[#9CA3AF]" aria-hidden>
            ›
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onNavigate?.('/videos')}
            className="!rounded-full !px-2.5 !py-1 !text-[#6B7280] hover:!text-[#2E7D32]"
          >
            Video
          </Button>
          <span className="text-[#9CA3AF]" aria-hidden>
            ›
          </span>
          <span className="text-[#1F2937]">{currentVideoTitle}</span>
        </nav>

        {/* ============= MAIN 2 CỘT lg: [1.2fr | 0.8fr] ============= */}
        <main className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="flex flex-col gap-6">
            {/* ===== VIDEO PLAYER - aspect-video rounded-[16px] bg-black/95 ===== */}
            <div className="aspect-video w-full overflow-hidden rounded-[16px] bg-black/95 relative shadow-[0_6px_24px_-12px_rgba(15,23,42,0.25)]">
              <img
                src={video.thumbnailUrl}
                alt={currentVideoTitle}
                className="h-full w-full object-cover opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/40" />

              {/* Moderation badge top-left */}
              <span className="absolute left-5 top-5 z-10 hidden sm:inline-flex">
                <StatusBadge
                  size="sm"
                  status={mapModerationBadge(video.moderationStatus)}
                  label={MODERATION_STATUS_LABELS[video.moderationStatus]}
                  className="!bg-white/90 !backdrop-blur !text-[11px]"
                />
              </span>
              {/* Category badge top-right */}
              <span className="absolute right-5 top-5 z-10 hidden sm:inline-flex rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur">
                {CATEGORY_LABELS[video.category]}
              </span>

              {/* Giant center play overlay */}
              <button
                type="button"
                aria-label="Phát video"
                onClick={() => {
                  if (typeof window !== 'undefined')
                    window.open(video.videoUrl, '_blank', 'noopener,noreferrer')
                }}
                className="absolute inset-0 z-10 flex items-center justify-center"
              >
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/95 shadow-2xl ring-4 ring-white/20 transition hover:scale-105">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#2E7D32] text-white">
                    <PlayIcon size={26} className="ml-1.5" />
                  </span>
                </span>
              </button>

              {/* ===== CONTROL BAR ===== */}
              <div className="absolute inset-x-0 bottom-0 z-20 px-4 pb-3 pt-8 sm:px-6 sm:pb-4">
                <div className="mb-3 flex items-center gap-3">
                  <div className="relative h-[6px] flex-1 cursor-pointer rounded-full bg-white/15">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-[#2E7D32]"
                      style={{ width: `${displayDuration.percent}%` }}
                    />
                    <span
                      aria-hidden
                      className="absolute -top-1 h-3 w-3 -translate-x-1/2 rounded-full bg-white shadow-md"
                      style={{ left: `${displayDuration.percent}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label="Tạm dừng / Tiếp tục"
                      onClick={() => showToast('⏸ Đã tạm dừng')}
                      className="!h-8 !w-8 !rounded-[8px] !bg-white/10 !p-0 !text-white backdrop-blur hover:!bg-white/20 hover:!text-white"
                    >
                      <PauseIcon size={16} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label="Âm thanh"
                      className="hidden sm:!inline-flex !h-8 !w-8 !rounded-[8px] !bg-white/10 !p-0 !text-white backdrop-blur hover:!bg-white/20 hover:!text-white"
                    >
                      <VolumeIcon size={16} />
                    </Button>
                    <div
                      className="text-[12px] font-semibold tabular-nums"
                      style={{ lineHeight: '16px' }}
                    >
                      <span>{displayDuration.watched}</span>
                      <span className="mx-1.5 text-white/60">/</span>
                      <span className="text-white/80">{displayDuration.total}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label="Cài đặt chất lượng"
                      className="hidden sm:!inline-flex !h-8 !w-8 !rounded-[8px] !bg-white/10 !p-0 !text-white backdrop-blur hover:!bg-white/20 hover:!text-white"
                    >
                      <SettingsIcon size={16} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label="Toàn màn hình"
                      className="!h-8 !w-8 !rounded-[8px] !bg-white/10 !p-0 !text-white backdrop-blur hover:!bg-white/20 hover:!text-white"
                    >
                      <FullscreenIcon size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* ===== TABS ROW (Nguyên liệu | Cách làm) ===== */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => setActiveTab('ingredients')}
                className={
                  activeTab === 'ingredients'
                    ? '!bg-[#2E7D32] !text-white hover:!bg-[#1b5e20] hover:!text-white'
                    : ''
                }
              >
                Nguyên liệu
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => setActiveTab('steps')}
                className={
                  activeTab === 'steps'
                    ? '!bg-[#2E7D32] !text-white hover:!bg-[#1b5e20] hover:!text-white'
                    : ''
                }
              >
                Cách làm
              </Button>
            </div>

            {/* ===== CATEGORY PILLS + TITLE ===== */}
            <div className="flex flex-col gap-3 px-1">
              <div className="flex flex-wrap gap-2">
                {pills.map((p) => {
                  const toneClass =
                    p.tone === 'green'
                      ? 'border-[#C8E6C9] bg-[#E8F5E9] text-[#2E7D32]'
                      : p.tone === 'blue'
                        ? 'border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]'
                        : 'border-[#E5E7EB] bg-white text-[#1F2937]'
                  return (
                    <span
                      key={p.label}
                      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[12px] font-bold ${toneClass}`}
                    >
                      {p.label}
                    </span>
                  )
                })}
              </div>
              <h1
                className="font-extrabold tracking-[-0.015em] text-[#121C2A]"
                style={{ fontSize: '30px', lineHeight: '40px' }}
              >
                {currentVideoTitle}
              </h1>
            </div>

            {/* ===== CREATOR BAR + THEO DÕI ===== */}
            <div
              className="grid grid-cols-12 items-center gap-4 rounded-[16px] border border-[#E5E7EB] bg-white p-4 sm:p-5"
              style={{ boxShadow: '0 1px 2px 0 rgba(15,23,42,0.03)' }}
            >
              <div className="col-span-12 flex items-center gap-4 sm:col-span-7">
                <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#D1FAE5] text-[15px] font-extrabold text-[#065F46] ring-2 ring-[#A7F3D0]">
                  {creator.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className="font-bold text-[#1F2937]"
                      style={{ fontSize: '15px', lineHeight: '22px' }}
                    >
                      {creator.name}
                    </span>
                    {creator.verified && (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-label="Đã xác minh"
                      >
                        <title>Đã xác minh</title>
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M12 2L14.5 4.5L18 4L18.5 7.5L21 9.5L19 12.5L20 16L16.7 17.2L16 20.5L12 19L8 20.5L7.3 17.2L4 16L5 12.5L3 9.5L5.5 7.5L6 4L9.5 4.5L12 2z"
                          fill="#2E7D32"
                          stroke="white"
                          strokeWidth="1"
                        />
                        <path
                          d="M8.5 12.2L11 14.7L16 9.5"
                          stroke="white"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <div
                    className="flex flex-wrap items-center gap-1 font-medium text-[#6B7280]"
                    style={{ fontSize: '12px', lineHeight: '18px' }}
                  >
                    <span>{formatCountCompact(creator.subscribers)} người theo dõi</span>
                    <span className="mx-1 text-[#D1D5DB]">•</span>
                    <span>{creator.postedAgo}</span>
                  </div>
                </div>
              </div>
              <div className="col-span-12 sm:col-span-5 sm:flex sm:justify-end">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={() => {
                    setSubscribed((v) => !v)
                    showToast(subscribed ? 'Đã bỏ theo dõi' : '✅ Đã theo dõi kênh')
                  }}
                  className="sm:!px-5"
                >
                  <span className="mr-1 font-bold">{subscribed ? '✓' : '+'}</span>
                  {subscribed ? 'Đang theo dõi' : 'Theo dõi'}
                </Button>
              </div>
            </div>

            {/* ===== 3 ACTION BUTTONS ===== */}
            <div className="flex flex-wrap items-center gap-3 px-1">
              <Button
                type="button"
                variant="outline"
                size="md"
                leftIcon={<ThumbsUpIcon size={15} className={liked ? 'fill-[#2E7D32] text-[#2E7D32]' : ''} />}
                onClick={() => {
                  setLiked((v) => !v)
                  showToast(liked ? 'Đã bỏ thích' : '👍 Đã thích video này')
                }}
                className="!rounded-full !px-4"
              >
                {meta.actions[0]?.label ?? 'Thích'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="md"
                leftIcon={<ShareIcon size={15} />}
                onClick={() => showToast('🔗 Link video đã được sao chép')}
                className="!rounded-full !px-4"
              >
                {meta.actions[1]?.label ?? 'Chia sẻ'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="md"
                leftIcon={<BookmarkIcon size={15} className={saved ? 'fill-[#2E7D32] text-[#2E7D32]' : ''} />}
                onClick={() => {
                  setSaved((v) => !v)
                  showToast(saved ? 'Đã bỏ lưu video' : '📌 Đã lưu video vào danh sách của bạn')
                }}
                className="!rounded-full !px-4"
              >
                {meta.actions[2]?.label ?? 'Lưu video'}
              </Button>
            </div>

            {/* ===== MÔ TẢ ===== */}
            <div
              className="rounded-[16px] border border-[#E5E7EB] bg-white p-5"
              style={{ boxShadow: '0 1px 2px 0 rgba(15,23,42,0.03)' }}
            >
              <p
                className="whitespace-pre-line font-normal text-[#1F2937]"
                style={{ fontSize: '14px', lineHeight: '24px' }}
              >
                {meta.description}
              </p>
              {video.tags && video.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {video.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-[#C8E6C9] bg-[#E8F5E9]/70 px-2.5 py-1 text-[11px] font-bold text-[#2E7D32]"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* ===== BÌNH LUẬN ===== */}
            <section
              className="rounded-[16px] border border-[#E5E7EB] bg-white p-5 sm:p-6"
              style={{ boxShadow: '0 1px 2px 0 rgba(15,23,42,0.03)' }}
            >
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h2
                    className="font-bold tracking-[-0.01em] text-[#1F2937]"
                    style={{ fontSize: '18px', lineHeight: '26px' }}
                  >
                    Bình luận
                  </h2>
                  <span className="inline-flex items-center rounded-full bg-[#E8F5E9] px-2 py-0.5 text-[11px] font-bold text-[#2E7D32]">
                    {comments.length}
                  </span>
                </div>
                <div
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#6B7280]"
                  style={{ lineHeight: '18px' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M3 6h18M6 12h12M10 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Sắp xếp: <span className="text-[#1F2937]">Mới nhất</span>
                  <span className="mx-1 text-[#D1D5DB]">•</span>
                  <span className="text-[#1F2937]">Hàng đầu</span>
                </div>
              </div>

              {/* Comment composer: shared Textarea + Button row */}
              <div className="mb-7 flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#E8F5E9] text-[#2E7D32] ring-2 ring-[#C8E6C9]">
                  <UserIcon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <Textarea
                    placeholder="Chia sẻ cảm nhận của bạn về video..."
                    value={commentDraft}
                    onChange={(e) => setCommentDraft(e.target.value)}
                    rows={3}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault()
                        handleSubmitComment()
                      }
                    }}
                  />
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <div
                      className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#2E7D32]"
                      style={{ lineHeight: '18px' }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                        <path d="M12 8.5v4.5M12 17.2h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
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
                      >
                        Gửi bình luận
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comment list */}
              <ul className="space-y-6">
                {comments.map((c) => (
                  <li
                    key={c.id}
                    className={
                      c.highlight === 'author'
                        ? 'relative rounded-[16px] border-l-[3px] border-[#2E7D32] bg-[#F5FBF6] p-4'
                        : 'flex items-start gap-3'
                    }
                  >
                    {c.highlight === 'author' ? (
                      <div className="flex items-start gap-3">
                        {c.authorAvatarSeed ? (
                          <img
                            src={AVATAR_IMG(c.authorAvatarSeed)}
                            alt={c.author}
                            className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-[#A7F3D0]"
                          />
                        ) : (
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#2E7D32] text-[12px] font-extrabold text-white ring-2 ring-[#A7F3D0]">
                            {c.initials ?? <UserIcon size={16} />}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <CommentMeta comment={c} />
                          <CommentBody comment={c} />
                          <CommentActions comment={c} onLike={() => showToast(`❤️ ${c.author}: +1 thích`)} />
                        </div>
                      </div>
                    ) : (
                      <>
                        {c.authorAvatarSeed ? (
                          <img
                            src={AVATAR_IMG(c.authorAvatarSeed)}
                            alt={c.author}
                            className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-[#BFDBFE]"
                          />
                        ) : (
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#E8F5E9] text-[#2E7D32] ring-2 ring-[#BFDBFE]">
                            {c.initials ?? <UserIcon size={16} />}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <CommentMeta comment={c} />
                          <CommentBody comment={c} />
                          <CommentActions comment={c} onLike={() => showToast(`❤️ ${c.author}: +1 thích`)} />
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          </article>

          {/* ============== SIDEBAR RIGHT ============== */}
          <aside className="flex flex-col gap-6">
            {/* ===== VIDEO BẠN CÓ THỂ THÍCH ===== */}
            <div
              className="rounded-[16px] border border-[#E5E7EB] bg-white p-5 sm:p-6"
              style={{ boxShadow: '0 1px 2px 0 rgba(15,23,42,0.04)' }}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2
                  className="font-bold tracking-[-0.01em] text-[#1F2937]"
                  style={{ fontSize: '18px', lineHeight: '26px' }}
                >
                  Video bạn có thể thích
                </h2>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate?.('/videos')}
                  rightIcon={<ChevronRight size={12} />}
                  className="!rounded-full !bg-[#F8FAF8] !px-2.5 !py-1 !text-[12px] !font-bold !text-[#2E7D32] hover:!bg-[#E8F5E9] hover:!text-[#2E7D32]"
                >
                  Xem tất cả
                </Button>
              </div>

              <ul className="space-y-5">
                {relatedVideos.map((rv) => (
                  <li key={rv.id}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => onNavigate?.(`/videos/${rv.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onNavigate?.(`/videos/${rv.id}`)
                        }
                      }}
                      className="group grid w-full cursor-pointer grid-cols-12 items-start gap-3 rounded-[12px] border border-transparent p-1 text-left transition hover:border-[#C8E6C9] hover:bg-[#E8F5E9]/30"
                    >
                      <div className="col-span-5 sm:col-span-5 xl:col-span-6">
                        <div className="relative w-full aspect-video overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-slate-100">
                          <img
                            src={THUMB(rv.thumbnailSeed)}
                            alt={rv.title}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                          />
                          <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-md bg-slate-900/85 px-2 py-0.5 text-[11px] font-extrabold tabular-nums text-white backdrop-blur">
                            {rv.duration}
                          </span>
                          {rv.badge === 'watching' && (
                            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/90 px-2 py-0.5 text-[10px] font-bold text-[#1F2937] backdrop-blur">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
                              Video vào danh chay
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="col-span-7 sm:col-span-7 xl:col-span-6 flex min-w-0 flex-col gap-2">
                        <span className="inline-flex w-fit rounded-full border border-[#C8E6C9] bg-[#E8F5E9] px-2 py-0.5 text-[10px] font-bold text-[#2E7D32]">
                          {rv.category}
                        </span>
                        <h4
                          className="line-clamp-2 font-bold tracking-tight text-[#1F2937]"
                          style={{ fontSize: '14px', lineHeight: '20px' }}
                          title={rv.title}
                        >
                          {rv.title}
                        </h4>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div
                            className="inline-flex items-center gap-1 font-medium text-[#6B7280]"
                            style={{ fontSize: '12px', lineHeight: '16px' }}
                          >
                            {rv.author}
                          </div>
                          <div
                            className="inline-flex items-center gap-1 font-semibold text-[#6B7280] tabular-nums"
                            style={{ fontSize: '12px', lineHeight: '16px' }}
                          >
                            <EyeIcon size={12} />
                            {rv.views}
                          </div>
                        </div>
                        <div className="mt-auto pt-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            fullWidth
                            leftIcon={<PlayIcon size={12} />}
                            onClick={(e) => {
                              e.stopPropagation()
                              onNavigate?.(`/videos/${rv.id}`)
                            }}
                            className="!text-[12px] !font-semibold !text-[#2E7D32] hover:!bg-[#E8F5E9]"
                          >
                            Xem video
                          </Button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* ===== AI ASSISTANT PANEL ===== */}
            <div
              className="rounded-[16px] border border-[#C8E6C9] bg-[#EFFAF1] p-6"
              style={{ boxShadow: '0 1px 3px 0 rgba(15,23,42,0.04)' }}
            >
              <div className="mb-3 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-[#2E7D32]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2E7D32]" />
                TRỢ LÝ DINH DƯỠNG AI
              </div>
              <h3
                className="mb-2 font-extrabold tracking-[-0.01em] text-[#121C2A]"
                style={{ fontSize: '18px', lineHeight: '26px' }}
              >
                Cần giải đáp về video này?
              </h3>
              <p
                className="mb-5 font-normal text-[#1F2937]/80"
                style={{ fontSize: '13px', lineHeight: '20px' }}
              >
                Bạn muốn thay thế nguyên liệu hay điều chỉnh gia vị cho người tiểu đường? Hãy hỏi Trợ lý AI ngay.
              </p>
              <Button
                type="button"
                variant="primary"
                fullWidth
                leftIcon={<SparklesIcon size={15} />}
                onClick={() => onNavigate?.('/ai-chat')}
              >
                Chat với AI dinh dưỡng
              </Button>
            </div>
          </aside>
        </main>
      </div>

      {/* ===== TOAST ===== */}
      {toast ? (
        <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 sm:bottom-10">
          <div className="max-w-[460px] rounded-[12px] border border-[#C8E6C9] bg-white px-4 py-3 text-[13px] font-medium text-[#1F2937] shadow-xl ring-1 ring-black/5">
            {toast}
          </div>
        </div>
      ) : null}

      {/* unused imports silencer */}
      <div className="hidden" aria-hidden>
        <HeartIcon size={1} />
        <ReplyIcon size={1} />
        <CommentIcon size={1} />
      </div>
    </div>
  )
}

/* ========================== COMMENT HELPERS ========================== */

function CommentMeta({ comment }: { comment: CommentItem }) {
  return (
    <div className="mb-1.5 flex flex-wrap items-center gap-2">
      <span
        className="font-bold text-[#1F2937]"
        style={{ fontSize: '14px', lineHeight: '20px' }}
      >
        {comment.author}
      </span>
      {comment.isExpert && (
        <span className="rounded-full bg-[#E8F5E9] px-2 py-0.5 text-[11px] font-bold text-[#2E7D32]">
          Chuyên gia
        </span>
      )}
      {comment.badges?.map((b) => {
        if (b.tone === 'member') {
          return (
            <span
              key={b.label}
              className="inline-flex items-center rounded-full border border-[#C8E6C9] bg-[#E8F5E9] px-2 py-0.5 text-[10px] font-bold text-[#2E7D32]"
            >
              {b.label}
            </span>
          )
        }
        if (b.tone === 'pro') {
          return (
            <span
              key={b.label}
              className="inline-flex items-center gap-1 rounded-full border border-[#86EFAC] bg-[#2E7D32] px-2 py-0.5 text-[10px] font-bold text-white"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#A7F3D0]" />
              {b.label}
            </span>
          )
        }
        return (
          <span
            key={b.label}
            className="inline-flex items-center rounded-full border border-[#15803D] bg-[#166534] px-2 py-0.5 text-[10px] font-bold text-white"
          >
            {b.label}
          </span>
        )
      })}
      <span
        className="font-medium text-[#6B7280]"
        style={{ fontSize: '12px', lineHeight: '18px' }}
      >
        • {comment.timeAgo}
      </span>
    </div>
  )
}

function CommentBody({ comment }: { comment: CommentItem }) {
  return (
    <p
      className="font-normal leading-7 text-[#1F2937]"
      style={{ fontSize: '14px', lineHeight: '24px' }}
    >
      {comment.content}
    </p>
  )
}

function CommentActions({
  comment,
  onLike,
}: {
  comment: CommentItem
  onLike: () => void
}) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-4">
      <button
        type="button"
        onClick={onLike}
        className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#6B7280] transition hover:text-[#2E7D32]"
        style={{ lineHeight: '18px' }}
      >
        <HeartIcon size={13} />
        <span className="tabular-nums">{comment.likes}</span>
      </button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        leftIcon={<ReplyIcon size={13} />}
        className="!text-[#6B7280] hover:!text-[#2E7D32]"
      >
        Trả lời
      </Button>
    </div>
  )
}
