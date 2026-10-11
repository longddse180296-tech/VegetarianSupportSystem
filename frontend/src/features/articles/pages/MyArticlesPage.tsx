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
import {
  Button,
  Input,
  Select,
  EmptyState,
  Modal,
} from '../../../shared/components'
import AlertError from '../../../shared/components/AlertError'

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

  // Modal delete state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)

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

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    try {
      setIsDeleting(true)
      await deleteUserArticle(deleteTarget.id)
      setActionSuccessMsg(`Đã xóa bài viết "${deleteTarget.title}" thành công.`)
      setDeleteTarget(null)
      setTimeout(() => setActionSuccessMsg(null), 3000)
      setRefreshTrigger((prev) => prev + 1)
    } catch {
      setError('Không thể xóa bài viết. Vui lòng thử lại.')
    } finally {
      setIsDeleting(false)
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
      statBadge={{ count: articlesData.totalCount, label: 'Bài viết' }}
      onNavigate={onNavigate}
    >
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        {/* Header Title & CTA Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">Bài viết của tôi</h2>
            <p className="text-xs text-slate-500 font-normal leading-normal mt-1">
              Quản lý, theo dõi hiệu suất và xuất bản nội dung chia sẻ cộng đồng thuần chay.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => onNavigate('/articles/create')}
            className="rounded-xl shadow-xs px-4"
            leftIcon={<span className="text-base font-bold leading-none">+</span>}
          >
            Viết bài mới
          </Button>
        </div>

        {/* Action message */}
        {actionSuccessMsg && (
          <div className="my-4 p-3.5 bg-[#EAF5EE] text-[#1E6531] rounded-xl text-xs font-bold border border-emerald-200/80 flex items-center justify-between">
            <span>✓ {actionSuccessMsg}</span>
            <button
              type="button"
              onClick={() => setActionSuccessMsg(null)}
              className="text-[#1E6531] hover:text-emerald-900 p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tabs Filter */}
        <div className="flex flex-wrap items-center justify-between gap-4 my-6">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => {
                setActiveTab('all')
                setCurrentPage(1)
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                activeTab === 'all'
                  ? 'border-emerald-400 bg-[#EAF5EE] text-[#1E6531] shadow-2xs'
                  : 'border-transparent text-[#1f2937] hover:bg-[#f8faf8]'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('published')
                setCurrentPage(1)
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                activeTab === 'published'
                  ? 'border-emerald-400 bg-[#EAF5EE] text-[#1E6531] shadow-2xs'
                  : 'border-transparent text-[#1f2937] hover:bg-[#f8faf8]'
              }`}
            >
              Đã xuất bản
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('draft')
                setCurrentPage(1)
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                activeTab === 'draft'
                  ? 'border-emerald-400 bg-[#EAF5EE] text-[#1E6531] shadow-2xs'
                  : 'border-transparent text-[#1f2937] hover:bg-[#f8faf8]'
              }`}
            >
              Bản nháp
            </button>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Hiển thị {articlesData.items.length > 0 ? (currentPage - 1) * 4 + 1 : 0}-
            {Math.min(currentPage * 4, articlesData.totalCount)} trên tổng số{' '}
            {articlesData.totalCount} bài
          </div>
        </div>

        {/* Search & Sort Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="sm:col-span-2">
            <Input
              type="text"
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Tìm bài viết theo tiêu đề, danh mục..."
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
              fullWidth
            />
          </div>

          <div>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'views')}
              options={[
                { value: 'newest', label: 'Sắp xếp: Mới nhất' },
                { value: 'views', label: 'Sắp xếp: Lượt xem cao nhất' },
              ]}
              fullWidth
            />
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
          <div className="mb-6">
            <AlertError
              title="Không thể tải danh sách bài viết"
              message={error}
              onRetry={() => setRefreshTrigger((prev) => prev + 1)}
            />
          </div>
        )}

        {!loading && !error && articlesData.items.length === 0 && (
          <div className="py-8">
            <EmptyState
              title="Chưa có bài viết nào"
              description="Bạn chưa có bài viết nào ở trạng thái này. Hãy bắt đầu chia sẻ kiến thức ngay hôm nay!"
              actionLabel="Viết bài mới ngay"
              onAction={() => onNavigate('/articles/create')}
            />
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
                      onClick={() => setDeleteTarget({ id: art.id, title: art.title })}
                      className="text-gray-400 hover:text-red-600 text-sm p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      title="Xóa bài viết"
                    >
                      🗑️
                    </button>
                  </div>

                  {/* Title & Excerpt */}
                  <div>
                    <h3
                      onClick={() => onNavigate(isDraft ? `/articles/editor/${art.id}` : `/articles/${art.id}`)}
                      className="text-base font-bold text-gray-900 hover:text-emerald-700 transition-colors cursor-pointer mb-1.5"
                    >
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
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => onNavigate(`/articles/editor/${art.id}`)}
                            className="rounded-xl"
                            leftIcon={<span>✏️</span>}
                          >
                            Tiếp tục chỉnh sửa
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setDeleteTarget({ id: art.id, title: art.title })}
                            className="rounded-xl"
                          >
                            Xóa nháp
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onNavigate(`/articles/${art.id}`)}
                            className="rounded-xl"
                            leftIcon={<span>👁️</span>}
                          >
                            Xem
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onNavigate(`/articles/editor/${art.id}`)}
                            className="rounded-xl"
                            leftIcon={<span>✏️</span>}
                          >
                            Sửa
                          </Button>
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
                  {Math.min(currentPage * 4, articlesData.totalCount)} trên {articlesData.totalCount} bài
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ‹
                  </button>

                  {paginationPages.map((page, idx) => {
                    if (typeof page === 'string') {
                      return (
                        <span key={idx} className="w-8 h-8 flex items-center justify-center text-gray-400">
                          ...
                        </span>
                      )
                    }
                    const isActive = page === currentPage
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg font-semibold transition-all ${
                          isActive
                            ? 'bg-emerald-700 text-white'
                            : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
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
                    className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ›
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Xác nhận xóa bài viết"
        description={`Bạn có chắc chắn muốn xóa bài viết "${deleteTarget?.title}"? Hành động này sẽ loại bỏ bài viết khỏi danh sách.`}
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              variant="outline"
              size="md"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Hủy
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={handleConfirmDelete}
              isLoading={isDeleting}
            >
              Xác nhận xóa
            </Button>
          </div>
        }
      >
        <p className="text-xs text-gray-600">
          Lưu ý: Thao tác này không thể hoàn tác. Các bình luận và tương tác liên quan đến bài viết này cũng sẽ bị gỡ bỏ.
        </p>
      </Modal>
    </UserProfileShell>
  )
}
