import { useEffect, useMemo, useState } from 'react'
import {
  ArrowUpDown,
  Flame,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  Upload,
  Video as VideoIcon,
  X,
} from 'lucide-react'
import { Button, EmptyState, SkeletonCard } from '../../../shared/components'
import AlertError from '../../../shared/components/AlertError'
import { getStoredToken } from '../../../shared/api/apiClient'
import {
  listVideoCategories,
  listVideos,
  type VideoCategoryOption,
  type VideoDetails,
} from '../api/backendVideos'
import { VideoCard } from '../components/VideoCard'

interface Props {
  onNavigate?: (path: string) => void
  isLoggedIn?: boolean
}

// Clean helper for removing sample seed tags
function cleanPrefix(text?: string | null): string {
  if (!text) return ''
  return text.replace(/^\[Mẫu\]\s*/i, '').trim()
}

export default function VideoList({ onNavigate }: Props) {
  const [videos, setVideos] = useState<VideoDetails[]>([])
  const [categories, setCategories] = useState<VideoCategoryOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [selectedDiet, setSelectedDiet] = useState('all')
  const [sort, setSort] = useState<'newest' | 'views'>('newest')
  const [page, setPage] = useState(1)
  const [isScrolled, setIsScrolled] = useState(false)

  // Track scroll position for sticky header shrinkage
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Diet options with standardized labels
  const DIET_OPTIONS = useMemo(
    () => [
      { value: 'all', label: 'Tất cả' },
      { value: 'Thuần chay (Vegan)', label: 'Thuần chay (Vegan)' },
      { value: 'Ăn chay có sữa (Lacto)', label: 'Ăn chay có sữa (Lacto)' },
      { value: 'Chay có trứng (Ovo)', label: 'Chay có trứng (Ovo)' },
      { value: 'Trứng & Sữa (Lacto-ovo)', label: 'Trứng & Sữa (Lacto-ovo)' },
    ],
    [],
  )

  const fallbackCategories = useMemo(
    () => [
      { id: 'all', label: 'Tất cả' },
      { id: 'main', label: 'Món chính' },
      { id: 'side', label: 'Món phụ' },
      { id: 'drink', label: 'Đồ uống' },
      { id: 'soup', label: 'Món nước & Súp' },
      { id: 'dessert', label: 'Tráng miệng & Ăn vặt' },
      { id: 'tips', label: 'Mẹo nhà bếp' },
    ],
    [],
  )

  const categoryPills = useMemo(() => {
    if (categories.length > 0) {
      return [
        { id: 'all', label: 'Tất cả' },
        ...categories.map((c) => ({
          id: c.id,
          label: cleanPrefix(c.name),
        })),
      ]
    }
    return fallbackCategories
  }, [categories, fallbackCategories])

  useEffect(() => {
    let active = true
    void Promise.all([listVideos(), listVideoCategories().catch(() => [])])
      .then(([rows, categoryRows]) => {
        if (!active) return
        setVideos(rows)
        setCategories(categoryRows)
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Mất kết nối hoặc máy chủ phản hồi quá lâu, vui lòng thử lại.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [retry])

  // Filtered & sorted videos
  const results = useMemo(() => {
    return videos
      .filter((video) => {
        if (category === 'all') return true
        if (video.categoryId === category) return true
        const selectedPill = categoryPills.find((p) => p.id === category)
        const label = (selectedPill?.label ?? category).toLowerCase()
        const vidCatName = (categories.find((c) => c.id === video.categoryId)?.name ?? '').toLowerCase()
        if (vidCatName && (vidCatName.includes(label) || label.includes(vidCatName))) return true
        return `${video.title} ${video.description}`.toLowerCase().includes(label)
      })
      .filter((video) => {
        if (selectedDiet === 'all') return true
        if (!video.dietType) return false
        return (
          video.dietType === selectedDiet ||
          video.dietType.toLowerCase().includes(selectedDiet.toLowerCase()) ||
          selectedDiet.toLowerCase().includes(video.dietType.toLowerCase())
        )
      })
      .filter((video) =>
        `${video.title} ${video.description}`.toLowerCase().includes(search.toLowerCase().trim()),
      )
      .sort((a, b) =>
        sort === 'views'
          ? b.viewCount - a.viewCount
          : new Date(b.createdAtUtc).getTime() - new Date(a.createdAtUtc).getTime(),
      )
  }, [videos, category, categoryPills, categories, selectedDiet, search, sort])

  // Trending / Most-viewed videos of the week for sidebar panel
  const topWeeklyVideos = useMemo(() => {
    return [...videos].sort((a, b) => b.viewCount - a.viewCount).slice(0, 4)
  }, [videos])

  const isFiltering = search.trim() !== '' || category !== 'all' || selectedDiet !== 'all'

  const handleReset = () => {
    setSearch('')
    setCategory('all')
    setSelectedDiet('all')
    setPage(1)
  }

  const pageCount = Math.max(1, Math.ceil(results.length / 8))
  const currentPage = Math.min(page, pageCount)
  const visible = results.slice((currentPage - 1) * 8, currentPage * 8)

  const categoryName = (id: string | null) => {
    const found = categories.find((item) => item.id === id)
    return found ? cleanPrefix(found.name) : 'Video Chay'
  }

  // Active category label for dynamic Breadcrumb
  const currentCategoryLabel = useMemo(() => {
    if (category === 'all') return null
    const found = categoryPills.find((p) => p.id === category)
    return found ? found.label : category
  }, [category, categoryPills])

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-slate-900">
      {/* ================= STICKY MAIN HEADER ================= */}
      <header
        className={`sticky top-0 z-30 w-full transition-all duration-300 ${
          isScrolled
            ? 'border-b border-slate-200/80 bg-white/95 py-2.5 shadow-sm backdrop-blur-md sm:py-3'
            : 'border-b border-transparent bg-transparent py-4 sm:py-6'
        }`}
      >
        <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 transition-all ${
                isScrolled ? 'h-9 w-9' : 'h-11 w-11'
              }`}
            >
              <VideoIcon size={isScrolled ? 18 : 22} />
            </span>
            <div>
              {!isScrolled && (
                <span className="hidden text-[11px] font-bold tracking-wider text-emerald-700 uppercase sm:inline-block">
                  Kho Video Cộng Đồng
                </span>
              )}
              <h1
                className={`font-extrabold text-slate-900 transition-all ${
                  isScrolled ? 'text-lg sm:text-xl' : 'text-2xl sm:text-3xl'
                }`}
              >
                Video nấu ăn chay
              </h1>
            </div>
          </div>

          {/* Primary Action Button: "Đăng video" duy nhất */}
          <Button
            variant="primary"
            size={isScrolled ? 'sm' : 'md'}
            leftIcon={<Upload size={16} />}
            onClick={() =>
              onNavigate?.(
                getStoredToken() ? '/profile/my-videos' : '/login?returnUrl=%2Fprofile%2Fmy-videos',
              )
            }
            className="!rounded-[14px] !bg-emerald-700 hover:!bg-emerald-800 shadow-sm"
          >
            Đăng video
          </Button>
        </div>
      </header>

      {/* ================= MAIN CONTAINER ================= */}
      <main className="mx-auto max-w-[1240px] px-4 py-4 sm:px-6 sm:py-6">
        {/* Dynamic Breadcrumb with category filter awareness */}
        <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-xs sm:text-sm text-slate-500">
          <button
            type="button"
            onClick={() => onNavigate?.('/')}
            className="hover:text-emerald-700 transition-colors"
          >
            Trang chủ
          </button>
          <span>›</span>
          <button
            type="button"
            onClick={() => {
              setCategory('all')
              setPage(1)
            }}
            className={`transition-colors ${
              currentCategoryLabel ? 'hover:text-emerald-700' : 'font-semibold text-slate-800'
            }`}
          >
            Video
          </button>

          {currentCategoryLabel && (
            <>
              <span>›</span>
              <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-800 border border-emerald-200/60">
                {currentCategoryLabel}
              </span>
            </>
          )}

          {selectedDiet !== 'all' && (
            <span className="text-slate-400 text-xs">
              (Chế độ: {DIET_OPTIONS.find((d) => d.value === selectedDiet)?.label || selectedDiet})
            </span>
          )}
        </nav>

        {/* ============== BỘ LỌC & TÌM KIẾM (FILTER BAR) ============== */}
        <div
          className="mb-8 rounded-[20px] border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs"
        >
          {/* Hàng 1: Ô input có icon kính lúp bên trong + Dropdown Sort có icon */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Input tìm kiếm có icon kính lúp nằm bên trong */}
            <div className="relative flex-1">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Search size={18} />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder="Tìm video nấu ăn chay theo tên món, nguyên liệu..."
                className="w-full rounded-[14px] border border-slate-300 bg-white py-2.5 pl-10 pr-9 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              {search.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('')
                    setPage(1)
                  }}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Dropdown Sắp xếp kèm Sort Icon */}
            <div className="flex items-center gap-2">
              <div className="relative inline-flex items-center">
                <span className="pointer-events-none absolute left-3 flex items-center text-slate-500">
                  <ArrowUpDown size={15} />
                </span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as 'newest' | 'views')}
                  aria-label="Sắp xếp video"
                  className="h-11 rounded-[14px] border border-slate-300 bg-white pl-9 pr-8 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="views">Xem nhiều nhất</option>
                </select>
              </div>
            </div>
          </div>

          {/* Đường line mờ giữa Search và Danh mục */}
          <div className="my-3.5 border-t border-slate-100" />

          {/* Hàng 2: DANH MỤC */}
          <div className="flex flex-col gap-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              DANH MỤC VIDEO:
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {categoryPills.map((item) => {
                const active = category === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setCategory(item.id)
                      setPage(1)
                    }}
                    className={`rounded-full px-3.5 py-1 text-xs sm:text-sm font-medium transition-all ${
                      active
                        ? 'bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7] font-semibold shadow-xs'
                        : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400'
                    }`}
                  >
                    {item.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Đường line (separator) mờ giữa dòng DANH MỤC và Chế độ ăn theo yêu cầu */}
          <div className="my-3.5 border-t border-slate-100" />

          {/* Hàng 3: CHẾ ĐỘ ĂN */}
          <div className="flex flex-col gap-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              CHẾ ĐỘ ĂN:
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {DIET_OPTIONS.map((item) => {
                const active = selectedDiet === item.value
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      setSelectedDiet(item.value)
                      setPage(1)
                    }}
                    className={`rounded-full px-3.5 py-1 text-xs sm:text-sm font-medium transition-all ${
                      active
                        ? 'bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7] font-semibold shadow-xs'
                        : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400'
                    }`}
                  >
                    {item.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* ================= 2-COLUMN LAYOUT: MAIN + SIDEBAR ================= */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* CỘT CHÍNH (8 CỘT) */}
          <div className="lg:col-span-8">
            {loading && (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            )}

            {error && (
              <AlertError
                title="Không thể tải video"
                message={error}
                onRetry={() => {
                  setLoading(true)
                  setError(null)
                  setRetry((value) => value + 1)
                }}
              />
            )}

            {!loading && !error && visible.length === 0 && (
              <EmptyState
                title={isFiltering ? 'Không tìm thấy video phù hợp' : 'Chưa có video công khai'}
                description={
                  isFiltering
                    ? 'Thử thay đổi từ khóa tìm kiếm, chế độ ăn hoặc danh mục khác.'
                    : 'Hãy quay lại khi có video được Admin duyệt.'
                }
                actionLabel={isFiltering ? 'Xóa bộ lọc' : undefined}
                onAction={isFiltering ? handleReset : undefined}
              />
            )}

            {!loading && !error && visible.length > 0 && (
              <>
                {/* Header thanh kết quả */}
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-600">
                    Tìm thấy <strong className="text-slate-900">{results.length}</strong> video
                  </p>
                  {isFiltering && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                    >
                      <RotateCcw size={13} /> Xóa bộ lọc
                    </button>
                  )}
                </div>

                {/* Video Grid:
                    Nếu chỉ có ít kết quả (<= 2 video) -> chuyển sang kích thước card lớn hơn (grid-cols-1 sm:grid-cols-2 thoáng rộng)
                    Nếu nhiều video -> grid responsive 2 cột tiêu chuẩn cho cột nội dung 8-col */}
                <div
                  className={`grid gap-6 ${
                    visible.length <= 2
                      ? 'grid-cols-1 sm:grid-cols-2'
                      : 'grid-cols-1 sm:grid-cols-2'
                  }`}
                >
                  {visible.map((video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      categoryName={categoryName(video.categoryId)}
                      onNavigate={onNavigate}
                      isLarge={visible.length <= 2}
                    />
                  ))}
                </div>

                {/* Phân trang */}
                {pageCount > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-3">
                    <Button
                      variant="outline"
                      disabled={currentPage === 1}
                      onClick={() => setPage(currentPage - 1)}
                    >
                      Trước
                    </Button>
                    <span className="text-sm font-medium text-slate-600">
                      Trang {currentPage} / {pageCount}
                    </span>
                    <Button
                      variant="outline"
                      disabled={currentPage === pageCount}
                      onClick={() => setPage(currentPage + 1)}
                    >
                      Sau
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* CỘT PHỤ BÊN PHẢI (4 CỘT): "Video xem nhiều nhất tuần" & "Chủ đề gợi ý" */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Panel 1: Video xem nhiều nhất tuần */}
            <div className="rounded-[20px] border border-slate-200/90 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                  <Flame size={18} />
                </span>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  Xem nhiều nhất tuần
                </h2>
              </div>

              <div className="mt-4 divide-y divide-slate-100">
                {topWeeklyVideos.length === 0 ? (
                  <p className="py-4 text-center text-xs text-slate-400">Đang cập nhật video...</p>
                ) : (
                  topWeeklyVideos.map((item, index) => (
                    <div
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => onNavigate?.(`/videos/${item.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') onNavigate?.(`/videos/${item.id}`)
                      }}
                      className="group flex items-start gap-3 py-3 text-left transition-colors hover:bg-slate-50/70 -mx-2 px-2 rounded-xl cursor-pointer"
                    >
                      {/* Rank badge + Mini Thumbnail */}
                      <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-lg bg-slate-900 shadow-xs">
                        {item.thumbnailUrl ? (
                          <img
                            src={item.thumbnailUrl}
                            alt={cleanPrefix(item.title)}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80'
                            }}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-800 to-slate-900 text-white">
                            <Play size={14} fill="currentColor" />
                          </div>
                        )}
                        <span className="absolute bottom-1 right-1 rounded bg-black/85 px-1 py-0.2 text-[9px] font-semibold text-white">
                          0{4 + (index % 5)}:30
                        </span>
                        <span className="absolute top-1 left-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white shadow">
                          {index + 1}
                        </span>
                      </div>

                      {/* Mini Info */}
                      <div className="flex-1 min-w-0 self-center">
                        <h3 className="line-clamp-2 text-xs font-semibold text-slate-900 transition-colors group-hover:text-emerald-700 leading-snug">
                          {cleanPrefix(item.title)}
                        </h3>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Panel 2: Chủ đề & Từ khóa tìm kiếm nhanh */}
            <div className="rounded-[20px] border border-slate-200/90 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <Sparkles size={16} />
                </span>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  Từ khóa thịnh hành
                </h2>
              </div>
              <p className="mt-2 text-xs text-slate-500">Bấm nhanh để lọc video:</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  'Đậu hũ',
                  'Nấm đùi gà',
                  'Món kho chay',
                  'Canh chua chay',
                  'Nấu nhanh 15p',
                  'Gỏi cuốn',
                  'Bún bò chay',
                ].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setSearch(tag)
                      setPage(1)
                    }}
                    className="rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
