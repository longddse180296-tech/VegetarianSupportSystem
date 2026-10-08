import React, { useEffect, useState, useMemo } from 'react'
import {
  deleteUserArticle,
  getUserArticles,
} from '../api/articles.api'
import type {
  PaginatedResult,
  UserArticleItem,
} from '../types/article.types'
import { UserProfileShell } from '../../profile/components/UserProfileShell'

interface MyArticlesPageProps {
  onNavigate: (path: string) => void
}

export const MyArticlesPage: React.FC<MyArticlesPageProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'draft'>('all')
  const [searchKeyword, setSearchKeyword] = useState<string>('')
  const [sortBy, setSortBy] = useState<'newest' | 'views'>('newest')
  const [currentPage, setCurrentPage] = useState<number>(1)

  const [articlesData, setArticlesData] = useState<PaginatedResult<UserArticleItem>>({
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: 4,
    totalPages: 1,
  })
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null)

  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    let isMounted = true
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await getUserArticles({
          statusTab: activeTab,
          keyword: searchKeyword,
          sortBy,
          page: currentPage,
          pageSize: 4,
        })
        if (isMounted) {
          setArticlesData(res)
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Lỗi khi tải danh sách bài viết')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    void fetchData()
    return () => {
      isMounted = false
    }
  }, [activeTab, searchKeyword, sortBy, currentPage, refreshTrigger])

  const handleDeleteArticle = async (id: string, title: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bài viết "${title}" không?`)) {
      return
    }
    try {
      await deleteUserArticle(id)
      setActionSuccessMsg(`Đã xóa bài viết "${title}" thành công.`)
      setTimeout(() => setActionSuccessMsg(null), 3000)
      setRefreshTrigger((prev) => prev + 1)
    } catch {
      setError('Không thể xóa bài viết. Vui lòng thử lại.')
    }
  }

  const paginationPages = useMemo(() => {
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
    <UserProfileShell
      activeTab="my-articles"
      breadcrumbs={[
        { label: 'Trang chủ', path: '/' },
        { label: 'Tài khoản', path: '/profile' },
        { label: 'Bài viết của tôi' },
      ]}
      statBadge={{ count: 12, label: 'Bài viết' }}
      onNavigate={onNavigate}
    >
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
        {/* Header Title & CTA Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Bài viết của tôi</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Quản lý, theo dõi hiệu suất và xuất bản nội dung chia sẻ cộng đồng thuần chay.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/articles/editor')}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition-colors shrink-0"
          >
            <span>+</span>
            <span>Viết bài mới</span>
          </button>
        </div>

        {/* Action message */}
        {actionSuccessMsg && (
          <div className="my-4 p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-medium border border-emerald-100 flex items-center justify-between">
            <span>✓ {actionSuccessMsg}</span>
            <button
              type="button"
              onClick={() => setActionSuccessMsg(null)}
              className="text-emerald-600 hover:text-emerald-800"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tabs Filter */}
        <div className="flex flex-wrap items-center justify-between gap-4 my-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab('all')
                setCurrentPage(1)
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'all'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Tất cả <span className="opacity-70">(12)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('published')
                setCurrentPage(1)
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'published'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Đã xuất bản <span className="opacity-70">(10)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('draft')
                setCurrentPage(1)
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'draft'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Bản nháp <span className="opacity-70">(2)</span>
            </button>
          </div>

          <div className="text-xs text-gray-500 font-medium">
            Hiển thị {articlesData.items.length > 0 ? (currentPage - 1) * 4 + 1 : 0}-
            {Math.min(currentPage * 4, articlesData.totalCount)} trên tổng số{' '}
            {articlesData.totalCount} bài
          </div>
        </div>

        {/* Search & Sort Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="sm:col-span-2 relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
              🔍
            </span>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Tìm bài viết theo tiêu đề, danh mục..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'views')}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="newest">Sắp xếp: Mới nhất</option>
              <option value="views">Sắp xếp: Lượt xem cao nhất</option>
            </select>
          </div>
        </div>

        {/* Content Section: Loading, Error, Empty, or List */}
        {loading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl border border-gray-100 bg-white animate-pulse"
              >
                <div className="w-24 h-5 bg-gray-200 rounded-full mb-3" />
                <div className="w-3/4 h-6 bg-gray-200 rounded mb-2" />
                <div className="w-full h-4 bg-gray-200 rounded mb-4" />
                <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                  <div className="w-48 h-4 bg-gray-200 rounded" />
                  <div className="w-24 h-8 bg-gray-200 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center text-red-700">
            <p className="text-xs font-semibold mb-2">Đã xảy ra lỗi</p>
            <p className="text-xs text-red-600 mb-4">{error}</p>
            <button
              onClick={() => setRefreshTrigger((prev) => prev + 1)}
              className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-medium hover:bg-red-700"
            >
              Thử lại
            </button>
          </div>
        )}

        {!loading && !error && articlesData.items.length === 0 && (
          <div className="py-16 text-center">
            <div className="text-4xl mb-3">📝</div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">
              Chưa có bài viết nào
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mb-6">
              Bạn chưa có bài viết nào ở trạng thái này. Hãy bắt đầu chia sẻ kiến thức ngay hôm nay!
            </p>
            <button
              onClick={() => onNavigate('/articles/editor')}
              className="px-5 py-2.5 bg-emerald-700 text-white rounded-xl text-xs font-semibold hover:bg-emerald-800 transition-colors"
            >
              Viết bài mới ngay
            </button>
          </div>
        )}

        {/* Article Cards List */}
        {!loading && !error && articlesData.items.length > 0 && (
          <div className="space-y-4">
            {articlesData.items.map((art) => {
              const isDraft = art.status === 'draft'

              return (
                <div
                  key={art.id}
                  className="p-5 sm:p-6 rounded-2xl border border-gray-100 hover:border-emerald-200 hover:shadow-sm transition-all bg-white flex flex-col gap-3"
                >
                  {/* Card Header Tag & Status */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100">
                        {art.categoryLabel}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-500">
                        {isDraft ? art.updatedAt : art.publishedAt}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span
                        className={`inline-flex items-center gap-1.5 font-medium ${
                          isDraft ? 'text-amber-600' : 'text-emerald-600'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isDraft ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                        />
                        {art.statusLabel}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteArticle(art.id, art.title)}
                      className="text-gray-400 hover:text-red-600 text-sm p-1 rounded-lg hover:bg-gray-50"
                      title="Xóa bài viết"
                    >
                      🗑️
                    </button>
                  </div>

                  {/* Title & Excerpt */}
                  <div>
                    <h3 className="text-base font-bold text-gray-900 hover:text-emerald-700 transition-colors cursor-pointer mb-1.5">
                      {art.title}
                    </h3>
                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                      {art.excerpt}
                    </p>
                  </div>

                  {/* Draft Progress Bar (if draft) */}
                  {isDraft && art.completionRate && (
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1.5">
                        <span className="font-medium text-amber-700">
                          ⚙️ Đang hoàn thiện – {art.completionRate}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${art.completionRate}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Footer Meta Stats & Actions */}
                  <div className="pt-3 border-t border-gray-50 flex flex-wrap items-center justify-between gap-3 text-xs">
                    {!isDraft ? (
                      <div className="flex items-center gap-4 text-gray-500">
                        <span>👁️ {art.viewsCount.toLocaleString()}</span>
                        <span>👍 {art.likesCount}</span>
                        <span>💬 {art.commentsCount}</span>
                      </div>
                    ) : (
                      <div className="text-gray-400 italic text-[11px]">
                        Bản nháp lưu tự động
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      {isDraft ? (
                        <>
                          <button
                            type="button"
                            onClick={() => onNavigate(`/articles/editor/${art.id}`)}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors"
                          >
                            <span>✏️</span>
                            <span>Tiếp tục chỉnh sửa</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteArticle(art.id, art.title)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors"
                          >
                            Xóa nháp
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => onNavigate('/articles/art-1')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors"
                          >
                            <span>👁️</span>
                            <span>Xem</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onNavigate(`/articles/editor/${art.id}`)}
                            className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 text-xs font-semibold transition-colors"
                          >
                            <span>✏️</span>
                            <span>Sửa</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Pagination Controls */}
            {articlesData.totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t border-gray-100 text-xs">
                <span className="text-gray-500">
                  Đang xem {articlesData.items.length > 0 ? (currentPage - 1) * 4 + 1 : 0} đến{' '}
                  {Math.min(currentPage * 4, articlesData.totalCount)} trong{' '}
                  {articlesData.totalCount} bài viết
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40"
                  >
                    ‹
                  </button>

                  {paginationPages.map((page, idx) => {
                    if (typeof page === 'string') {
                      return (
                        <span key={`dots-${idx}`} className="w-8 h-8 flex items-center justify-center text-gray-400">
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
                        className={`w-8 h-8 rounded-lg font-semibold transition-colors ${
                          isActive
                            ? 'bg-emerald-700 text-white'
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
                    className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40"
                  >
                    ›
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </UserProfileShell>
  )
}
