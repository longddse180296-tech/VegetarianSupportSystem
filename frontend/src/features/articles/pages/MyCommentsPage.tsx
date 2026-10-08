import React, { useEffect, useState, useMemo } from 'react'
import {
  deleteUserComment,
  getUserComments,
  updateUserComment,
} from '../api/articles.api'
import type {
  PaginatedResult,
  UserCommentItem,
  UserCommentSourceType,
} from '../types/article.types'
import { UserProfileShell } from '../../profile/components/UserProfileShell'

interface MyCommentsPageProps {
  onNavigate: (path: string) => void
}

export const MyCommentsPage: React.FC<MyCommentsPageProps> = ({ onNavigate }) => {
  const [selectedSource, setSelectedSource] = useState<UserCommentSourceType>('all')
  const [searchKeyword, setSearchKeyword] = useState<string>('')
  const [sortBy, setSortBy] = useState<'newest' | 'likes'>('newest')
  const [currentPage, setCurrentPage] = useState<number>(1)

  const [commentsData, setCommentsData] = useState<PaginatedResult<UserCommentItem>>({
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

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState<string>('')

  useEffect(() => {
    let isMounted = true
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await getUserComments({
          sourceType: selectedSource,
          keyword: searchKeyword,
          sortBy,
          page: currentPage,
          pageSize: 4,
        })
        if (isMounted) {
          setCommentsData(res)
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Lỗi khi tải lịch sử bình luận')
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
  }, [selectedSource, searchKeyword, sortBy, currentPage, refreshTrigger])

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bình luận này không?')) return
    try {
      await deleteUserComment(id)
      setActionSuccessMsg('Đã xóa bình luận thành công.')
      setTimeout(() => setActionSuccessMsg(null), 3000)
      setRefreshTrigger((prev) => prev + 1)
    } catch {
      setError('Không thể xóa bình luận.')
    }
  }

  const handleStartEdit = (comment: UserCommentItem) => {
    setEditingId(comment.id)
    setEditContent(comment.content.replace(/^“|”$/g, ''))
  }

  const handleSaveEdit = async (id: string) => {
    if (!editContent.trim()) return
    try {
      await updateUserComment(id, `“${editContent.trim()}”`)
      setEditingId(null)
      setActionSuccessMsg('Cập nhật bình luận thành công.')
      setTimeout(() => setActionSuccessMsg(null), 3000)
      setRefreshTrigger((prev) => prev + 1)
    } catch {
      setError('Không thể cập nhật bình luận.')
    }
  }

  const paginationPages = useMemo(() => {
    const total = commentsData.totalPages
    const current = commentsData.page
    const pages: (number | string)[] = []
    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= current - 1 && i <= current + 1)) {
        pages.push(i)
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...')
      }
    }
    return pages
  }, [commentsData])

  return (
    <UserProfileShell
      activeTab="my-comments"
      breadcrumbs={[
        { label: 'Trang chủ', path: '/' },
        { label: 'Tài khoản', path: '/profile' },
        { label: 'Bình luận của tôi' },
      ]}
      statBadge={{ count: 34, label: 'Bình luận' }}
      onNavigate={onNavigate}
    >
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Lịch sử bình luận</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Tổng cộng 34 bình luận trên các công thức món, cẩm nang sức khỏe và video chia sẻ.
            </p>
          </div>
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'likes')}
              className="px-3.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="newest">Sắp xếp: Mới nhất trước</option>
              <option value="likes">Sắp xếp: Lượt thích nhiều nhất</option>
            </select>
          </div>
        </div>

        {/* Action feedback */}
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

        {/* Source Tabs & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 my-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => {
                setSelectedSource('all')
                setCurrentPage(1)
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedSource === 'all'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Tất cả (34)
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedSource('recipe')
                setCurrentPage(1)
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedSource === 'recipe'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Trên Công thức (16)
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedSource('article')
                setCurrentPage(1)
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedSource === 'article'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Trên Bài viết (12)
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedSource('video')
                setCurrentPage(1)
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedSource === 'video'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Trên Video (6)
            </button>
          </div>

          <div className="relative w-full md:w-64">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              🔍
            </span>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Tìm nội dung bình luận..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl border border-gray-100 bg-white animate-pulse"
              >
                <div className="w-28 h-5 bg-gray-200 rounded-full mb-3" />
                <div className="w-full h-10 bg-gray-100 rounded-xl mb-3" />
                <div className="w-3/4 h-4 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
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

        {/* Empty State */}
        {!loading && !error && commentsData.items.length === 0 && (
          <div className="py-16 text-center">
            <div className="text-4xl mb-3">💬</div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">
              Chưa có bình luận nào
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Không tìm thấy bình luận nào trong danh mục này.
            </p>
          </div>
        )}

        {/* Comments List */}
        {!loading && !error && commentsData.items.length > 0 && (
          <div className="space-y-4">
            {commentsData.items.map((comm) => {
              const badgeColor =
                comm.sourceType === 'recipe'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                  : comm.sourceType === 'article'
                  ? 'bg-teal-50 text-teal-800 border-teal-100'
                  : 'bg-indigo-50 text-indigo-800 border-indigo-100'

              const isEditing = editingId === comm.id

              return (
                <div
                  key={comm.id}
                  className="p-5 sm:p-6 rounded-2xl border border-gray-100 hover:border-emerald-200 hover:shadow-sm transition-all bg-white flex flex-col gap-3"
                >
                  {/* Meta Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badgeColor}`}
                      >
                        {comm.sourceLabel}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-500">{comm.createdAt}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-emerald-600 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Đang hiển thị
                      </span>
                    </div>

                    <div className="text-xs text-gray-500 font-medium">
                      👍 {comm.likesCount} lượt thích
                    </div>
                  </div>

                  {/* Context Box (Target Reference) */}
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
                    {comm.targetThumbnail && (
                      <img
                        src={comm.targetThumbnail}
                        alt={comm.targetTitle}
                        className="w-10 h-10 rounded-lg object-cover shrink-0"
                      />
                    )}
                    <div className="flex flex-col text-xs">
                      <span className="text-gray-500 text-[11px]">
                        {comm.targetTypePrefix}
                      </span>
                      <span className="font-bold text-gray-900 line-clamp-1">
                        {comm.targetTitle}
                      </span>
                    </div>
                  </div>

                  {/* Comment Content / Edit Mode */}
                  {isEditing ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        rows={2}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full p-3 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void handleSaveEdit(comm.id)}
                          className="px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-semibold hover:bg-emerald-800"
                        >
                          Lưu thay đổi
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed italic bg-emerald-50/20 p-3 rounded-xl border border-emerald-50">
                      {comm.content}
                    </p>
                  )}

                  {/* Author Reply (if present) */}
                  {comm.authorReply && (
                    <div className="ml-4 p-3.5 bg-emerald-50/50 rounded-xl border-l-4 border-emerald-600 text-xs flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-900">
                          {comm.authorReply.authorName}
                        </span>
                        {comm.authorReply.roleBadge && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200/80 text-emerald-900">
                            {comm.authorReply.roleBadge}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400 ml-auto">
                          {comm.authorReply.createdAt}
                        </span>
                      </div>
                      <p className="text-emerald-950 leading-relaxed">
                        {comm.authorReply.content}
                      </p>
                    </div>
                  )}

                  {/* Footer Actions */}
                  <div className="pt-2 border-t border-gray-50 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(comm)}
                        className="text-gray-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1"
                      >
                        <span>✏️ Sửa bình luận</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(comm.id)}
                        className="text-red-500 hover:text-red-700 font-medium inline-flex items-center gap-1"
                      >
                        <span>🗑️ Xóa</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onNavigate('/articles/art-1')}
                      className="text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center gap-1"
                    >
                      {comm.sourceType === 'video' ? 'Xem video →' : 'Xem bài gốc →'}
                    </button>
                  </div>
                </div>
              )
            })}

            {/* Pagination Controls */}
            {commentsData.totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t border-gray-100 text-xs">
                <span className="text-gray-500">
                  Hiển thị {(currentPage - 1) * 4 + 1}-
                  {Math.min(currentPage * 4, commentsData.totalCount)} của{' '}
                  {commentsData.totalCount} bình luận
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
                    disabled={currentPage === commentsData.totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(commentsData.totalPages, p + 1))}
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
