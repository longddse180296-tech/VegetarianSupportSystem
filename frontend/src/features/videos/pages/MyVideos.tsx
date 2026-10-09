import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Upload,
  Video as VideoIcon,
} from 'lucide-react'
import {
  Button,
  EmptyState,
  SkeletonLoader,
  StatusBadge,
} from '../../../shared/components'
import { getVideos, uploadVideo } from '../api/videoApi'
import { UploadVideoModal } from '../components/UploadVideoModal'
import { VideoCard } from '../components/VideoCard'
import type { UploadVideoFormState, VideoItem } from '../types/video.types'
import { MODERATION_STATUS_LABELS } from '../types/video.types'

interface MyVideosPageProps {
  onNavigate?: (path: string) => void
  isLoggedIn?: boolean
}

// Simple mock current user creator filter = "Tôi (đăng nhập)".
const CURRENT_CREATOR_NAME = 'Tôi (đăng nhập)'

export default function MyVideos({
  onNavigate,
  isLoggedIn: _isLoggedIn,
}: MyVideosPageProps) {
  const [items, setItems] = useState<VideoItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 2000)
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setIsLoading(true)
      try {
        const res = await getVideos({})
        if (cancelled) return
        const my = res.items.filter(
          (v) =>
            v.creatorName === CURRENT_CREATOR_NAME ||
            v.id.startsWith('v_user_'),
        )
        setItems(my)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const stats = useMemo(() => {
    const total = items.length
    const published = items.filter((v) => v.moderationStatus === 'published').length
    const checking = items.filter((v) => v.moderationStatus === 'ai_checking').length
    const pending = items.filter((v) => v.moderationStatus === 'pending_admin').length
    const rejected = items.filter((v) => v.moderationStatus === 'rejected').length
    return { total, published, checking, pending, rejected }
  }, [items])

  const handleSelect = (id: string) => {
    onNavigate?.(`/videos/${encodeURIComponent(id)}`)
  }

  const handlePlay = (url: string) => {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  const handleUpload = async (form: UploadVideoFormState) => {
    setSubmitting(true)
    try {
      const created = await uploadVideo(form)
      setItems((prev) => [created, ...prev])
      showToast(
        created.moderationStatus === 'ai_checking'
          ? '✅ Đã gửi lên, AI đang kiểm tra nội dung...'
          : created.moderationStatus === 'pending_admin'
            ? '🚩 AI gắn cờ, chờ Admin xem xét cuối cùng.'
            : '✅ Đã thêm video của bạn!',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f6faf7] text-[#1f2937]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            size="sm"
            variant="outline"
            leftIcon={<ArrowLeft size={13} />}
            onClick={() => onNavigate?.('/videos')}
          >
            Quay lại kênh video cộng đồng
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            leftIcon={<Upload size={14} />}
            onClick={() => setShowUpload(true)}
          >
            Upload video mới
          </Button>
        </div>

        <section className="mb-6 rounded-[24px] border border-[#e5e7eb] bg-gradient-to-br from-white via-white to-[#e8f5e9] p-6 shadow-xs sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2e7d32] px-3 py-1 text-[11px] font-extrabold text-white">
                <VideoIcon size={12} /> KÊNH CỦA TÔI
              </span>
              <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
                Quản lý video tôi đã tải lên
              </h1>
              <p className="mt-2 text-sm leading-6 text-[#6b7280]">
                Theo dõi trạng thái kiểm duyệt từng video: AI flag riêng, Admin sẽ có quyết định phê
                duyệt cuối cùng.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-[16px] border border-[#e5e7eb] bg-white p-4">
              <div className="text-[11px] font-extrabold uppercase text-[#6b7280]">
                Tổng của tôi
              </div>
              <div className="mt-1 text-2xl font-extrabold text-[#1f2937]">{stats.total}</div>
            </div>
            <div className="rounded-[16px] border border-[#c8e6c9] bg-[#e8f5e9]/70 p-4">
              <div className="text-[11px] font-extrabold uppercase text-[#2e7d32]">
                {MODERATION_STATUS_LABELS.published}
              </div>
              <div className="mt-1 flex items-end gap-2">
                <div className="text-2xl font-extrabold text-[#2e7d32]">{stats.published}</div>
                <StatusBadge size="sm" status="suitable" />
              </div>
            </div>
            <div className="rounded-[16px] border border-sky-200 bg-sky-50/80 p-4">
              <div className="text-[11px] font-extrabold uppercase text-sky-700">
                {MODERATION_STATUS_LABELS.ai_checking}
              </div>
              <div className="mt-1 flex items-end gap-2">
                <div className="text-2xl font-extrabold text-sky-700">{stats.checking}</div>
                <StatusBadge size="sm" status="info" />
              </div>
            </div>
            <div className="rounded-[16px] border border-amber-200 bg-amber-50/80 p-4">
              <div className="text-[11px] font-extrabold uppercase text-amber-700">
                {MODERATION_STATUS_LABELS.pending_admin}
              </div>
              <div className="mt-1 flex items-end gap-2">
                <div className="text-2xl font-extrabold text-amber-700">{stats.pending}</div>
                <StatusBadge size="sm" status="insufficient" />
              </div>
            </div>
            <div className="rounded-[16px] border border-red-200 bg-red-50/80 p-4">
              <div className="text-[11px] font-extrabold uppercase text-red-700">
                {MODERATION_STATUS_LABELS.rejected}
              </div>
              <div className="mt-1 flex items-end gap-2">
                <div className="text-2xl font-extrabold text-red-700">{stats.rejected}</div>
                <StatusBadge size="sm" status="unsuitable" />
              </div>
            </div>
          </div>
        </section>

        <section>
          {isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              <SkeletonLoader count={6} variant="card" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              title="Bạn chưa tải lên video nào"
              description="Hãy bắt đầu chia sẻ khoảnh khắc nấu ăn, review nguyên liệu hay mẹo làm đẹp từ chế độ ăn thuần thực vật của bạn!"
              actionLabel="Upload video đầu tiên"
              onAction={() => setShowUpload(true)}
              icon={<Upload size={36} className="text-[#2e7d32]" />}
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((v) => (
                <VideoCard
                  key={v.id}
                  video={v}
                  onSelect={handleSelect}
                  onPlay={handlePlay}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <UploadVideoModal
        isOpen={showUpload}
        onClose={() => {
          if (!submitting) setShowUpload(false)
        }}
        onSubmit={handleUpload}
        submitting={submitting}
      />

      {toast && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-full bg-slate-900/90 px-4 py-2 text-[12px] font-bold text-white shadow-lg backdrop-blur">
          {toast}
        </div>
      )}
    </div>
  )
}
