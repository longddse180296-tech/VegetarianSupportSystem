import { useEffect, useMemo, useState } from 'react'
import {
  Calendar as CalendarIcon,
  ChefHat as ChefIcon,
  Clock3 as ClockIcon,
  Eye as EyeIcon,
  Hash as HashIcon,
  Search as SearchIcon,
  Upload as UploadIcon,
  VideoIcon,
  Sparkles as SparklesIcon,
  Filter as FilterIcon,
  Play as PlayIcon,
  Users as UsersIcon,
  ChevronsLeft as ChevronFirstIcon,
  ChevronsRight as ChevronLastIcon,
  ChevronLeft,
  ChevronRight,
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
import {
  getVideos,
  uploadVideo,
  getVideoListBrowseHelpers,
  type FigmaPillKey,
} from '../api/videoApi'
import { UploadVideoModal } from '../components/UploadVideoModal'
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
  formatDuration,
} from '../types/video.types'

/* ============================ HELPERS ===================================== */

const AVATAR_URL = (seed: string) =>
  `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${encodeURIComponent(seed)}&image_size=square`

interface BrowseHelpers {
  categories: readonly { key: string; label: string }[]
  hashtagTopics: string[]
  topChefs: { id: string; name: string; role: string; videos: number; avatarSeed: string }[]
  durationOpts: SelectOption[]
  sortOpts: SelectOption[]
}

const CATEGORY_TO_FIGMA: Record<VideoCategory, FigmaPillKey> = {
  'cooking-tutorial': 'main',
  'quick-recipe': 'main',
  'ingredient-guide': 'tip',
  'vegan-lifestyle': 'tip',
  'meal-prep': 'main',
  'restaurant-review': 'main',
  'health-tips': 'tip',
  'festival-food': 'dessert',
}

function buildFigmaToVideoKeys(browseCats: readonly { key: string; label: string }[]) {
  const map = {} as Record<string, VideoCategory[]>
  for (const vc of Object.keys(CATEGORY_LABELS) as VideoCategory[]) {
    const fk = CATEGORY_TO_FIGMA[vc]
    if (!map[fk]) map[fk] = []
    map[fk].push(vc)
  }
  // ensure all browse pills exist (even empty) to avoid undefined lookups
  for (const c of browseCats) {
    if (!map[c.key]) map[c.key] = []
  }
  return map as Record<FigmaPillKey, VideoCategory[]>
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

function formatViews(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace('.0', '')}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace('.0', '')}K`
  return String(v)
}

function formatRelativeDate(dateStr: string): string {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  const diffMs = Date.now() - d.getTime()
  const day = Math.round(diffMs / (24 * 3600 * 1000))
  if (day <= 0) return 'Hôm nay'
  if (day === 1) return '1 ngày trước'
  if (day < 30) return `${day} ngày trước`
  const month = Math.round(day / 30)
  return `${month} tháng trước`
}

function matchesDurationFilter(seconds: number, df: string): boolean {
  if (df === 'all' || !df) return true
  const min = seconds / 60
  if (df === 'short') return min < 10
  if (df === 'medium') return min >= 10 && min <= 20
  if (df === 'long') return min > 20
  return true
}

/* ============================ PAGE COMPONENT ===================================== */

interface VideoListPageProps {
  onNavigate?: (path: string) => void
  isLoggedIn?: boolean
}

export default function VideoList({ onNavigate, isLoggedIn: _isLoggedIn }: VideoListPageProps) {
  // ====== STATES GIỮ NGUYÊN LOGIC ======
  const [filter, setFilter] = useState<VideoListFilter>(DEFAULT_VIDEO_FILTER)
  const [items, setItems] = useState<VideoItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // ====== NEW FIGMA UI STATES ======
  const [pillKey, setPillKey] = useState<FigmaPillKey>('all')
  const [durationFilter, setDurationFilter] = useState('all')
  const [searchDraft, setSearchDraft] = useState('')
  const [page, setPage] = useState(1)
  const PER_PAGE = 6

  // ====== Async browse helpers from api ======
  const [browse, setBrowse] = useState<BrowseHelpers | null>(null)
  useEffect(() => {
    let alive = true
    void (async () => {
      const data = await getVideoListBrowseHelpers()
      if (!alive) return
      setBrowse({
        categories: data.categories,
        hashtagTopics: data.hashtagTopics,
        topChefs: data.topChefs,
        durationOpts: data.durationOpts,
        sortOpts: data.sortOpts,
      })
    })()
    return () => {
      alive = false
    }
  }, [])

  const FIGMA_PILL_TO_VIDEO_KEYS = useMemo(() => {
    return buildFigmaToVideoKeys(browse?.categories ?? [])
  }, [browse])

  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 2200)
  }

  useEffect(() => {
    let alive = true
    void (async () => {
      setIsLoading(true)
      try {
        const resp = await getVideos(filter)
        if (!alive) return
        setItems(resp.items)
        setTotalCount(resp.totalCount)
      } finally {
        if (alive) setIsLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [filter])

  const filteredByFigmaPill = useMemo(() => {
    let list = items
    if (pillKey !== 'all') {
      const allowKeys = (FIGMA_PILL_TO_VIDEO_KEYS[pillKey] ?? []) as string[]
      list = list.filter((it) => allowKeys.includes(it.category))
    } else if (filter.category !== 'all') {
      list = list.filter((it) => it.category === filter.category)
    }
    if (durationFilter && durationFilter !== 'all') {
      list = list.filter((it) => matchesDurationFilter(it.durationSeconds, durationFilter))
    }
    const q = (filter.search || searchDraft || '').trim().toLowerCase()
    if (q) {
      list = list.filter((it) =>
        [it.title, it.creatorName, it.description, ...it.tags]
          .join(' ')
          .toLowerCase()
          .includes(q),
      )
    }
    switch (filter.sort as VideoSortOption) {
      case 'newest':
        list = [...list].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
        break
      case 'most_liked':
        list = [...list].sort((a, b) => b.likeCount - a.likeCount)
        break
      case 'duration_asc':
        list = [...list].sort((a, b) => a.durationSeconds - b.durationSeconds)
        break
      case 'trending':
        list = [...list].sort((a, b) => b.viewCount - a.viewCount)
        break
    }
    return list
  }, [items, pillKey, filter.category, filter.search, filter.sort, searchDraft, durationFilter, FIGMA_PILL_TO_VIDEO_KEYS])

  const [aiIngredients, setAiIngredients] = useState('')

  const featuredVideo = useMemo(() => {
    const published = filteredByFigmaPill.filter(
      (v) => v.moderationStatus === 'published' || v.moderationStatus === 'approved',
    )
    return published[0] ?? filteredByFigmaPill[0] ?? null
  }, [filteredByFigmaPill])

  const gridList = useMemo(() => {
    const rest = filteredByFigmaPill.filter((v) => v.id !== featuredVideo?.id)
    const startIdx = (page - 1) * PER_PAGE
    return rest.slice(startIdx, startIdx + PER_PAGE)
  }, [filteredByFigmaPill, featuredVideo, page])

  const totalPages = useMemo(() => {
    const rest = filteredByFigmaPill.filter((v) => v.id !== featuredVideo?.id)
    return Math.max(1, Math.ceil(rest.length / PER_PAGE))
  }, [filteredByFigmaPill, featuredVideo])

  // ====== KEEP Upload LOGIC UNCHANGED ======
  const handleUploadSubmit = async (form: UploadVideoFormState) => {
    setSubmitting(true)
    try {
      const created = await uploadVideo(form)
      setItems((prev) => [created, ...prev])
      setTotalCount((c) => c + 1)
      setShowUpload(false)
      showToast(
        `✅ Đã tải lên "${created.title}". Trạng thái: ${MODERATION_STATUS_LABELS[created.moderationStatus]}${created.aiFlagNote ? ' · ' + created.aiFlagNote.split('. ')[0] : ''}`,
      )
    } catch {
      showToast('❌ Tải lên không thành công. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSearchApply = () => {
    setFilter((prev) => ({ ...prev, search: searchDraft }))
    setPage(1)
  }

  const handlePickPill = (pk: FigmaPillKey) => {
    setPillKey(pk)
    setPage(1)
    setFilter((prev) => ({ ...prev, category: 'all' }))
  }

  const totalPublished = filteredByFigmaPill.filter((v) => v.moderationStatus === 'published').length
  const videoCountLabel = `${Math.max(totalPublished, totalCount)}+ Video`

  return (
    <div className="min-h-screen bg-[#F8F9FF] text-[#1F2937] font-['Inter']">
      <div className="mx-auto w-full max-w-[1200px] px-[24px] py-8 sm:px-[16px]">
        {/* ============= BREADCRUMBS ============= */}
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex items-center gap-2 text-[#6B7280]"
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
          <span className="text-[#1F2937]">Video</span>
        </nav>

        {/* ============= PAGE HEADER ============= */}
        <header className="mb-6 grid grid-cols-12 items-start gap-6">
          <div className="col-span-12 xl:col-span-8">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#E8F5E9] px-2.5 py-1 text-[11px] font-semibold text-[#2E7D32]">
              <VideoIcon size={12} />
              KHO VIDEO HƯỚNG DẪN ẨM THỰC CHAY
            </div>
            <h1
              className="font-extrabold tracking-[-0.015em] text-[#121C2A]"
              style={{ fontSize: '36px', lineHeight: '44px' }}
            >
              Video nấu ăn chay
            </h1>
            <p
              className="mt-3 max-w-[560px] font-normal text-[#6B7280]"
              style={{ fontSize: '16px', lineHeight: '24px' }}
            >
              Khám phá các video hướng dẫn nấu món chay đơn giản, ngon miệng và dễ thực hiện tại nhà cùng chuyên gia dinh dưỡng thực vật.
            </p>
          </div>
          <div className="col-span-12 flex flex-wrap items-center justify-start gap-3 xl:col-span-4 xl:justify-end">
            <Button
              type="button"
              variant="primary"
              size="md"
              leftIcon={<UploadIcon size={16} />}
              onClick={() => setShowUpload(true)}
            >
              Tải video lên
            </Button>
            <div className="inline-flex items-center gap-2 rounded-[12px] border border-[#E5E7EB] bg-white px-3 py-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#E8F5E9] text-[#2E7D32]">
                <VideoIcon size={15} />
              </span>
              <div className="leading-tight">
                <div className="font-bold text-[#1F2937]" style={{ fontSize: '14px' }}>
                  {videoCountLabel}
                </div>
                <div className="text-[#6B7280]" style={{ fontSize: '11px' }}>
                  Công thức chi tiết
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ============= SEARCH BAR + FILTER PILLS ============= */}
        <section
          className="mb-8 rounded-[20px] border border-[#E5E7EB] bg-white p-5"
          style={{ boxShadow: '0 1px 2px 0 rgba(15,23,42,0.04)' }}
        >
          <div className="grid grid-cols-12 items-center gap-3">
            <div className="col-span-12 md:col-span-10">
              <Input
                id="video-search"
                placeholder="Tìm kiếm video theo tên món hoặc chủ đề..."
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearchApply()
                }}
                leftIcon={<SearchIcon size={16} />}
                rightIcon={
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleSearchApply}
                    aria-label="Tìm kiếm"
                    className="-mr-2 !h-8 !w-8 !rounded-[10px] !p-0"
                  >
                    <SearchIcon size={14} />
                  </Button>
                }
              />
            </div>
            <div className="col-span-12 md:col-span-2">
              <Button
                type="button"
                variant="primary"
                size="md"
                fullWidth
                leftIcon={<SearchIcon size={14} />}
                onClick={handleSearchApply}
                className="hidden sm:!inline-flex"
              >
                Tìm kiếm
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {browse?.categories.map((c) => {
                const active = pillKey === c.key
                return (
                  <Button
                    key={c.key}
                    type="button"
                    variant="ghost"
                    onClick={() => handlePickPill(c.key as FigmaPillKey)}
                    className={`!h-10 rounded-full px-4 text-sm font-medium transition-colors ${
                      active
                        ? '!border !border-[#2E7D32] !bg-[#2E7D32] !text-white shadow-sm hover:!bg-[#1b5e20] hover:!text-white'
                        : '!border !border-[#E5E7EB] !bg-white !text-[#1F2937] hover:!border-[#C8E6C9] hover:!bg-[#E8F5E9]/50 hover:!text-[#2E7D32]'
                    }`}
                  >
                    {c.label}
                  </Button>
                )
              })}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 text-[13px] font-medium text-[#6B7280]">
                  <FilterIcon size={14} />
                  Thời lượng:
                </span>
                <Select
                  id="video-duration-select"
                  value={durationFilter}
                  onChange={(e) => {
                    setDurationFilter(e.target.value)
                    setPage(1)
                  }}
                  options={browse?.durationOpts ?? []}
                  fullWidth={false}
                  className="!h-10 !w-[170px] !rounded-[10px] !border-[#E5E7EB] !text-sm !py-0 shadow-none focus:!border-[#2E7D32]"
                  aria-label="Lọc theo thời lượng"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 text-[13px] font-medium text-[#6B7280]">
                  Sắp xếp:
                </span>
                <Select
                  id="video-sort-select"
                  value={filter.sort}
                  onChange={(e) => {
                    setFilter((prev) => ({
                      ...prev,
                      sort: e.target.value as VideoSortOption,
                    }))
                  }}
                  options={browse?.sortOpts ?? []}
                  fullWidth={false}
                  className="!h-10 !w-[160px] !rounded-[10px] !border-[#E5E7EB] !text-sm !py-0 shadow-none focus:!border-[#2E7D32]"
                  aria-label="Sắp xếp video"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ============= MAIN GRID 8/4 ============= */}
        <main className="grid grid-cols-12 gap-6">
          <div className="col-span-12 xl:col-span-8 flex flex-col gap-8">
            {/* ========= VIDEO NỔI BẬT (HERO 2 cols) ========= */}
            {!isLoading && featuredVideo ? (
              <section
                className="overflow-hidden rounded-[20px] border border-[#E5E7EB] bg-white"
                style={{ boxShadow: '0 1px 3px 0 rgba(15,23,42,0.06)' }}
              >
                <div className="mb-4 flex items-center justify-between px-5 pt-5 sm:px-6">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#E8F5E9] text-[#2E7D32]">
                      <SparklesIcon size={16} />
                    </span>
                    <h2
                      className="font-bold tracking-[-0.01em] text-[#1F2937]"
                      style={{ fontSize: '18px', lineHeight: '26px' }}
                    >
                      Video nổi bật
                    </h2>
                  </div>
                  <StatusBadge
                    status={mapModerationBadge(featuredVideo.moderationStatus)}
                    label={MODERATION_STATUS_LABELS[featuredVideo.moderationStatus]}
                    size="sm"
                  />
                </div>

                <div className="grid grid-cols-12 gap-0">
                  <div className="col-span-12 lg:col-span-7">
                    <button
                      type="button"
                      onClick={() => onNavigate?.(`/videos/${featuredVideo.id}`)}
                      className="group relative block w-full aspect-video overflow-hidden bg-slate-900"
                    >
                      <img
                        src={featuredVideo.thumbnailUrl}
                        alt={featuredVideo.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/10 to-transparent" />
                      <span className="absolute left-4 top-4 z-10 inline-flex items-center gap-1 rounded-full bg-[#2E7D32] px-2.5 py-1 text-[11px] font-bold text-white">
                        <SparklesIcon size={11} />
                        NỔI BẬT
                      </span>
                      <span className="absolute bottom-4 right-4 z-10 inline-flex items-center gap-1 rounded-lg bg-slate-900/85 px-2.5 py-1 text-[12px] font-bold text-white backdrop-blur">
                        <ClockIcon size={12} />
                        {formatDuration(featuredVideo.durationSeconds)}
                      </span>
                      <span className="absolute inset-0 z-10 flex items-center justify-center">
                        <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white/95 shadow-2xl ring-4 ring-white/20 transition group-hover:scale-110">
                          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#2E7D32] text-white">
                            <PlayIcon size={24} className="ml-1" />
                          </span>
                        </span>
                      </span>
                    </button>
                  </div>
                  <div className="col-span-12 flex flex-col gap-4 p-5 sm:p-6 lg:col-span-5 lg:gap-5">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="inline-flex rounded-full border border-[#C8E6C9] bg-[#E8F5E9] px-2.5 py-1 text-[11px] font-semibold text-[#2E7D32]">
                        Món chính
                      </span>
                      <span className="inline-flex rounded-full border border-[#E5E7EB] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#1F2937]">
                        Công thức nhanh
                      </span>
                    </div>
                    <h3
                      className="font-extrabold tracking-tight text-[#121C2A]"
                      style={{ fontSize: '24px', lineHeight: '32px' }}
                    >
                      {featuredVideo.title}
                    </h3>
                    <p
                      className="font-normal text-[#6B7280]"
                      style={{ fontSize: '14px', lineHeight: '22px' }}
                    >
                      {featuredVideo.description.length > 200
                        ? `${featuredVideo.description.slice(0, 180)}…`
                        : featuredVideo.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="inline-flex items-center gap-2">
                        <img
                          src={featuredVideo.creatorAvatar}
                          alt={featuredVideo.creatorName}
                          className="h-8 w-8 rounded-full object-cover ring-2 ring-[#C8E6C9]"
                        />
                        <span
                          className="font-semibold text-[#1F2937]"
                          style={{ fontSize: '13px', lineHeight: '18px' }}
                        >
                          {featuredVideo.creatorName}
                        </span>
                      </div>
                      <div className="inline-flex items-center gap-1 text-[12px] font-medium text-[#6B7280]">
                        <CalendarIcon size={13} />
                        <span>
                          {new Date(featuredVideo.createdAt).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#2E7D32]">
                        <EyeIcon size={13} />
                        <span>{formatViews(featuredVideo.viewCount)} lượt xem</span>
                      </div>
                    </div>
                    <div className="mt-auto">
                      <Button
                        type="button"
                        variant="primary"
                        fullWidth
                        leftIcon={<PlayIcon size={16} />}
                        onClick={() => onNavigate?.(`/videos/${featuredVideo.id}`)}
                      >
                        Xem video
                      </Button>
                    </div>
                  </div>
                </div>
              </section>
            ) : isLoading ? (
              <div
                className="rounded-[20px] border border-[#E5E7EB] bg-white p-5"
                style={{ boxShadow: '0 1px 2px 0 rgba(15,23,42,0.04)' }}
              >
                <SkeletonLoader count={1} variant="card" />
              </div>
            ) : null}

            {/* ========= VIDEO MỚI NHẤT 3-col grid ========= */}
            <section>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#E8F5E9] text-[#2E7D32]">
                    <VideoIcon size={16} />
                  </span>
                  <h2
                    className="font-bold tracking-[-0.01em] text-[#1F2937]"
                    style={{ fontSize: '18px', lineHeight: '26px' }}
                  >
                    Video mới nhất
                  </h2>
                </div>
                <div className="inline-flex items-center gap-2 text-[12px] font-medium text-[#6B7280]">
                  <span>Sắp xếp:</span>
                  <Select
                    id="video-sort-inline"
                    value={filter.sort}
                    onChange={(e) =>
                      setFilter((prev) => ({
                        ...prev,
                        sort: e.target.value as VideoSortOption,
                      }))
                    }
                    options={browse?.sortOpts ?? []}
                    fullWidth={false}
                    className="!w-[160px]"
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonLoader key={i} count={1} variant="card" />
                  ))}
                </div>
              ) : gridList.length === 0 ? (
                <div
                  className="rounded-[20px] border border-[#E5E7EB] bg-white p-10"
                >
                  <EmptyState
                    icon={<VideoIcon size={34} className="text-[#2E7D32]" />}
                    title="Không tìm thấy video phù hợp"
                    description="Thay đổi từ khóa tìm kiếm hoặc bỏ chọn bộ lọc thể loại / thời lượng để xem nhiều kết quả hơn."
                    actionLabel="Xóa bộ lọc"
                    onAction={() => {
                      setPillKey('all')
                      setDurationFilter('all')
                      setSearchDraft('')
                      setFilter(DEFAULT_VIDEO_FILTER)
                      setPage(1)
                    }}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {gridList.map((v) => (
                    <VideoGridCard
                      key={v.id}
                      video={v}
                      categories={browse?.categories ?? []}
                      onOpen={() => onNavigate?.(`/videos/${v.id}`)}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {!isLoading && totalPages > 1 && (
                <nav
                  aria-label="Phân trang video"
                  className="mt-8 flex items-center justify-center gap-1.5"
                >
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label="Trang đầu"
                    disabled={page === 1}
                    onClick={() => setPage(1)}
                    className="!h-9 !w-9 !rounded-[10px] !p-0"
                  >
                    <ChevronFirstIcon size={16} />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label="Trang trước"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="!h-9 !w-9 !rounded-[10px] !p-0"
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const p = idx + 1
                    const active = p === page
                    if (totalPages > 7) {
                      const show =
                        p === 1 ||
                        p === totalPages ||
                        Math.abs(p - page) <= 1
                      if (!show) {
                        if (p === 2 || p === totalPages - 1) {
                          return (
                            <span
                              key={`e-${p}`}
                              className="inline-flex h-9 w-9 items-center justify-center text-[#6B7280]"
                            >
                              …
                            </span>
                          )
                        }
                        return null
                      }
                    }
                    return (
                      <Button
                        key={p}
                        type="button"
                        variant={active ? 'primary' : 'outline'}
                        size="sm"
                        aria-label={`Trang ${p}`}
                        onClick={() => setPage(p)}
                        className={`!h-9 !min-w-9 !rounded-[10px] !px-3 !text-[13px] !font-bold tabular-nums ${
                          active ? '' : 'hover:!border-[#C8E6C9] hover:!bg-[#E8F5E9]/50'
                        }`}
                      >
                        {p}
                      </Button>
                    )
                  })}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label="Trang sau"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="!h-9 !w-9 !rounded-[10px] !p-0"
                  >
                    <ChevronRight size={16} />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label="Trang cuối"
                    disabled={page === totalPages}
                    onClick={() => setPage(totalPages)}
                    className="!h-9 !w-9 !rounded-[10px] !p-0"
                  >
                    <ChevronLastIcon size={16} />
                  </Button>
                </nav>
              )}
            </section>
          </div>

          {/* ============ SIDEBAR 4/12 ============ */}
          <aside className="col-span-12 xl:col-span-4 flex flex-col gap-6">
            {/* CHỦ ĐỀ PHỔ BIẾN */}
            <div
              className="rounded-[16px] border border-[#E5E7EB] bg-white p-6"
              style={{ boxShadow: '0 1px 2px 0 rgba(15,23,42,0.04)' }}
            >
              <div className="mb-4 flex items-center gap-2">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#E8F5E9] text-[#2E7D32]">
                  <HashIcon size={18} />
                </span>
                <h3
                  className="font-semibold tracking-[-0.01em] text-[#1F2937]"
                  style={{ fontSize: '16px', lineHeight: '24px' }}
                >
                  Chủ đề phổ biến
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {(browse?.hashtagTopics ?? []).map((t) => (
                  <Button
                    key={t}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchDraft(t.replace('#', ''))
                      setFilter((prev) => ({
                        ...prev,
                        search: t.replace('#', ''),
                      }))
                      setPage(1)
                    }}
                    className="rounded-full !border !border-[#E5E7EB] !bg-[#F8FAF8] !px-2.5 !py-1.5 !text-[12px] !font-semibold !text-[#1F2937] hover:!border-[#C8E6C9] hover:!bg-[#E8F5E9] hover:!text-[#2E7D32]"
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </div>

            {/* ĐẦU BẾP NỔI BẬT */}
            <div
              className="rounded-[16px] border border-[#E5E7EB] bg-white p-6"
              style={{ boxShadow: '0 1px 2px 0 rgba(15,23,42,0.04)' }}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#E8F5E9] text-[#2E7D32]">
                    <ChefIcon size={18} />
                  </span>
                  <h3
                    className="font-semibold tracking-[-0.01em] text-[#1F2937]"
                    style={{ fontSize: '16px', lineHeight: '24px' }}
                  >
                    Đầu bếp nổi bật
                  </h3>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate?.('/videos')}
                  rightIcon={<ChevronRight size={12} />}
                  className="rounded-full !bg-[#F8FAF8] !px-2.5 !py-1 !text-[12px] !font-semibold !text-[#2E7D32] hover:!bg-[#E8F5E9]"
                >
                  Xem tất cả
                </Button>
              </div>
              <ul className="space-y-4">
                {(browse?.topChefs ?? []).map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchDraft(c.name)
                        setFilter((prev) => ({ ...prev, search: c.name }))
                        setPage(1)
                      }}
                      className="group flex w-full items-center rounded-xl p-2 text-left transition hover:bg-[#E8F5E9]/50 hover:border-[#C8E6C9] border border-transparent cursor-pointer"
                    >
                      <img
                        src={AVATAR_URL(c.avatarSeed)}
                        alt={c.name}
                        className="w-12 h-12 rounded-full object-cover shrink-0 border border-[#C8E6C9]"
                      />
                      <div className="flex-1 min-w-0 ml-3">
                        <div className="font-semibold text-sm text-[#111827] truncate group-hover:text-[#2E7D32] transition-colors">
                          {c.name}
                        </div>
                        <div className="text-xs text-[#6B7280] truncate mt-0.5">
                          {c.role}
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-[#2E7D32] shrink-0 whitespace-nowrap ml-2">
                        {c.videos} Video
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* AI ASSISTANT PANEL */}
            <div
              className="rounded-[16px] border border-[#C8E6C9] bg-[#EFFAF1] p-6"
              style={{
                boxShadow: '0 1px 3px 0 rgba(15,23,42,0.04)',
              }}
            >
              <div className="mb-3 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-[#2E7D32]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2E7D32]" />
                TRỢ LÝ DINH DƯỠNG AI
              </div>
              <h3
                className="mb-2 font-bold tracking-[-0.01em] text-[#121C2A]"
                style={{ fontSize: '18px', lineHeight: '26px' }}
              >
                Học nấu ăn cùng AI
              </h3>
              <p
                className="mb-4 font-normal text-[#1F2937]/80"
                style={{ fontSize: '13px', lineHeight: '20px' }}
              >
                Nhập các nguyên liệu bạn đang có sẵn trong tủ lạnh (rau củ, nấm, đậu hũ...), AI sẽ tìm ngay video công thức nấu phù hợp nhất!
              </p>
              <Input
                placeholder="VD: Đậu hũ, nấm rơm, cà chua..."
                value={aiIngredients}
                onChange={(e) => setAiIngredients(e.target.value)}
                className="mb-4 !bg-white !rounded-[12px]"
              />
              <Button
                type="button"
                variant="primary"
                fullWidth
                leftIcon={<SparklesIcon size={15} />}
                onClick={() => {
                  onNavigate?.(aiIngredients ? `/ai-chat?q=${encodeURIComponent(aiIngredients)}` : '/ai-chat')
                }}
                className="!rounded-[10px] !bg-[#2E7D32] hover:!bg-[#1B5E20] font-bold"
              >
                Gợi ý video công thức ngay
              </Button>
            </div>
          </aside>
        </main>
      </div>

      {/* ============= UPLOAD MODAL - GIỮ NGUYÊN ============= */}
      <UploadVideoModal
        isOpen={showUpload}
        submitting={submitting}
        onClose={() => setShowUpload(false)}
        onSubmit={handleUploadSubmit}
      />

      {/* ============= TOAST ============= */}
      {toast ? (
        <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 sm:bottom-10">
          <div className="max-w-[480px] rounded-[12px] border border-[#C8E6C9] bg-white px-4 py-3 text-[13px] font-medium text-[#1F2937] shadow-xl ring-1 ring-black/5">
            {toast}
          </div>
        </div>
      ) : null}
    </div>
  )
}

/* ============================ GRID CARD ===================================== */

function VideoGridCard({
  video,
  categories,
  onOpen,
}: {
  video: VideoItem
  categories: readonly { key: string; label: string }[]
  onOpen: () => void
}) {
  const categoryLabel = (() => {
    const fk = (CATEGORY_TO_FIGMA as Record<string, FigmaPillKey>)[video.category] ?? 'main'
    return categories.find((c) => c.key === fk)?.label ?? 'Món chính'
  })()

  return (
    <article
      className="group flex flex-col overflow-hidden rounded-[16px] border border-[#E5E7EB] bg-white transition hover:-translate-y-[1px] hover:border-[#2E7D32]/30"
      style={{ boxShadow: '0 1px 2px 0 rgba(15,23,42,0.04)' }}
    >
      <button
        type="button"
        onClick={onOpen}
        className="relative block w-full aspect-video overflow-hidden bg-slate-100"
      >
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent" />

        {/* top-left StatusBadge */}
        <span className="absolute left-3 top-3 z-10">
          <StatusBadge
            size="sm"
            status={mapModerationBadge(video.moderationStatus)}
            label={MODERATION_STATUS_LABELS[video.moderationStatus]}
            className="!bg-white/90 !backdrop-blur !text-[11px]"
          />
        </span>

        {/* top-right category pill */}
        <span className="absolute right-3 top-3 z-10 inline-flex items-center rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-[#1F2937] backdrop-blur shadow-sm">
          <UsersIcon size={10} className="mr-1 text-[#2E7D32]" />
          {categoryLabel}
        </span>

        {/* bottom-right duration badge */}
        <span className="absolute bottom-3 right-3 z-10 inline-flex items-center gap-1 rounded-lg bg-slate-900/80 px-2 py-1 text-[11px] font-extrabold tabular-nums text-white backdrop-blur">
          <ClockIcon size={11} />
          {formatDuration(video.durationSeconds)}
        </span>

        {/* overlay play center hover */}
        <span className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 shadow-xl">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2E7D32] text-white">
              <PlayIcon size={16} className="ml-0.5" />
            </span>
          </span>
        </span>
      </button>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h4
          className="line-clamp-2 font-bold tracking-tight text-[#1F2937]"
          style={{ fontSize: '15px', lineHeight: '22px' }}
          title={video.title}
        >
          {video.title}
        </h4>

        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex min-w-0 items-center gap-1.5">
            <img
              src={video.creatorAvatar}
              alt={video.creatorName}
              className="h-5 w-5 shrink-0 rounded-full object-cover ring-1 ring-[#C8E6C9]"
            />
            <span
              className="truncate font-medium text-[#6B7280]"
              style={{ fontSize: '12px', lineHeight: '16px' }}
              title={video.creatorName}
            >
              {video.creatorName}
            </span>
          </div>
          <div className="inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold text-[#2E7D32] tabular-nums">
            <EyeIcon size={12} />
            {formatViews(video.viewCount)} xem
          </div>
        </div>

        <div className="mt-auto">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            fullWidth
            leftIcon={<PlayIcon size={13} />}
            onClick={onOpen}
            className="!rounded-[8px] !bg-[#E8F5E9] !text-[#2E7D32] hover:!bg-[#2E7D32] hover:!text-white transition-colors !text-[12px] !font-semibold"
          >
            Xem video
          </Button>
        </div>

        <div className="sr-only">{formatRelativeDate(video.createdAt)}</div>
      </div>
    </article>
  )
}

export { VideoList, VideoList as VideosPage }
