import { PageHeading, Badge, Button, Input, Select } from '../../../shared/components'
import { useState, useEffect, useMemo } from 'react'
import { Leaf, Plus, Search, Sparkles } from 'lucide-react'
import { Feedback, Pager } from '../../admin/components/ApiWorkspace'
import { useApiData } from '../../admin/hooks/useApiData'
import { getPublicFeaturedContent, type FeaturedContentItem } from '../../../shared/api/featuredContentApi'
import { primaryClass, formatDate } from '../../admin/utils/apiUi'
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

export const ArticleList = ({ onSelectArticle, onCreateArticle, onNavigateHome }: Props) => {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [dietaryType, setDietaryType] = useState<BackendDietaryType | ''>('')
  const [page, setPage] = useState(1)
  const [featuredArticles, setFeaturedArticles] = useState<FeaturedContentItem[]>([])

  useEffect(() => {
    getPublicFeaturedContent('Article')
      .then(items => {
        setFeaturedArticles(items)
      })
      .catch(() => {})
  }, [])

  const result = useApiData<ContentPage<PublicArticleSummary>>(
    `/api/articles?page=${page}&pageSize=9&search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}&dietaryType=${encodeURIComponent(dietaryType)}`,
  )

  const items = result.data?.items
  const showFeatured = page === 1 && !search.trim() && !category && !dietaryType && featuredArticles.length > 0
  const featuredIds = useMemo(() => new Set(featuredArticles.map(i => i.id)), [featuredArticles])

  const visibleArticles = useMemo(() => {
    if (!items) return []
    if (showFeatured) {
      return items.filter(a => !featuredIds.has(a.id))
    }
    return items
  }, [items, showFeatured, featuredIds])

  return (
    <div className="ui-page-container py-8 space-y-6">
      <PageHeading
        title="Bài viết về lối sống chay"
        description="Khám phá kiến thức và trải nghiệm đã được kiểm duyệt."
        breadcrumbs={[{ label: 'Trang chủ', onClick: onNavigateHome }, { label: 'Bài viết' }]}
        eyebrow={<Badge icon={<Leaf />}>Kiến thức &amp; cộng đồng</Badge>}
        actions={<Button leftIcon={<Plus size={16} />} onClick={onCreateArticle}>Viết bài</Button>}
      />

      <div className="flex flex-wrap gap-3">
        <div className="min-w-[220px] flex-1">
          <Input
            aria-label="Tìm bài viết"
            leftIcon={<Search size={16} />}
            maxLength={120}
            placeholder="Tìm tiêu đề hoặc nội dung..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <Select
          aria-label="Danh mục bài viết"
          className="min-w-[180px]"
          fullWidth={false}
          value={category}
          onChange={(e) => {
            setCategory(e.target.value)
            setPage(1)
          }}
        >
          <option value="">Tất cả danh mục</option>
          {articleCategories.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </Select>
        <Select
          aria-label="Chế độ ăn áp dụng"
          className="min-w-[180px]"
          fullWidth={false}
          value={dietaryType}
          onChange={(event) => {
            setDietaryType(event.target.value as BackendDietaryType | '')
            setPage(1)
          }}
        >
          <option value="">Tất cả chế độ ăn</option>
          {BACKEND_DIETARY_TYPES.map((type) => (
            <option key={type} value={type}>{BACKEND_DIETARY_TYPE_LABELS[type]}</option>
          ))}
        </Select>
      </div>

      <Feedback error={result.error} />
      {result.error && (
        <button className={primaryClass} onClick={result.reload}>
          Thử lại
        </button>
      )}

      {/* =========================================================================
       * 1. SECTION: BÀI VIẾT NỔI BẬT (FULL-WIDTH HERO, RỘNG BẰNG 3 BÀI VIẾT)
       * ========================================================================= */}
      {showFeatured && (
        <section className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-600" />
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Bài viết nổi bật
            </h2>
          </div>

          <div className="space-y-4">
            {featuredArticles.map((featured) => (
              <article
                key={featured.id}
                onClick={() => onSelectArticle(featured.id)}
                className="group flex flex-col md:flex-row overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs hover:shadow-md transition duration-200 cursor-pointer text-left"
              >
                <div className="relative aspect-[16/9] md:w-1/2 lg:w-7/12 shrink-0 overflow-hidden bg-slate-100">
                  {featured.imageUrl ? (
                    <img
                      src={featured.imageUrl}
                      alt={featured.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full min-h-[240px] w-full items-center justify-center bg-emerald-50 text-emerald-700">
                      <Leaf size={48} />
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col justify-between p-6 sm:p-8 space-y-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5 mb-3">
                      {featured.dietaryTypes?.map((diet) => {
                        const type = toBackendDietaryType(diet)
                        return (
                          <span key={diet} className="ui-badge ui-badge-green font-semibold">
                            {type ? BACKEND_DIETARY_TYPE_LABELS[type] : diet}
                          </span>
                        )
                      })}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug group-hover:text-emerald-700 transition">
                      {featured.title}
                    </h3>
                    <p className="mt-3 text-sm text-slate-600 line-clamp-3 leading-relaxed">
                      {featured.description || 'Khám phá bài viết chia sẻ kiến thức chuyên sâu và kinh nghiệm áp dụng lối sống ăn chay khoa học, cân bằng dinh dưỡng.'}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="font-medium text-slate-700">{featured.authorName || 'Ban biên tập'}</span>
                    <span>{formatDate(featured.publishedAt)}</span>
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
      {showFeatured && visibleArticles.length > 0 && (
        <div className="pt-2">
          <h3 className="text-lg font-bold text-slate-900">Tất cả bài viết</h3>
        </div>
      )}

      {result.loading ? (
        <p>Đang tải bài viết...</p>
      ) : visibleArticles.length ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleArticles.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectArticle(item.id)}
              className="ui-card ui-content-card overflow-hidden text-left transition-colors relative border border-slate-200 bg-white hover:border-slate-300"
            >
              {item.coverImageUrl ? (
                <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                  <img
                    src={item.coverImageUrl}
                    alt=""
                    className="h-full w-full object-cover transition duration-300 hover:scale-105"
                  />
                </div>
              ) : (
                <div className="relative h-32 bg-emerald-50 flex items-center justify-center text-emerald-700">
                  <Leaf size={36} />
                </div>
              )}
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="ui-badge ui-badge-green">
                    {item.category}
                  </span>
                </div>
                {!!item.dietaryTypes?.length && (
                  <div className="flex flex-wrap gap-1">
                    {item.dietaryTypes.map((type) => (
                      <span key={type} className="ui-badge ui-badge-green">
                        {BACKEND_DIETARY_TYPE_LABELS[type]}
                      </span>
                    ))}
                  </div>
                )}
                <h2 className="ui-card-title">
                  {item.title}
                </h2>
                <p className="text-xs text-slate-500">
                  Xuất bản {formatDate(item.publishedAt)} · Phiên bản {item.version}
                </p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        !result.error && (
          <p className="rounded-2xl border bg-white p-8 text-slate-500">
            Chưa có bài viết phù hợp.
          </p>
        )
      )}

      <Pager
        page={page}
        pageSize={9}
        total={result.data?.totalCount || 0}
        onChange={setPage}
      />
    </div>
  )
}

export default ArticleList
