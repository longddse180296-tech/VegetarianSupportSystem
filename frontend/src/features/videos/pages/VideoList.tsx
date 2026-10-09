import { useEffect, useMemo, useState } from 'react'
import {
  Filter,
  PlayCircle,
  RefreshCw,
  Search,
  Shield,
  Upload as UploadIcon,
  VideoIcon,
} from 'lucide-react'
import {
  Button,
  EmptyState,
  Input,
  Select,
  SkeletonLoader,
  StatusBadge,
} from '../../../shared/components'
import type { SelectOption } from '../../../shared/components'
import { getVideos, uploadVideo } from '../api/videoApi'
import { UploadVideoModal } from '../components/UploadVideoModal'
import { VideoCard } from '../components/VideoCard'
import type {
  UploadVideoFormState,
  VideoCategory,
  VideoItem,
  VideoListFilter,
  VideoModerationStatus,
  VideoSortOption,
} from '../types/video.types'
import {
  CATEGORY_LABELS,
  DEFAULT_VIDEO_FILTER,
  MODERATION_STATUS_LABELS,
  SORT_LABELS,
  formatDuration,
} from '../types/video.types'

interface VideoListPageProps {
  onNavigate?: (path: string) => void
  isLoggedIn?: boolean
}

const CATEGORY_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'Tất cả danh mục' },
  ...(Object.keys(CATEGORY_LABELS) as VideoCategory[]).map((k) => ({
    value: k,
    label: CATEGORY_LABELS[k],
  })),
]

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'published', label: MODERATION_STATUS_LABELS.published },
  { value: 'ai_checking', label: MODERATION_STATUS_LABELS.ai_checking },
  { value: 'pending_admin', label: MODERATION_STATUS_LABELS.pending_admin },
  { value: 'rejected', label: MODERATION_STATUS_LABELS.rejected },
]

const SORT_OPTIONS: SelectOption[] = (
  Object.keys(SORT_LABELS) as VideoSortOption[]
).map((k) => ({ value: k, label: SORT_LABELS[k] }))

export default function VideoList({
  onNavigate,
  isLoggedIn: _isLoggedIn,
}: VideoListPageProps) {
  const [filter, setFilter] = useState<VideoListFilter>(DEFAULT_VIDEO_FILTER)
  const [items, setItems] = useState<VideoItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
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
        const res = await getVideos(DEFAULT_VIDEO_FILTER)
        if (cancelled) return
        setItems(res.items)
        setTotalCount(res.totalCount)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    let cancelled = false
    const t = window.setTimeout(() => {
      ;(async () => {
        setIsLoading(true)
        try {
          const res = await getVideos(filter)
          if (cancelled) return
          setItems(res.items)
          setTotalCount(res.totalCount)
        } finally {
          if (!cancelled) setIsLoading(false)
        }
      })()
    }, 200)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [filter])

  const stats = useMemo(() => {
    const published = items.filter((v) => v.moderationStatus === 'published').length
    const checking = items.filter((v) => v.moderationStatus === 'ai_checking').length
    const pending = items.filter((v) => v.moderationStatus === 'pending_admin').length
    const avgDur =
      items.length === 0
        ? 0
        : Math.round(
            items.reduce((acc, v) => acc + v.durationSeconds, 0) / items.length,
          )
    const totalViews = items.reduce((acc, v) => acc + v.viewCount, 0)
    return { published, checking, pending, avgDur, totalViews }
  }, [items])

  const updateFilter = (patch: Partial<VideoListFilter>) => {
    setFilter((prev) => ({ ...prev, ...patch }))
  }

  const resetFilter = () => setFilter(DEFAULT_VIDEO_FILTER)

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
      // Nếu filter all (hoặc trạng thái khớp) thì append
      const willAdd =
        (filter.status === 'all' || filter.status === created.moderationStatus) &&
        (filter.category === 'all' || filter.category === created.category)
      if (willAdd) {
        setItems((prev) => [created, ...prev])
        setTotalCount((prev) => prev + 1)
      } else {
        setIsLoading(true)
        try {
          const res = await getVideos(filter)
          setItems(res.items)
          setTotalCount(res.totalCount)
        } finally {
          setIsLoading(false)
        }
      }
      showToast(
        created.moderationStatus === 'ai_checking'
          ? '✅ Đã gửi video, AI đang kiểm tra nội dung...'
          : created.moderationStatus === 'pending_admin'
            ? '🚩 AI gắn cờ nội dung, đang chuyển Admin xem xét cuối cùng.'
            : '✅ Video đã gửi lên hệ thống!',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f6faf7] text-[#1f2937]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="mb-6 overflow-hidden rounded-[24px] border border-[#e5e7eb] bg-gradient-to-br from-white via-white to-[#e8f5e9] p-6 shadow-xs sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2e7d32] px-3 py-1 text-[11px] font-extrabold text-white shadow-sm">
                <VideoIcon size={12} /> KÊNH VIDEO CHIA SẺ CỘNG ĐỒNG
              </span>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Kho video hướng dẫn nấu ăn thuần thực vật & lối sống lành mạnh
              </h1>
              <p className="mt-2 text-sm leading-6 text-[#6b7280]">
                Học nấu qua hình ảnh, nghe chia sẻ của đầu bếp & creator Việt Nam. Bạn cũng có thể tự
                tải video của mình lên để chia sẻ cho cộng đồng.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="primary"
                size="md"
                leftIcon={<UploadIcon size={14} />}
                onClick={() => setShowUpload(true)}
              >
                Upload video của tôi
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="md"
                leftIcon={<RefreshCw size={14} />}
                onClick={async () => {
                  setIsLoading(true)
                  try {
                    const res = await getVideos(filter)
                    setItems(res.items)
                    setTotalCount(res.totalCount)
                  } finally {
                    setIsLoading(false)
                  }
                }}
              >
                Làm mới
              </Button>
              <Button
                type="button"
                variant="outline"
                size="md"
                leftIcon={<Shield size={14} />}
                onClick={() => showToast('AI flag riêng, Admin duyệt riêng! Không trộn lẫn luồng.')}
              >
                Quy tắc kiểm duyệt
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-[16px] border border-[#e5e7eb] bg-white p-4">
              <div className="text-[11px] font-extrabold uppercase tracking-wide text-[#6b7280]">
                Tổng video
              </div>
              <div className="mt-1 text-2xl font-extrabold text-[#1f2937]">{totalCount}</div>
            </div>
            <div className="rounded-[16px] border border-[#c8e6c9] bg-[#e8f5e9]/70 p-4">
              <div className="text-[11px] font-extrabold uppercase tracking-wide text-[#2e7d32]">
                Đã xuất bản
              </div>
              <div className="mt-1 flex items-end gap-2">
                <div className="text-2xl font-extrabold text-[#2e7d32]">{stats.published}</div>
                <StatusBadge size="sm" status="suitable" />
              </div>
            </div>
            <div className="rounded-[16px] border border-sky-200 bg-sky-50/80 p-4">
              <div className="text-[11px] font-extrabold uppercase tracking-wide text-sky-700">
                AI đang kiểm tra
              </div>
              <div className="mt-1 flex items-end gap-2">
                <div className="text-2xl font-extrabold text-sky-700">{stats.checking}</div>
                <StatusBadge size="sm" status="info" />
              </div>
            </div>
            <div className="rounded-[16px] border border-amber-200 bg-amber-50/80 p-4">
              <div className="text-[11px] font-extrabold uppercase tracking-wide text-amber-700">
                Chờ Admin duyệt
              </div>
              <div className="mt-1 flex items-end gap-2">
                <div className="text-2xl font-extrabold text-amber-700">{stats.pending}</div>
                <StatusBadge size="sm" status="insufficient" />
              </div>
            </div>
            <div className="rounded-[16px] border border-[#e5e7eb] bg-white p-4">
              <div className="text-[11px] font-extrabold uppercase tracking-wide text-[#6b7280]">
                Lượt xem cộng đồng
              </div>
              <div className="mt-1 text-2xl font-extrabold text-[#1f2937]">
                {stats.totalViews.toLocaleString('vi-VN')}
              </div>
            </div>
          </div>
        </section>

        {/* Filter bar */}
        <section className="mb-5 rounded-[20px] border border-[#e5e7eb] bg-white p-4 shadow-xs sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#e8f5e9] text-[#2e7d32]">
                <Filter size={15} />
              </span>
              <div>
                <div className="text-[15px] font-extrabold tracking-tight">
                  Bộ lọc video & tìm kiếm
                </div>
                <div className="text-[11px] text-[#6b7280]">
                  Thời lượng trung bình danh sách hiện tại:{' '}
                  <strong className="text-[#1f2937]">{formatDuration(stats.avgDur)}</strong>
                </div>
              </div>
            </div>
            {Object.entries(filter).some(
              ([k, v]) =>
                (DEFAULT_VIDEO_FILTER as unknown as Record<string, unknown>)[k] !== v,
            ) && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                leftIcon={<RefreshCw size={12} />}
                onClick={resetFilter}
              >
                Xóa bộ lọc
              </Button>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-12">
            <div className="md:col-span-4">
              <Input
                label="Tìm video"
                size={13}
                placeholder="Tìm theo tên, tác giả, từ khóa..."
                value={filter.search}
                onChange={(e) => updateFilter({ search: e.target.value })}
                leftIcon={<Search size={14} />}
              />
            </div>
            <div className="md:col-span-3">
              <Select
                label="Danh mục"
                size={13}
                value={filter.category}
                onChange={(e) => updateFilter({ category: e.target.value as VideoCategory | 'all' })}
                options={CATEGORY_OPTIONS}
              />
            </div>
            <div className="md:col-span-3">
              <Select
                label="Trạng thái duyệt"
                size={13}
                value={filter.status}
                onChange={(e) =>
                  updateFilter({ status: e.target.value as VideoModerationStatus | 'all' })
                }
                options={STATUS_OPTIONS}
              />
            </div>
            <div className="md:col-span-2">
              <Select
                label="Sắp xếp"
                size={13}
                value={filter.sort}
                onChange={(e) => updateFilter({ sort: e.target.value as VideoSortOption })}
                options={SORT_OPTIONS}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px]">
            {filter.status === 'all' ? null : (
              <StatusBadge status="info" label={`Trạng thái: ${MODERATION_STATUS_LABELS[filter.status as VideoModerationStatus] ?? filter.status}`} />
            )}
            {filter.category === 'all' ? null : (
              <StatusBadge status="suitable" label={`Danh mục: ${CATEGORY_LABELS[filter.category as VideoCategory] ?? filter.category}`} />
            )}
            {!filter.search.trim() ? null : (
              <StatusBadge status="neutral" label={`Từ khóa: "${filter.search.trim()}"`} />
            )}
            {isLoading && <StatusBadge status="insufficient" label="Đang tải lại..." />}
          </div>
        </section>

        {/* Results */}
        <section>
          {isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              <SkeletonLoader count={6} variant="card" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              title="Không tìm thấy video nào phù hợp"
              description="Hãy thử từ khóa khác, nới lỏng bộ lọc danh mục/trạng thái, hoặc nhấn nút bên dưới để xóa bộ lọc xem toàn bộ kho video cộng đồng."
              actionLabel="Xóa bộ lọc"
              onAction={resetFilter}
              icon={<PlayCircle size={36} className="text-[#2e7d32]" />}
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
