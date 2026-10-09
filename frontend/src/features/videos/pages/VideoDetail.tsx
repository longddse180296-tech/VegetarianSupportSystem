import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  Eye,
  Heart,
  Info,
  Lightbulb,
  PlayCircle,
  Shield,
  ThumbsUp,
  VideoIcon,
} from 'lucide-react'
import {
  Button,
  EmptyState,
  SkeletonLoader,
  StatusBadge,
} from '../../../shared/components'
import { getVideoDetail } from '../api/videoApi'
import { VideoCard } from '../components/VideoCard'
import type { VideoItem, VideoModerationStatus } from '../types/video.types'
import { CATEGORY_LABELS, MODERATION_STATUS_LABELS, formatDuration } from '../types/video.types'

interface VideoDetailPageProps {
  videoId?: string
  onNavigate?: (path: string) => void
  isLoggedIn?: boolean
}

function mapBadgeStatus(
  s: VideoModerationStatus,
):
  | 'info'
  | 'insufficient'
  | 'suitable'
  | 'neutral'
  | 'warning'
  | 'unsuitable'
  | 'danger' {
  switch (s) {
    case 'ai_checking':
      return 'info'
    case 'pending_admin':
      return 'insufficient'
    case 'published':
      return 'suitable'
    case 'rejected':
      return 'unsuitable'
    default:
      return 'neutral'
  }
}

export default function VideoDetail({
  videoId = '',
  onNavigate,
  isLoggedIn: _isLoggedIn,
}: VideoDetailPageProps) {
  const [video, setVideo] = useState<VideoItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setIsLoading(true)
      try {
        const data = await getVideoDetail(videoId)
        if (!cancelled) setVideo(data)
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
    window.setTimeout(() => setToast(null), 1500)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f6faf7]">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <Button
            type="button"
            size="sm"
            variant="outline"
            leftIcon={<ArrowLeft size={13} />}
            onClick={() => onNavigate?.('/videos')}
            className="mb-5"
          >
            Quay lại danh sách video
          </Button>
          <SkeletonLoader count={1} variant="card" />
          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <SkeletonLoader count={2} variant="card" />
            </div>
            <div>
              <SkeletonLoader count={3} variant="card" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-[#f6faf7]">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <EmptyState
            title="Không tìm thấy video này"
            description={`ID "${videoId || '(trống)'}" không tồn tại trong kho video cộng đồng. Có thể video chưa được Admin phê duyệt hoặc đã bị xóa.`}
            actionLabel="Quay lại trang videos"
            onAction={() => onNavigate?.('/videos')}
            icon={<VideoIcon size={36} className="text-[#2e7d32]" />}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f6faf7] text-[#1f2937]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <Button
          type="button"
          size="sm"
          variant="outline"
          leftIcon={<ArrowLeft size={13} />}
          onClick={() => onNavigate?.('/videos')}
          className="mb-5"
        >
          Quay lại danh sách video
        </Button>

        <article className="overflow-hidden rounded-[20px] border border-[#e5e7eb] bg-white shadow-xs">
          {/* Player area */}
          <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="h-full w-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/30 to-transparent" />
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined')
                  window.open(video.videoUrl, '_blank', 'noopener,noreferrer')
              }}
              className="absolute inset-0 flex items-center justify-center text-white"
            >
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#2e7d32] shadow-2xl ring-4 ring-white/30 transition hover:scale-105">
                <PlayCircle size={44} className="fill-white stroke-white text-white" />
              </span>
            </button>
            <span className="absolute left-5 top-5 z-10 flex flex-wrap gap-2">
              <StatusBadge
                status={mapBadgeStatus(video.moderationStatus)}
                label={MODERATION_STATUS_LABELS[video.moderationStatus]}
              />
              <StatusBadge status="info" label={CATEGORY_LABELS[video.category]} />
            </span>
            <span className="absolute bottom-5 right-5 z-10 inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-3 py-1.5 text-[12px] font-extrabold text-white backdrop-blur">
              {formatDuration(video.durationSeconds)}
            </span>
          </div>

          <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h1 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
                {video.title}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px] font-semibold text-[#6b7280]">
                <span className="inline-flex items-center gap-1">
                  <Eye size={13} /> {video.viewCount.toLocaleString('vi-VN')} lượt xem
                </span>
                <span className="inline-flex items-center gap-1 text-rose-500">
                  <Heart size={13} className="fill-rose-500 stroke-rose-500" />
                  {video.likeCount.toLocaleString('vi-VN')} lượt thích
                </span>
                <span>
                  Đăng ngày{' '}
                  <strong className="text-[#1f2937]">
                    {new Date(video.createdAt).toLocaleDateString('vi-VN')}
                  </strong>
                </span>
              </div>

              <div className="mt-5 flex items-center gap-3 rounded-[16px] border border-[#e5e7eb] bg-[#fafefb] p-4">
                <img
                  src={video.creatorAvatar}
                  alt={video.creatorName}
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-[#c8e6c9]"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-extrabold text-[#1f2937]">
                    {video.creatorName}
                  </div>
                  <div className="truncate text-[11px] text-[#6b7280]">
                    Người tạo · Nội dung cộng đồng thuần thực vật
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  leftIcon={<ThumbsUp size={12} />}
                  onClick={() => showToast('👍 Đã thích video này!')}
                >
                  Thích
                </Button>
              </div>

              <div className="mt-5 rounded-[16px] border border-[#e5e7eb] bg-white p-4 shadow-xs">
                <h2 className="text-[16px] font-extrabold tracking-tight">
                  Mô tả nội dung video
                </h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-7 text-[#1f2937]">
                  {video.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {video.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-[#e8f5e9] px-2.5 py-1 text-[11px] font-extrabold text-[#2e7d32]"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Moderation 2 steps — clear split AI vs Admin */}
              <div className="mt-5 rounded-[16px] border border-[#e5e7eb] bg-white p-4 shadow-xs">
                <div className="mb-2 flex items-center gap-2">
                  <Shield size={15} className="text-[#2e7d32]" />
                  <h3 className="text-[15px] font-extrabold tracking-tight">
                    Trạng thái kiểm duyệt (2 bước, tách AI & Admin)
                  </h3>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[12px] border border-sky-200 bg-sky-50/80 p-3 text-[12px] leading-6 text-sky-800">
                    <div className="flex items-center gap-1.5 font-extrabold text-sky-800">
                      <Info size={13} /> Bước 1: AI (chỉ GẮN CỜ)
                    </div>
                    <p className="mt-1">
                      {video.aiFlagNote ??
                        'Hệ thống AI không phát hiện từ khóa nhạy cảm / nội dung vi phạm → video sẵn sàng cho Admin xem xét.'}
                    </p>
                  </div>
                  <div
                    className={`rounded-[12px] border p-3 text-[12px] leading-6 ${
                      video.moderationStatus === 'published'
                        ? 'border-[#c8e6c9] bg-[#e8f5e9]/70 text-[#1f2937]'
                        : video.moderationStatus === 'pending_admin'
                          ? 'border-amber-200 bg-amber-50/80 text-amber-800'
                          : video.moderationStatus === 'rejected'
                            ? 'border-red-200 bg-red-50/80 text-red-800'
                            : 'border-slate-200 bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-extrabold">
                      <Lightbulb size={13} /> Bước 2: Admin (QUYẾT ĐỊNH CUỐI)
                    </div>
                    <p className="mt-1">
                      {video.adminNote ??
                        (video.moderationStatus === 'published'
                          ? 'Đã phê duyệt xuất bản cộng đồng ✅'
                          : video.moderationStatus === 'pending_admin'
                            ? 'Đang chờ Admin xem xét chi tiết frame & mô tả trước khi quyết định cuối.'
                            : video.moderationStatus === 'rejected'
                              ? 'Admin đã từ chối — xem lý do cụ thể ở trên (nếu có) hoặc liên hệ quản trị.'
                              : 'Chưa đến bước này, AI vẫn đang kiểm tra nội dung.')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="space-y-4">
              <div className="rounded-[16px] border border-[#e5e7eb] bg-white p-4 shadow-xs">
                <h3 className="text-[14px] font-extrabold">Thông tin video</h3>
                <dl className="mt-3 space-y-2 text-[12px]">
                  <div className="flex justify-between">
                    <dt className="font-semibold text-[#6b7280]">ID:</dt>
                    <dd className="font-mono text-[#1f2937]">{video.id}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-semibold text-[#6b7280]">Thời lượng:</dt>
                    <dd className="font-bold text-[#1f2937]">
                      {formatDuration(video.durationSeconds)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-semibold text-[#6b7280]">Danh mục:</dt>
                    <dd className="font-bold text-[#2e7d32]">
                      {CATEGORY_LABELS[video.category]}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-semibold text-[#6b7280]">Trạng thái:</dt>
                    <dd>
                      <StatusBadge
                        status={mapBadgeStatus(video.moderationStatus)}
                        label={MODERATION_STATUS_LABELS[video.moderationStatus]}
                      />
                    </dd>
                  </div>
                </dl>
                <div className="mt-4 space-y-2">
                  <Button
                    type="button"
                    variant="primary"
                    fullWidth
                    leftIcon={<PlayCircle size={14} />}
                    onClick={() => {
                      if (typeof window !== 'undefined')
                        window.open(video.videoUrl, '_blank', 'noopener,noreferrer')
                    }}
                  >
                    Mở video gốc
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    fullWidth
                    onClick={() => showToast('Đã copy link video')}
                  >
                    Sao chép liên kết
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    fullWidth
                    onClick={() => onNavigate?.('/videos')}
                  >
                    Xem video khác
                  </Button>
                </div>
              </div>

              {/* Creator suggest card */}
              <div className="rounded-[16px] border border-[#c8e6c9] bg-[#e8f5e9]/70 p-4 shadow-xs">
                <div className="flex items-center gap-2 text-[#2e7d32]">
                  <VideoIcon size={14} />
                  <h3 className="text-[14px] font-extrabold">
                    Bạn cũng có thể chia sẻ video của mình
                  </h3>
                </div>
                <p className="mt-2 text-[12px] leading-6 text-[#1f2937]">
                  Bạn có khoảnh khắc nấu ăn thuần thực vật đẹp? Chia sẻ ngay với cộng đồng, hệ thống
                  AI sẽ kiểm tra & Admin duyệt nhanh chóng nếu nội dung phù hợp.
                </p>
                <div className="mt-3">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    fullWidth
                    onClick={() => onNavigate?.('/my-videos')}
                  >
                    Đến Upload video
                  </Button>
                </div>
              </div>
            </aside>
          </div>

          {/* Related */}
          <div className="border-t border-[#e5e7eb] p-5 sm:p-8">
            <h3 className="text-[16px] font-extrabold tracking-tight">Video có thể bạn thích</h3>
            <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {/* For now render same video as suggestion card to match requirement of UI without hardcoding more */}
              <VideoCard video={video} onSelect={(id) => onNavigate?.(`/videos/${encodeURIComponent(id)}`)} />
              <div className="flex items-center justify-center rounded-[16px] border border-dashed border-[#c8e6c9] bg-white/60 p-6 text-center sm:col-span-1 xl:col-span-2">
                <div>
                  <VideoIcon size={22} className="mx-auto mb-2 text-[#2e7d32]" />
                  <div className="text-[13px] font-bold text-[#1f2937]">
                    Tải thêm video từ danh sách
                  </div>
                  <p className="mx-auto mt-1 max-w-md text-[11px] leading-5 text-[#6b7280]">
                    Các video liên quan sẽ được gợi ý khi kho video cộng đồng lớn hơn. Hiện tại bạn
                    có thể quay lại danh sách khám phá theo danh mục mình yêu thích.
                  </p>
                  <div className="mt-3">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onNavigate?.('/videos')}
                    >
                      Xem tất cả
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>

      {toast && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-full bg-slate-900/90 px-4 py-2 text-[12px] font-bold text-white shadow-lg backdrop-blur">
          {toast}
        </div>
      )}
    </div>
  )
}
