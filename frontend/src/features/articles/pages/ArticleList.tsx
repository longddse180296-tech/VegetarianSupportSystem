import { PageHeading, Badge, Button, Input, EmptyState, SkeletonCard } from '../../../shared/components'
import { useState, useEffect, useMemo } from 'react'
import { ArrowRight, BookOpen, Calendar, Leaf, Plus, RotateCcw, Search, Sparkles } from 'lucide-react'
import { Feedback, Pager } from '../../admin/components/ApiWorkspace'
import { useApiData } from '../../admin/hooks/useApiData'
import { getPublicFeaturedContent, type FeaturedContentItem } from '../../../shared/api/featuredContentApi'
import { primaryClass } from '../../admin/utils/apiUi'
import {
  articleCategories,
  type ContentPage,
  type PublicArticleSummary,
} from '../api/articles.api'
import {
  BACKEND_DIETARY_TYPE_LABELS,
  BACKEND_DIETARY_TYPES,
  toBackendDietaryType,
  type BackendDietaryType,
} from '../../../shared/constants'

interface Props {
  onSelectArticle: (id: string) => void
  onCreateArticle?: () => void
  onNavigateHome?: () => void
  onOpenAiChat?: () => void
}

function formatArticleDate(dateStr?: string | null): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return dateStr || ''
  }
}

export const ArticleList = ({ onSelectArticle, onCreateArticle, onNavigateHome }: Props) => {
  const [searchInput, setSearchInput] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [category, setCategory] = useState('')
  const [dietaryType, setDietaryType] = useState<BackendDietaryType | ''>('')
  const [page, setPage] = useState(1)
  const [featuredArticles, setFeaturedArticles] = useState<FeaturedContentItem[]>([])

  useEffect(() => {
    getPublicFeaturedContent('Article')
      .then((items) => {
        setFeaturedArticles(items)
      })
      .catch(() => {})
  }, [])

  const handleSearchSubmit = () => {
    setAppliedSearch(searchInput.trim())
    setPage(1)
  }

  const handleResetFilters = () => {
    setSearchInput('')
    setAppliedSearch('')
    setCategory('')
    setDietaryType('')
    setPage(1)
  }

  const isFiltering = Boolean(appliedSearch || category || dietaryType)

  const result = useApiData<ContentPage<PublicArticleSummary>>(
    `/api/articles?page=${page}&pageSize=9&search=${encodeURIComponent(appliedSearch)}&category=${encodeURIComponent(category)}&dietaryType=${encodeURIComponent(dietaryType)}`,
  )

  const items = result.data?.items
  const showFeatured = !isFiltering && featuredArticles.length > 0
  const featuredIds = useMemo(() => new Set(featuredArticles.map((i) => i.id)), [featuredArticles])

  const visibleArticles = useMemo(() => {
    if (!items) return []
    if (showFeatured) {
      return items.filter((a) => !featuredIds.has(a.id))
    }
    return items
  }, [items, showFeatured, featuredIds])

  return (
    <div className="ui-page-container py-8 space-y-6">
      {/* ============== HEADER ============== */}
      <PageHeading
        title="Bài viết về lối sống chay"
        description="Khám phá kiến thức, cẩm nang dinh dưỡng thực vật khoa học và câu chuyện truyền cảm hứng từ cộng đồng."
        breadcrumbs={[{ label: 'Trang chủ', onClick: onNavigateHome }, { label: 'Bài viết' }]}
        eyebrow={<Badge icon={<Leaf size={14} />}>Kiến thức &amp; cộng đồng</Badge>}
        actions={
          onCreateArticle ? (
            <Button
              leftIcon={<Plus size={16} />}
              onClick={onCreateArticle}
              variant="primary"
              className="!rounded-[12px] !bg-[#2E7D32] hover:!bg-[#1B5E20] font-semibold shadow-xs"
            >
              Viết bài mới
            </Button>
          ) : undefined
        }
      />

      {/* ============== FILTER BAR (ĐỒNG BỘ THIẾT KẾ PILL CHUẨN) ============== */}
      <section className="rounded-[20px] border border-slate-200 bg-white p-5 md:p-6 shadow-xs">
        {/* Row 1: Search bar */}
        <div className="border-b border-slate-100 pb-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex-1 w-full">
              <Input
                aria-label="Tìm bài viết"
                placeholder="Tìm kiếm bài viết theo tiêu đề hoặc nội dung..."
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
            {BACKEND_DIETARY_TYPES.map((type) => {
              const active = dietaryType === type
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
                  {BACKEND_DIETARY_TYPE_LABELS[type]}
                </button>
              )
            })}
          </div>
        </div>

        {/* Row 3: Danh mục bài viết (Category pills) */}
        <div className="pt-5 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold uppercase tracking-wider text-slate-700">
              DANH MỤC BÀI VIẾT
            </span>
            <span className="text-[11.5px] text-slate-500">
              Phân loại theo chủ đề bài viết
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
            {articleCategories.map((item) => {
              const active = category === item
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setCategory(active ? '' : item)
                    setPage(1)
                  }}
                  className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-[13px] transition-all duration-150 ${
                    active
                      ? 'border-2 border-[#2E7D32] bg-[#2E7D32] font-bold text-white shadow-xs'
                      : 'border-2 border-slate-300 bg-white font-semibold text-slate-800 hover:border-emerald-600 hover:bg-emerald-50/60 hover:text-emerald-900'
                  }`}
                >
                  {item}
                </button>
              )
            })}
          </div>
        </div>

        {/* Active Filter Badges Status */}
        {isFiltering && (
          <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Đang lọc theo:{' '}
              {[
                appliedSearch && `"${appliedSearch}"`,
                category && `Chủ đề: ${category}`,
                dietaryType && `Chế độ: ${BACKEND_DIETARY_TYPE_LABELS[dietaryType]}`,
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

      <Feedback error={result.error} />
      {result.error && (
        <button className={primaryClass} onClick={result.reload}>
          Thử lại
        </button>
      )}

      {/* =========================================================================
       * 1. SECTION: BÀI VIẾT NỔI BẬT (FULL-WIDTH ROWS)
       * ========================================================================= */}
      {showFeatured && featuredArticles.length > 0 && (
        <section className="space-y-4 pt-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
              <Sparkles size={16} />
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Bài viết nổi bật
            </h2>
          </div>

          <div className="flex flex-col gap-5">
            {featuredArticles.slice(0, 3).map((featured) => (
              <article
                key={featured.id}
                onClick={() => onSelectArticle(featured.id)}
                className="group relative flex flex-col lg:flex-row overflow-hidden rounded-[24px] border border-emerald-200/90 bg-white p-5 sm:p-6 shadow-xs hover:shadow-lg hover:border-emerald-400 transition-all duration-300 cursor-pointer text-left gap-6 w-full"
              >
                {/* Left: Aspect 16/10 Image */}
                <div className="relative aspect-[16/10] w-full lg:w-[420px] shrink-0 overflow-hidden rounded-[18px] bg-slate-100 shadow-xs">
                  {featured.imageUrl ? (
                    <img
                      src={featured.imageUrl}
                      alt={featured.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full min-h-[200px] w-full items-center justify-center bg-emerald-50 text-emerald-700">
                      <Leaf size={48} />
                    </div>
                  )}
                  <span className="absolute left-3.5 top-3.5 rounded-full bg-[#2E7D32] px-3 py-1 text-[11px] font-bold text-white shadow-sm flex items-center gap-1.5">
                    <Sparkles size={12} /> Nổi bật
                  </span>
                </div>

                {/* Right: Content details */}
                <div className="space-y-3.5 flex-1 flex flex-col justify-between py-1">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2.5">
                      {featured.dietaryTypes?.map((diet) => {
                        const type = toBackendDietaryType(diet)
                        return (
                          <span
                            key={diet}
                            className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-0.5 text-[11px] font-bold text-emerald-800"
                          >
                            {type ? BACKEND_DIETARY_TYPE_LABELS[type] : diet}
                          </span>
                        )
                      })}
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                        <Calendar size={13} />
                        {formatArticleDate(featured.publishedAt)}
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug group-hover:text-[#2E7D32] transition">
                      {featured.title}
                    </h3>

                    <p className="mt-2.5 text-sm sm:text-base text-slate-600 line-clamp-2 sm:line-clamp-3 leading-relaxed">
                      {featured.description ||
                        'Khám phá kiến thức chuyên sâu và kinh nghiệm áp dụng lối sống ăn chay khoa học, cân bằng dinh dưỡng.'}
                    </p>
                  </div>

                  <div className="pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                    <div className="flex items-center gap-2 font-semibold text-slate-700">
                      <span>Tác giả:</span>
                      <span className="text-slate-900 font-bold">{featured.authorName || 'Ban biên tập'}</span>
                    </div>

                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 text-[#2E7D32] font-bold text-xs sm:text-sm group-hover:bg-[#2E7D32] group-hover:text-white transition-all shadow-2xs">
                      <span>Đọc tiếp</span>
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* =========================================================================
       * 2. SECTION: TẤT CẢ BÀI VIẾT (LƯỚI 3 CỘT)
       * ========================================================================= */}
      <section className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <BookOpen size={16} />
            </span>
            <h3 className="text-xl font-extrabold text-slate-900">
              {isFiltering ? 'Kết quả tìm kiếm' : 'Tất cả bài viết'}
            </h3>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
            {result.data?.totalCount ?? visibleArticles.length} bài viết
          </span>
        </div>

        {result.loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : visibleArticles.length ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleArticles.map((item) => (
              <article
                key={item.id}
                onClick={() => onSelectArticle(item.id)}
                className="group flex flex-col rounded-[20px] border border-slate-200 bg-white overflow-hidden shadow-xs hover:shadow-lg hover:border-emerald-400 transition-all duration-300 cursor-pointer text-left hover:-translate-y-1"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                  {item.coverImageUrl ? (
                    <img
                      src={item.coverImageUrl}
                      alt={item.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600">
                      <Leaf size={36} />
                    </div>
                  )}
                  {item.category && (
                    <span className="absolute left-3.5 top-3.5 rounded-full bg-white/95 backdrop-blur-md px-3 py-1 text-[11.5px] font-bold text-emerald-800 shadow-sm border border-emerald-100/80">
                      {item.category}
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col justify-between p-5 space-y-3.5">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5 min-h-[26px] mb-2.5">
                      {item.dietaryTypes?.map((type) => (
                        <span
                          key={type}
                          className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800"
                        >
                          {BACKEND_DIETARY_TYPE_LABELS[type]}
                        </span>
                      ))}
                    </div>

                    <h3 className="text-[16.5px] font-bold text-slate-900 line-clamp-2 min-h-[46px] leading-snug group-hover:text-[#2E7D32] transition-colors">
                      {item.title}
                    </h3>
                  </div>

                  <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-slate-400" />
                      <span>{formatArticleDate(item.publishedAt)}</span>
                    </span>
                    <span className="font-bold text-[#2E7D32] group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      Đọc tiếp <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          !result.error && (
            <EmptyState
              title="Chưa tìm thấy bài viết phù hợp"
              description="Hãy thử từ khóa khác, hoặc nới lỏng bộ lọc theo danh mục và chế độ ăn."
              actionLabel="Xóa bộ lọc"
              onAction={handleResetFilters}
              icon={<BookOpen size={40} className="text-emerald-600" />}
            />
          )
        )}

        {result.data && result.data.totalCount > 9 && (
          <div className="pt-6 flex justify-center">
            <Pager
              page={page}
              pageSize={9}
              total={result.data?.totalCount || 0}
              onChange={setPage}
            />
          </div>
        )}
      </section>
    </div>
  )
}

export default ArticleList
