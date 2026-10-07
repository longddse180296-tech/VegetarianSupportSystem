import React, { useEffect, useState } from 'react'
import {
  FileText,
  Eye,
  EyeOff,
  RotateCcw,
  Trash2,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react'
import { AdminLayout } from '../../../../app/layouts/AdminLayout'
import { SharedDataTable, type ColumnDef } from '../../../../shared/components/SharedDataTable'
import {
  deleteAdminArticle,
  getAdminArticles,
  getAdminArticleStats,
  toggleHideArticle,
} from '../api/adminArticlesApi'
import type {
  AdminArticleItem,
  AdminArticleStats,
} from '../types/adminArticles.types'

interface AdminArticlesPageProps {
  onNavigate?: (path: string) => void
}

export const AdminArticlesPage: React.FC<AdminArticlesPageProps> = ({
  onNavigate,
}) => {
  const [stats, setStats] = useState<AdminArticleStats | null>(null)
  const [articles, setArticles] = useState<AdminArticleItem[]>([])
  const [total, setTotal] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [currentPage, setCurrentPage] = useState<number>(1)

  const [statusTab, setStatusTab] = useState<'all' | 'published' | 'hidden'>('all')
  const [keyword, setKeyword] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'reads' | 'votes'>('newest')

  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Load stats and articles
  useEffect(() => {
    let isMounted = true
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const [statsRes, articlesRes] = await Promise.all([
          getAdminArticleStats(),
          getAdminArticles({
            status: statusTab,
            category: categoryFilter,
            keyword,
            sortBy,
            page: currentPage,
            pageSize: 6,
          }),
        ])
        if (isMounted) {
          setStats(statsRes)
          setArticles(articlesRes.items)
          setTotal(articlesRes.total)
          setTotalPages(articlesRes.totalPages)
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Lỗi khi tải danh sách bài viết')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    void fetchData()
    return () => {
      isMounted = false
    }
  }, [statusTab, categoryFilter, keyword, sortBy, currentPage, refreshTrigger])

  const handleToggleHide = async (id: string, currentStatus: string) => {
    const isNowHidden = currentStatus === 'published'
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn ${isNowHidden ? 'tạm ẩn' : 'khôi phục hiển thị'} bài viết này?`
      )
    ) {
      return
    }
    try {
      await toggleHideArticle(id)
      setActionSuccessMsg(
        `Đã ${isNowHidden ? 'tạm ẩn' : 'khôi phục'} bài viết thành công!`
      )
      setTimeout(() => setActionSuccessMsg(null), 3000)
      setRefreshTrigger((prev) => prev + 1)
    } catch {
      setError('Không thể cập nhật trạng thái bài viết.')
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn bài viết "${title}"?`)) {
      return
    }
    try {
      await deleteAdminArticle(id)
      setActionSuccessMsg(`Đã xóa bài viết "${title}" thành công.`)
      setTimeout(() => setActionSuccessMsg(null), 3000)
      setRefreshTrigger((prev) => prev + 1)
    } catch {
      setError('Không thể xóa bài viết.')
    }
  }

  const columns: ColumnDef<AdminArticleItem>[] = [
    {
      key: 'title',
      header: 'BÀI VIẾT',
      render: (item) => (
        <div className="flex items-center gap-3.5 max-w-sm">
          <div className="w-16 h-12 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0 overflow-hidden">
            <span className="text-xl opacity-40">📄</span>
          </div>
          <div className="min-w-0">
            <h4
              onClick={() => onNavigate?.('/articles/art-1')}
              className="font-bold text-gray-900 line-clamp-2 hover:text-emerald-700 cursor-pointer leading-snug"
            >
              {item.title}
            </h4>
            <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-1">
              <span>{item.wordCount.toLocaleString()} từ</span>
              <span>•</span>
              <span>⏱️ {item.readTimeMinutes} phút đọc</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'authorName',
      header: 'TÁC GIẢ',
      render: (item) => (
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
              item.authorColorClass || 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {item.authorInitials}
          </div>
          <span className="font-semibold text-gray-800 text-xs whitespace-nowrap">
            {item.authorName}
          </span>
        </div>
      ),
    },
    {
      key: 'categoryLabel',
      header: 'DANH MỤC',
      render: (item) => (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-100 whitespace-nowrap">
          {item.categoryLabel}
        </span>
      ),
    },
    {
      key: 'publishedAt',
      header: 'NGÀY ĐĂNG',
      render: (item) => (
        <span className="text-gray-500 text-xs whitespace-nowrap">
          {item.publishedAt}
        </span>
      ),
    },
    {
      key: 'readCount',
      header: 'LƯỢT ĐỌC',
      align: 'right',
      render: (item) => (
        <span className="font-bold text-gray-900 text-xs font-mono">
          {item.readCount.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'voteCount',
      header: 'VOTE',
      align: 'center',
      render: (item) => (
        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 text-xs">
          <span>👍</span> {item.voteCount}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'TRẠNG THÁI',
      render: (item) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${
            item.status === 'published'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
              : 'bg-rose-50 text-rose-700 border border-rose-100'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              item.status === 'published' ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
          />
          {item.statusLabel}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'THAO TÁC',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => onNavigate?.('/articles/art-1')}
            className="p-1.5 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
            title="Xem bài viết"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => void handleToggleHide(item.id, item.status)}
            className="p-1.5 text-gray-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
            title={item.status === 'published' ? 'Ẩn bài viết' : 'Khôi phục hiển thị'}
          >
            {item.status === 'published' ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <RotateCcw className="w-4 h-4 text-emerald-600" />
            )}
          </button>
          <button
            type="button"
            onClick={() => void handleDelete(item.id, item.title)}
            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Xóa bài viết"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <AdminLayout
      activeMenu="articles"
      pageTitle="Quản lý Bài viết"
      pageSubtitle="Xem và quản lý các bài viết chia sẻ kiến thức dinh dưỡng và phong cách sống chay trên hệ thống."
      onNavigate={onNavigate}
    >
      <div className="space-y-6 pb-12">
        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 -mt-2">
          <div className="text-xs text-gray-500 font-medium">
            Kênh nội dung cẩm nang cộng đồng
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setRefreshTrigger((prev) => prev + 1)}
              className="px-3.5 py-2 rounded-2xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Làm mới</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.('/articles/editor')}
              className="px-4 py-2 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Viết bài mới</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {actionSuccessMsg && (
          <div className="p-3.5 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs font-medium flex items-center justify-between">
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

        {/* 3 Top Stat Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1 */}
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-500 font-medium block">
                  Tổng bài viết trên hệ thống
                </span>
                <span className="text-2xl font-black text-gray-900 mt-1 block">
                  {stats.totalCount} <span className="text-xs font-normal text-gray-400">bài đã tạo</span>
                </span>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-100">
                  {stats.monthlyGrowthText}
                </span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-500 font-medium block">
                  Bài viết đang hiển thị
                </span>
                <span className="text-2xl font-black text-gray-900 mt-1 block">
                  {stats.publishedCount} <span className="text-xs font-normal text-gray-400">xuất bản công khai</span>
                </span>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center">
                  <Eye className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-100">
                  {stats.activeRateText}
                </span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-500 font-medium block">
                  Bài viết đã ẩn / gỡ
                </span>
                <span className="text-2xl font-black text-rose-700 mt-1 block">
                  {stats.hiddenCount} <span className="text-xs font-normal text-gray-400">tạm dừng lưu hành</span>
                </span>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center">
                  <EyeOff className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100">
                  Cần kiểm duyệt
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Filter Controls Bar */}
        <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Tìm kiếm theo tiêu đề bài viết..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => {
                  setStatusTab('all')
                  setCurrentPage(1)
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusTab === 'all'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Tất cả (64)
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusTab('published')
                  setCurrentPage(1)
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusTab === 'published'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Đang hiển thị (58)
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusTab('hidden')
                  setCurrentPage(1)
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusTab === 'hidden'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Đã ẩn / gỡ (6)
              </button>
            </div>
          </div>

          {/* Select Dropdowns */}
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">Tất cả danh mục</option>
              <option value="nutrition">Dinh dưỡng</option>
              <option value="cooking-tips">Mẹo nấu ăn</option>
              <option value="lifestyle">Lối sống chay</option>
              <option value="ingredients">Nguyên liệu</option>
              <option value="health">Sức khỏe</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'reads' | 'votes')}
              className="px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="newest">Mới nhất</option>
              <option value="reads">Lượt đọc nhiều nhất</option>
              <option value="votes">Bình chọn nhiều nhất</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <SharedDataTable<AdminArticleItem>
          title="Danh sách bài viết"
          totalCountBadge={`${total} bài viết`}
          updatedAtText="Cập nhật lúc 15:30 hôm nay"
          columns={columns}
          data={articles}
          keyExtractor={(item) => item.id}
          isLoading={loading}
          error={error}
          onRetry={() => setRefreshTrigger((prev) => prev + 1)}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={total}
          pageSize={6}
          onPageChange={setCurrentPage}
        />
      </div>
    </AdminLayout>
  )
}
