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

const isFilterDirty = (f: VideoListFilter): boolean =>
  Object.entries(f).some(
    ([k, v]) =>
      (DEFAULT_VIDEO_FILTER as unknown as Record<string, unknown>)[k] !== v,
  )

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

  const handleReload = async () => {
    setIsLoading(true)
    try {
      const res = await getVideos(filter)
      setItems(res.items)
      setTotalCount(res.totalCount)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-[#1F2937] font-['Inter']">
      <div className="mx-auto w-full max-w-[1200px] px-[24px] py-10 sm:px-[16px]">
        {/* ============ HERO ============ */}
        <section
          className="mb-10 overflow-hidden rounded-[16px] border border-[#E5E7EB] bg-gradient-to-br from-[#FFFFFF] via-[#FFFFFF] to-[#E8F5E9] p-8"
          style={{ boxShadow: '0 1px 2px 0 rgba(15,23,42,0.04)' }}
        >
          <div className="flex flex-wrap items-start justify-between gap-8">
            <div className="max-w-[720px] flex-1">
              <span
                className="inline-flex items-center gap-1.5 rounded-full bg-[#2E7D32] px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.02em] text-white shadow-sm"
                style={{ lineHeight: '16px' }}
              >
                <VideoIcon size={14} />
                Kênh video cộng đồng
              </span>

              <h1
                className="mt-4 font-bold tracking-[-0.015em] text-[#121C2A] sm:text-[26px] sm:leading-[34px]"
                style={{ fontSize: '36px', lineHeight: '44px' }}
              >
                Kho video hướng dẫn nấu ăn thuần thực vật &amp; lối sống lành mạnh
              </h1>

              <p
                className="mt-4 font-normal text-[#6B7280]"
                style={{ fontSize: '16px', lineHeight: '28px' }}
              >
                Học nấu qua hình ảnh, nghe chia sẻ của đầu bếp &amp; creator Việt Nam. Bạn cũng có thể tự
                tải video của mình lên để chia sẻ cho cộng đồng.
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="primary"
                size="md"
                leftIcon={<UploadIcon size={16} />}
                onClick={() => setShowUpload(true)}
              >
                Upload video của tôi
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="md"
                leftIcon={<RefreshCw size={16} />}
                onClick={handleReload}
              >
                Làm mới
              </Button>
              <Button
                type="button"
                variant="outline"
                size="md"
                leftIcon={<Shield size={16} />}
                onClick={() =>
                  showToast('AI gắn cờ riêng / Admin duyệt cuối — không trộn lẫn luồng.')
                }
              >
                Quy tắc kiểm duyệt
              </Button>
            </div>
          </div>

          {/* Stats - 5 cards gutter 24px */}
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {/* Tổng video */}
            <div
              className="rounded-[16px] border border-[#E5E7EB] bg-white p-6"
              style={{ boxShadow: '0 1px 2px 0 rgba(15,23,42,0.04)' }}
            >
              <div
                className="flex items-center justify-between font-semibold uppercase tracking-[0.02em] text-[#6B7280]"
                style={{ fontSize: '12px', lineHeight: '16px' }}
              >
                Tổng video
                <VideoIcon size={18} className="text-[#2E7D32]" />
              </div>
              <div
                className="mt-3 font-extrabold tabular-nums text-[#1F2937]"
                style={{ fontSize: '32px', lineHeight: '40px' }}
              >
                {totalCount}
              </div>
            </div>

            {/* Published */}
            <div
              className="rounded-[16px] border border-[#C8E6C9] bg-[#E8F5E9]/70 p-6"
              style={{ boxShadow: '0 1px 2px 0 rgba(15,23,42,0.04)' }}
            >
              <div
                className="flex items-center justify-between font-semibold uppercase tracking-[0.02em] text-[#2E7D32]"
                style={{ fontSize: '12px', lineHeight: '16px' }}
              >
                Đã xuất bản
                <StatusBadge size="sm" status="suitable" />
              </div>
              <div
                className="mt-3 font-extrabold tabular-nums text-[#2E7D32]"
                style={{ fontSize: '32px', lineHeight: '40px' }}
              >
                {stats.published}
              </div>
            </div>

            {/* AI checking */}
            <div
              className="rounded-[16px] border border-sky-200 bg-sky-50 p-6"
              style={{ boxShadow: '0 1px 2px 0 rgba(15,23,42,0.04)' }}
            >
              <div
                className="flex items-center justify-between font-semibold uppercase tracking-[0.02em] text-sky-700"
                style={{ fontSize: '12px', lineHeight: '16px' }}
              >
                AI đang kiểm tra
                <StatusBadge size="sm" status="info" />
              </div>
              <div
                className="mt-3 font-extrabold tabular-nums text-sky-700"
                style={{ fontSize: '32px', lineHeight: '40px' }}
              >
                {stats.checking}
              </div>
            </div>

            {/* Pending Admin */}
            <div
              className="rounded-[16px] border border-amber-200 bg-amber-50 p-6"
              style={{ boxShadow: '0 1px 2px 0 rgba(15,23,42,0.04)' }}
            >
              <div
                className="flex items-center justify-between font-semibold uppercase tracking-[0.02em] text-amber-700"
                style={{ fontSize: '12px', lineHeight: '16px' }}
              >
                Chờ Admin duyệt
                <StatusBadge size="sm" status="insufficient" />
              </div>
              <div
                className="mt-3 font-extrabold tabular-nums text-amber-700"
                style={{ fontSize: '32px', lineHeight: '40px' }}
              >
                {stats.pending}
              </div>
            </div>

            {/* Total views */}
            <div
              className="rounded-[16px] border border-[#E5E7EB] bg-white p-6"
              style={{ boxShadow: '0 1px 2px 0 rgba(15,23,42,0.04)' }}
            >
              <div
                className="flex items-center justify-between font-semibold uppercase tracking-[0.02em] text-[#6B7280]"
                style={{ fontSize: '12px', lineHeight: '16px' }}
              >
                Lượt xem
                <PlayCircle size={18} className="text-[#2E7D32]" />
              </div>
              <div
                className="mt-3 font-extrabold tabular-nums text-[#1F2937]"
                style={{ fontSize: '32px', lineHeight: '40px' }}
              >
                {stats.totalViews.toLocaleString('vi-VN')}
              </div>
            </div>
          </div>
        </section>

        {/* ============ FILTER BAR ============ */}
        <section
          className="mb-8 rounded-[16px] border border-[#E5E7EB] bg-white p-6"
          style={{ boxShadow: '0 1px 2px 0 rgba(15,23,42,0.04)' }}
        >
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#E8F5E9] text-[#2E7D32]"
              >
                <Filter size={18} />
              </span>
              <div>
                <div
                  className="font-semibold tracking-[-0.01em] text-[#1F2937]"
                  style={{ fontSize: '18px', lineHeight: '26px' }}
                >
                  Bộ lọc video &amp; tìm kiếm
                </div>
                <div
                  className="font-normal text-[#6B7280]"
                  style={{ fontSize: '14px', lineHeight: '20px' }}
                >
                  Thời lượng trung bình danh sách hiện tại:{' '}
                  <strong className="text-[#1F2937]">{formatDuration(stats.avgDur)}</strong>
                </div>
              </div>
            </div>

            {isFilterDirty(filter) && (
              <Button
                type="button"
                size="md"
                variant="outline"
                leftIcon={<RefreshCw size={14} />}
                onClick={resetFilter}
              >
                Xóa bộ lọc
              </Button>
            )}
          </div>

          {/* 12-col filter grid */}
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-12 md:col-span-5">
              <Input
                label="Tìm video"
                size={13}
                placeholder="Tìm theo tên, tác giả, từ khóa..."
                value={filter.search}
                onChange={(e) => updateFilter({ search: e.target.value })}
                leftIcon={<Search size={16} />}
              />
            </div>
            <div className="col-span-12 md:col-span-3">
              <Select
                label="Danh mục"
                size={13}
                value={filter.category}
                onChange={(e) =>
                  updateFilter({ category: e.target.value as VideoCategory | 'all' })
                }
                options={CATEGORY_OPTIONS}
              />
            </div>
            <div className="col-span-12 md:col-span-2">
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
            <div className="col-span-12 md:col-span-2">
              <Select
                label="Sắp xếp"
                size={13}
                value={filter.sort}
                onChange={(e) => updateFilter({ sort: e.target.value as VideoSortOption })}
                options={SORT_OPTIONS}
              />
            </div>
          </div>

          {/* Applied filter chips */}
          <div
            className="mt-5 flex flex-wrap items-center gap-2"
            style={{ fontSize: '12px', lineHeight: '16px' }}
          >
            {filter.status !== 'all' && (
              <StatusBadge
                status="info"
                size="md"
                label={`Trạng thái: ${
                  MODERATION_STATUS_LABELS[filter.status as VideoModerationStatus] ??
                  filter.status
                }`}
              />
            )}
            {filter.category !== 'all' && (
              <StatusBadge
                status="suitable"
                size="md"
                label={`Danh mục: ${
                  CATEGORY_LABELS[filter.category as VideoCategory] ?? filter.category
                }`}
              />
            )}
            {!!filter.search.trim() && (
              <StatusBadge
                status="neutral"
                size="md"
                label={`Từ khóa: "${filter.search.trim()}"`}
              />
            )}
            {isLoading && (
              <StatusBadge status="insufficient" size="md" label="Đang tải lại..." />
            )}
          </div>
        </section>

        {/* ============ RESULTS ============ */}
        <section>
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <SkeletonLoader count={6} variant="card" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              title="Không tìm thấy video nào phù hợp"
              description="Hãy thử từ khóa khác, nới lỏng bộ lọc danh mục/trạng thái, hoặc nhấn nút bên dưới để xóa bộ lọc xem toàn bộ kho video cộng đồng."
              actionLabel="Xóa bộ lọc"
              onAction={resetFilter}
              icon={<PlayCircle size={40} className="text-[#2E7D32]" />}
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
        <div
          aria-live="polite"
          className="pointer-events-none fixed bottom-10 left-1/2 z-40 -translate-x-1/2 rounded-full bg-slate-900/90 px-5 py-2 font-semibold text-white shadow-lg backdrop-blur"
          style={{ fontSize: '14px', lineHeight: '20px' }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}
