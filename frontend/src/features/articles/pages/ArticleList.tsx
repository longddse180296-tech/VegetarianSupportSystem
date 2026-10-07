import React, { useEffect, useState, useMemo } from 'react'
import {
  CATEGORIES,
  TRENDING_TAGS,
  getArticles,
  getFeaturedArticle,
} from '../api/articles.api'
import type {
  ArticleCategory,
  ArticleSummary,
  PaginatedResult,
} from '../types/article.types'
import { ArticleCard } from '../components/ArticleCard'
import { ArticleSidebar } from '../components/ArticleSidebar'
import {
  ArticleCardSkeleton,
  FeaturedArticleSkeleton,
} from '../components/ArticleSkeleton'

interface ArticleListProps {
  onSelectArticle: (articleId: string) => void
  onNavigateHome?: () => void
  onOpenAiChat?: () => void
}

export const ArticleList: React.FC<ArticleListProps> = ({
  onSelectArticle,
  onNavigateHome,
  onOpenAiChat,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ArticleCategory>('all')
  const [searchKeyword, setSearchKeyword] = useState<string>('')
  const [activeKeyword, setActiveKeyword] = useState<string>('')
  const [selectedTag, setSelectedTag] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest')

  const [featuredArticle, setFeaturedArticle] = useState<ArticleSummary | null>(null)
  const [articlesData, setArticlesData] = useState<PaginatedResult<ArticleSummary> | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [loadingFeatured, setLoadingFeatured] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch Featured Article
  useEffect(() => {
    let isMounted = true
    const loadFeatured = async () => {
      try {
        setLoadingFeatured(true)
        const res = await getFeaturedArticle()
        if (isMounted) setFeaturedArticle(res)
      } catch {
        // Non-blocking error for featured article
      } finally {
        if (isMounted) setLoadingFeatured(false)
      }
    }
    loadFeatured()
    return () => {
      isMounted = false
    }
  }, [])

  // Fetch Articles List
  useEffect(() => {
    let isMounted = true
    const loadArticles = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await getArticles({
          category: selectedCategory,
          keyword: activeKeyword,
          tag: selectedTag,
          page: currentPage,
          pageSize: 6,
          sortBy,
        })
        if (isMounted) {
          setArticlesData(res)
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Không thể tải danh sách bài viết.')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    loadArticles()
    return () => {
      isMounted = false
    }
  }, [selectedCategory, activeKeyword, selectedTag, currentPage, sortBy])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    setActiveKeyword(searchKeyword)
  }

  const handleCategoryChange = (cat: ArticleCategory) => {
    setSelectedCategory(cat)
    setCurrentPage(1)
  }

  const handleResetFilters = () => {
    setSelectedCategory('all')
    setSearchKeyword('')
    setActiveKeyword('')
    setSelectedTag('')
    setCurrentPage(1)
  }

  const paginationPages = useMemo(() => {
    if (!articlesData) return []
    const total = articlesData.totalPages
    const current = articlesData.page
    const pages: (number | string)[] = []

    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= current - 1 && i <= current + 1)) {
        pages.push(i)
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...')
      }
    }
    return pages
  }, [articlesData])

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      {/* Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6">
          <button
            type="button"
            onClick={onNavigateHome}
            className="hover:text-emerald-700 transition-colors"
          >
            Trang chủ
          </button>
          <span>/</span>
          <span className="text-emerald-700 font-semibold">Bài viết</span>
        </nav>

        {/* Page Hero Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              KHO TRI THỨC DINH DƯỠNG THUẦN THỰC VẬT
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Bài viết về lối sống chay
            </h1>
            <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-2xl leading-relaxed">
              Khám phá kiến thức, kinh nghiệm và những chia sẻ hữu ích về dinh dưỡng, công thức và lối sống ăn chay khoa học, bền vững mỗi ngày.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-gray-200/80 shadow-sm text-xs font-medium text-gray-700 self-start md:self-auto">
            <span className="text-base">📗</span>
            <span>120+ Bài nghiên cứu & Chia sẻ</span>
          </div>
        </div>

        {/* Search Bar Form */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center mb-6">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Tìm kiếm bài viết, dưỡng chất (sắt, b12), kinh nghiệm..."
              className="w-full pl-11 pr-4 py-3.5 bg-white rounded-2xl border border-gray-200 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
            />
          </div>
          <button
            type="submit"
            className="ml-3 px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
          >
            <span>Tìm kiếm</span>
          </button>
        </form>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 pt-1 mb-8 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id as ArticleCategory)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                {cat.label}
              </button>
            )
          })}
        </div>

        {/* Featured Article Section (Only shown on initial page without strict search) */}
        {!activeKeyword && !selectedTag && selectedCategory === 'all' && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-emerald-700 font-bold text-lg">✦</span>
              <h2 className="text-lg font-bold text-gray-900">Bài viết nổi bật</h2>
              <span className="text-xs text-gray-500 ml-auto">Biên soạn bởi chuyên gia đầu ngành</span>
            </div>

            {loadingFeatured ? (
              <FeaturedArticleSkeleton />
            ) : featuredArticle ? (
              <div
                onClick={() => onSelectArticle(featuredArticle.id)}
                className="group grid grid-cols-1 md:grid-cols-2 gap-6 bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer"
              >
                <div className="relative aspect-[16/10] md:aspect-auto md:h-full rounded-2xl overflow-hidden bg-gray-100">
                  <img
                    src={featuredArticle.thumbnailUrl}
                    alt={featuredArticle.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100">
                      <span>⭐</span>
                      Được khuyên đọc
                    </span>
                  </div>
                </div>

                <div className="flex flex-col justify-between py-2">
                  <div>
                    <div className="flex items-center gap-3 mb-3 text-xs">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                        {featuredArticle.categoryLabel}
                      </span>
                      <span className="text-gray-500">⏱️ {featuredArticle.readTimeMinutes} phút đọc</span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 group-hover:text-emerald-700 transition-colors leading-snug mb-3">
                      {featuredArticle.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-3 leading-relaxed mb-6">
                      {featuredArticle.excerpt}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={featuredArticle.author.avatar}
                        alt={featuredArticle.author.name}
                        className="w-10 h-10 rounded-full object-cover border border-emerald-100"
                      />
                      <div className="flex flex-col text-xs">
                        <span className="font-bold text-gray-900">{featuredArticle.author.name}</span>
                        <span className="text-gray-500">{featuredArticle.author.roleTitle} • {featuredArticle.publishedAt}</span>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-semibold group-hover:bg-emerald-800 transition-colors">
                      Đọc bài viết
                      <span>→</span>
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </section>
        )}

        {/* Main Content Layout (Grid + Sidebar) */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="text-emerald-700 text-lg">📑</span>
              <h2 className="text-lg font-bold text-gray-900">
                {activeKeyword
                  ? `Kết quả tìm kiếm cho "${activeKeyword}"`
                  : selectedTag
                  ? `Bài viết gắn thẻ ${selectedTag}`
                  : 'Bài viết mới nhất'}
              </h2>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'popular')}
                className="bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="newest">Mới nhất</option>
                <option value="popular">Xem nhiều nhất</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Articles Grid (2 cols on md) */}
            <div className="lg:col-span-2 flex flex-col">
              {/* Error State */}
              {error && (
                <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center text-red-700 mb-6">
                  <p className="text-sm font-semibold mb-2">Đã xảy ra lỗi khi tải dữ liệu</p>
                  <p className="text-xs text-red-600 mb-4">{error}</p>
                  <button
                    onClick={handleResetFilters}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-medium hover:bg-red-700"
                  >
                    Thử lại
                  </button>
                </div>
              )}

              {/* Loading Skeletons */}
              {loading && !error && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <ArticleCardSkeleton key={i} />
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!loading && !error && articlesData && articlesData.items.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-3xl border border-gray-100 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-2xl text-emerald-600 mb-4">
                    🔍
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-1">
                    Không tìm thấy bài viết phù hợp
                  </h3>
                  <p className="text-xs text-gray-500 max-w-sm mb-6">
                    Không có bài viết nào khớp với từ khóa hoặc danh mục đã chọn. Hãy thử tìm bằng từ khóa khác hoặc đặt lại bộ lọc.
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors"
                  >
                    Đặt lại bộ lọc
                  </button>
                </div>
              )}

              {/* Articles Grid */}
              {!loading && !error && articlesData && articlesData.items.length > 0 && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                    {articlesData.items.map((art) => (
                      <ArticleCard
                        key={art.id}
                        article={art}
                        onSelect={onSelectArticle}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {articlesData.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-auto pt-6 border-t border-gray-100">
                      <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className="w-9 h-9 rounded-xl flex items-center justify-center border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        ‹
                      </button>

                      {paginationPages.map((page, idx) => {
                        if (typeof page === 'string') {
                          return (
                            <span key={`dots-${idx}`} className="w-9 h-9 flex items-center justify-center text-xs text-gray-400">
                              ...
                            </span>
                          )
                        }
                        const isActive = page === currentPage
                        return (
                          <button
                            key={page}
                            type="button"
                            onClick={() => setCurrentPage(page)}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-semibold transition-colors ${
                              isActive
                                ? 'bg-emerald-700 text-white shadow-sm'
                                : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      })}

                      <button
                        type="button"
                        disabled={currentPage === articlesData.totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(articlesData.totalPages, p + 1))}
                        className="w-9 h-9 rounded-xl flex items-center justify-center border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        ›
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Right Column: Sidebar Widgets */}
            <div className="lg:col-span-1">
              <ArticleSidebar
                trendingTags={TRENDING_TAGS}
                selectedTag={selectedTag}
                onSelectTag={(t) => {
                  setSelectedTag(t)
                  setCurrentPage(1)
                }}
                onOpenAiChat={onOpenAiChat}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
