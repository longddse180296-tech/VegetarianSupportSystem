// Chức năng: video, bản nháp và nội dung công khai. Ghép dữ liệu, thao tác và các trạng thái tải/lỗi cho màn hình.
import { useEffect, useMemo, useState } from 'react'
import {
  RotateCcw,
  Search,
  Upload,
  Video as VideoIcon,
} from 'lucide-react'
import {
  Badge,
  Button,
  EmptyState,
  Input,
  PageHeading,
  SkeletonCard,
} from '../../../shared/components'
import AlertError from '../../../shared/components/AlertError'
import { getStoredToken } from '../../../shared/api/apiClient'
import {
  listVideoCategories,
  listVideos,
  type VideoCategoryOption,
  type VideoDetails,
} from '../api/backendVideos'
import { VideoCard } from '../components/VideoCard'

// Cấu trúc Props quy định dữ liệu trao đổi trong video, bản nháp và nội dung công khai.
interface Props {
  onNavigate?: (path: string) => void
  isLoggedIn?: boolean
}

// Clean helper for removing sample seed tags
// Thực hiện bước xử lý riêng được các thành phần trong tính năng sử dụng (cleanPrefix); thuộc video, bản nháp và nội dung công khai.
function cleanPrefix(text?: string | null): string {
  if (!text) return ''
  return text.replace(/^\[Mẫu\]\s*/i, '').trim()
}

// Lấy hoặc lọc danh sách theo điều kiện và phạm vi hiện tại (VideoList); thuộc video, bản nháp và nội dung công khai.
export default function VideoList({ onNavigate }: Props) {
  // Lưu dữ liệu và trạng thái thao tác của video, bản nháp và nội dung công khai trong vòng đời màn hình.
  const [videos, setVideos] = useState<VideoDetails[]>([])
  const [categories, setCategories] = useState<VideoCategoryOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)

  // Search & Filter state (đồng bộ 100% với ArticleList)
  const [searchInput, setSearchInput] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [category, setCategory] = useState('')
  const [dietaryType, setDietaryType] = useState('')
  const [page, setPage] = useState(1)

  // Diet options with standardized labels (matching ArticleList pills)
  const DIET_PILLS = useMemo(
    () => [
      'Thuần chay (Vegan)',
      'Ăn chay có sữa (Lacto)',
      'Chay có trứng (Ovo)',
      'Trứng & Sữa (Lacto-ovo)',
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
      return categories.map((c) => ({
        id: c.id,
        label: cleanPrefix(c.name),
      }))
    }
    return fallbackCategories.filter((c) => c.id !== 'all')
  }, [categories, fallbackCategories])

  // Đồng bộ dữ liệu theo thay đổi đầu vào; hủy hoặc bỏ qua kết quả cũ khi màn hình thay đổi.
  useEffect(() => {
    let active = true
    void Promise.all([listVideos(), listVideoCategories().catch(() => [])])
      .then(([rows, categoryRows]) => {
        if (!active) return
        setVideos(rows)
        setCategories(categoryRows)
      })
      .catch((reason: unknown) => {
        if (active)
          setError(
            reason instanceof Error
              ? reason.message
              : 'Mất kết nối hoặc máy chủ phản hồi quá lâu, vui lòng thử lại.',
          )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [retry])

  // Kiểm tra dữ liệu trước khi gửi thao tác và xử lý kết quả trả về (handleSearchSubmit); thuộc video, bản nháp và nội dung công khai.
  const handleSearchSubmit = () => {
    setAppliedSearch(searchInput.trim())
    setPage(1)
  }

  const isFiltering =
    appliedSearch.trim() !== '' || category !== '' || dietaryType !== ''

  // Lấy hoặc lọc danh sách theo điều kiện và phạm vi hiện tại (handleResetFilters); thuộc video, bản nháp và nội dung công khai.
  const handleResetFilters = () => {
    setSearchInput('')
    setAppliedSearch('')
    setCategory('')
    setDietaryType('')
    setPage(1)
  }

  // Filtered videos
  const results = useMemo(() => {
    return videos
      .filter((video) => {
        if (!category) return true
        if (video.categoryId === category) return true
        const selectedPill = categoryPills.find((p) => p.id === category)
        const label = (selectedPill?.label ?? category).toLowerCase()
        const vidCatName = (
          categories.find((c) => c.id === video.categoryId)?.name ?? ''
        ).toLowerCase()
        if (vidCatName && (vidCatName.includes(label) || label.includes(vidCatName))) return true
        return `${video.title} ${video.description}`.toLowerCase().includes(label)
      })
      .filter((video) => {
        if (!dietaryType) return true
        if (!video.dietType) return false
        return (
          video.dietType === dietaryType ||
          video.dietType.toLowerCase().includes(dietaryType.toLowerCase()) ||
          dietaryType.toLowerCase().includes(video.dietType.toLowerCase())
        )
      })
      .filter((video) =>
        appliedSearch
          ? `${video.title} ${video.description}`
              .toLowerCase()
              .includes(appliedSearch.toLowerCase().trim())
          : true,
      )
      .sort(
        (a, b) =>
          new Date(b.createdAtUtc).getTime() - new Date(a.createdAtUtc).getTime(),
      )
  }, [videos, category, categoryPills, categories, dietaryType, appliedSearch])

  const PAGE_SIZE = 9
  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const visible = results.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  // Thực hiện bước xử lý riêng được các thành phần trong tính năng sử dụng (categoryName); thuộc video, bản nháp và nội dung công khai.
  const categoryName = (id: string | null) => {
    const found = categories.find((item) => item.id === id)
    return found ? cleanPrefix(found.name) : 'Video Chay'
  }

  // Active category label
  const currentCategoryLabel = useMemo(() => {
    if (!category) return null
    const found = categoryPills.find((p) => p.id === category)
    return found ? found.label : category
  }, [category, categoryPills])

  // Navigate to dedicated create page
  // Kiểm tra và tải tệp phục vụ nội dung đang chỉnh sửa (handleOpenUpload); thuộc video, bản nháp và nội dung công khai.
  const handleOpenUpload = () => {
    if (!getStoredToken()) {
      onNavigate?.('/auth/login?returnUrl=%2Fvideos%2Fcreate%3Ffrom%3Dvideos')
      return
    }
    onNavigate?.('/videos/create?from=videos')
  }

  // Hiển thị giao diện video, bản nháp và nội dung công khai từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
  return (
    <div className="ui-page-container py-8 space-y-6">
      <PageHeading
        title="Video nấu ăn chay"
        description="Kho video hướng dẫn nấu ăn chay trực quan, hấp dẫn từ cộng đồng ẩm thực chay."
        breadcrumbs={[
          { label: 'Trang chủ', onClick: () => onNavigate?.('/') },
          { label: 'Video' },
        ]}
        eyebrow={<Badge icon={<VideoIcon size={14} />}>Kho video cộng đồng</Badge>}
        actions={
          <Button
            variant="primary"
            leftIcon={<Upload size={16} />}
            onClick={handleOpenUpload}
            className="!rounded-[12px] !bg-[#2E7D32] hover:!bg-[#1B5E20] font-semibold shadow-xs"
          >
            Đăng video
          </Button>
        }
      />

      {/* ============== FILTER BAR (ĐỒNG BỘ 100% VỚI BÀI VIẾT) ============== */}
      <section className="rounded-[20px] border border-slate-200 bg-white p-5 md:p-6 shadow-xs">
        {/* Row 1: Search bar */}
        <div className="border-b border-slate-100 pb-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex-1 w-full">
              <Input
                aria-label="Tìm video"
                placeholder="Tìm kiếm video theo tiêu đề hoặc nội dung..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearchSubmit()
                }}
                leftIcon={<Search size={16} className="text-slate-400" />}
                className="!h-11 !rounded-[12px] !border-slate-300 !pl-10 !pr-4 w-full text-[14px]"
              />
            </div>
            <Button
              type="button"
              variant="primary"
              size="md"
              leftIcon={<Search size={15} />}
              onClick={handleSearchSubmit}
              className="!h-11 !rounded-[12px] !bg-[#2E7D32] hover:!bg-[#1B5E20] !px-6 whitespace-nowrap w-full md:w-auto font-semibold"
            >
              Tìm kiếm
            </Button>
            {isFiltering && (
              <Button
                type="button"
                variant="ghost"
                size="md"
                leftIcon={<RotateCcw size={14} />}
                onClick={handleResetFilters}
                className="!h-11 !rounded-[12px] !text-[#2E7D32] hover:!bg-emerald-50 !font-semibold text-[13px] whitespace-nowrap w-full md:w-auto"
              >
                Xóa bộ lọc
              </Button>
            )}
          </div>
        </div>

        {/* Row 2: Chế độ ăn chay (Diet pills) */}
        <div className="border-b border-slate-100 pt-5 pb-5 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold uppercase tracking-wider text-slate-700">
              CHẾ ĐỘ ĂN CHAY
            </span>
            <span className="text-[11.5px] text-slate-500">
              Chọn để lọc theo trường phái ăn
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setDietaryType('')
                setPage(1)
              }}
              className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-[13px] transition-all duration-150 ${
                dietaryType === ''
                  ? 'border-2 border-[#2E7D32] bg-[#2E7D32] font-bold text-white shadow-xs'
                  : 'border-2 border-slate-300 bg-white font-semibold text-slate-800 hover:border-emerald-600 hover:bg-emerald-50/60 hover:text-emerald-900'
              }`}
            >
              Tất cả
            </button>
            {DIET_PILLS.map((type) => {
              const active = dietaryType === type
              // Hiển thị giao diện video, bản nháp và nội dung công khai từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setDietaryType(active ? '' : type)
                    setPage(1)
                  }}
                  className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-[13px] transition-all duration-150 ${
                    active
                      ? 'border-2 border-[#2E7D32] bg-[#2E7D32] font-bold text-white shadow-xs'
                      : 'border-2 border-slate-300 bg-white font-semibold text-slate-800 hover:border-emerald-600 hover:bg-emerald-50/60 hover:text-emerald-900'
                  }`}
                >
                  {type}
                </button>
              )
            })}
          </div>
        </div>

        {/* Row 3: Danh mục video (Category pills) */}
        <div className="pt-5 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold uppercase tracking-wider text-slate-700">
              DANH MỤC VIDEO
            </span>
            <span className="text-[11.5px] text-slate-500">
              Phân loại theo chủ đề video
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setCategory('')
                setPage(1)
              }}
              className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-[13px] transition-all duration-150 ${
                category === ''
                  ? 'border-2 border-[#2E7D32] bg-[#2E7D32] font-bold text-white shadow-xs'
                  : 'border-2 border-slate-300 bg-white font-semibold text-slate-800 hover:border-emerald-600 hover:bg-emerald-50/60 hover:text-emerald-900'
              }`}
            >
              Tất cả
            </button>
            {categoryPills.map((item) => {
              const active = category === item.id
              // Hiển thị giao diện video, bản nháp và nội dung công khai từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setCategory(active ? '' : item.id)
                    setPage(1)
                  }}
                  className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-[13px] transition-all duration-150 ${
                    active
                      ? 'border-2 border-[#2E7D32] bg-[#2E7D32] font-bold text-white shadow-xs'
                      : 'border-2 border-slate-300 bg-white font-semibold text-slate-800 hover:border-emerald-600 hover:bg-emerald-50/60 hover:text-emerald-900'
                  }`}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Trạng thái bộ lọc đang chọn */}
        {isFiltering && (
          <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Đang lọc theo:{' '}
              {[
                appliedSearch && `"${appliedSearch}"`,
                category && `Danh mục: ${currentCategoryLabel}`,
                dietaryType && `Chế độ: ${dietaryType}`,
              ]
                .filter(Boolean)
                .join(', ')}
            </span>
            <button
              type="button"
              onClick={handleResetFilters}
              className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              Xóa tất cả bộ lọc
            </button>
          </div>
        )}
      </section>

      {/* =========================================================================
       * DANH SÁCH VIDEO (LƯỚI 3 CỘT ĐỒNG BỘ)
       * ========================================================================= */}
      <section className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <VideoIcon size={16} />
            </span>
            <h3 className="text-xl font-extrabold text-slate-900">
              {isFiltering ? 'Kết quả tìm kiếm' : 'Tất cả video'}
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-500">
              {results.length} video
            </span>
            {isFiltering && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
              >
                <RotateCcw size={13} /> Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        {loading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
            onAction={isFiltering ? handleResetFilters : undefined}
          />
        )}

        {!loading && !error && visible.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  categoryName={categoryName(video.categoryId)}
                  onNavigate={onNavigate}
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
      </section>
    </div>
  )
}
