import { useEffect, useState } from 'react'
import {
  Bookmark,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FileText,
  MapPin,
  Play,
  Trash2,
} from 'lucide-react'
import { EmptyState, SkeletonLoader } from '../../../shared/components'
import AlertError from '../../../shared/components/AlertError'
import { UserProfileShell } from '../../profile/components/UserProfileShell'
import {
  listFavorites,
  removeFavorite,
  type FavoriteItem,
  type FavoritePage,
  type FavoriteTargetType,
} from '../api/favoritesApi'

type FavoriteTab = 'All' | FavoriteTargetType

interface FavoritesPageProps {
  onNavigate?: (path: string) => void
}

const PAGE_SIZE = 24

const FAVORITE_TABS: Array<{ id: FavoriteTab; label: string }> = [
  { id: 'All', label: 'Tất cả' },
  { id: 'Recipe', label: 'Công thức' },
  { id: 'Article', label: 'Bài viết' },
  { id: 'Video', label: 'Video' },
  { id: 'Restaurant', label: 'Nhà hàng' },
]

const EMPTY_PAGE: FavoritePage = {
  items: [],
  totalCount: 0,
  pageNumber: 1,
  pageSize: PAGE_SIZE,
}

function typeLabel(type: FavoriteTargetType): string {
  switch (type) {
    case 'Recipe':
      return 'Công thức'
    case 'Video':
      return 'Video'
    case 'Article':
      return 'Bài viết'
    case 'Restaurant':
      return 'Nhà hàng'
  }
}

function targetPath(item: FavoriteItem): string {
  switch (item.targetType) {
    case 'Recipe':
      return `/recipes/${encodeURIComponent(item.targetId)}`
    case 'Video':
      return `/videos/${encodeURIComponent(item.targetId)}`
    case 'Article':
      return `/articles/${encodeURIComponent(item.targetId)}`
    case 'Restaurant':
      return `/restaurants/${encodeURIComponent(item.targetId)}`
  }
}

function actionLabel(type: FavoriteTargetType): string {
  switch (type) {
    case 'Recipe':
      return 'Xem công thức'
    case 'Video':
      return 'Xem video'
    case 'Article':
      return 'Đọc bài viết'
    case 'Restaurant':
      return 'Xem nhà hàng'
  }
}

function formatSavedDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Đã lưu gần đây'
  return `Đã lưu ${date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })}`
}

function FavoriteVisual({ item }: { item: FavoriteItem }) {
  const [imageFailed, setImageFailed] = useState(!item.imageUrl)
  const Icon = item.targetType === 'Recipe'
    ? BookOpen
    : item.targetType === 'Video'
      ? Play
      : item.targetType === 'Article'
        ? FileText
        : MapPin

  if (imageFailed || !item.imageUrl) {
    return (
      <div className="flex aspect-[16/10] items-center justify-center bg-gradient-to-br from-emerald-50 to-amber-50 text-emerald-700">
        <Icon size={34} aria-hidden="true" />
      </div>
    )
  }

  return (
    <img
      src={item.imageUrl}
      alt=""
      className="aspect-[16/10] w-full object-cover"
      onError={() => setImageFailed(true)}
    />
  )
}

export default function FavoritesPage({ onNavigate }: FavoritesPageProps) {
  const [activeTab, setActiveTab] = useState<FavoriteTab>('All')
  const [pageNumber, setPageNumber] = useState(1)
  const [page, setPage] = useState<FavoritePage>(EMPTY_PAGE)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [removingId, setRemovingId] = useState<string | null>(null)

  useEffect(() => {
    let isCurrent = true

    void listFavorites(
      activeTab === 'All' ? undefined : activeTab,
      pageNumber,
      PAGE_SIZE,
    )
      .then((result) => {
        if (isCurrent) setPage(result)
      })
      .catch((reason: unknown) => {
        if (isCurrent) {
          setPage(EMPTY_PAGE)
          setError(reason instanceof Error ? reason.message : 'Không thể tải danh sách đã lưu.')
        }
      })
      .finally(() => {
        if (isCurrent) setLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [activeTab, pageNumber, reloadKey])

  const selectTab = (tab: FavoriteTab) => {
    setLoading(true)
    setError(null)
    setActiveTab(tab)
    setPageNumber(1)
  }

  const reload = () => {
    setLoading(true)
    setError(null)
    setReloadKey((current) => current + 1)
  }

  const changePage = (nextPage: number) => {
    setLoading(true)
    setError(null)
    setPageNumber(nextPage)
  }

  const remove = async (item: FavoriteItem) => {
    setRemovingId(item.id)
    setError(null)
    try {
      const removed = await removeFavorite(item.id)
      if (!removed) {
        setError('Không thể bỏ lưu mục này. Vui lòng thử lại.')
        return
      }

      if (page.items.length === 1 && pageNumber > 1) {
        setLoading(true)
        setPageNumber((current) => current - 1)
      } else {
        reload()
      }
    } finally {
      setRemovingId(null)
    }
  }

  const totalPages = Math.max(1, Math.ceil(page.totalCount / PAGE_SIZE))
  const countLabel = activeTab === 'All' ? 'mục đã lưu' : `${typeLabel(activeTab).toLowerCase()} đã lưu`

  return (
    <UserProfileShell
      activeTab="favorites"
      breadcrumbs={[
        { label: 'Trang chủ', path: '/' },
        { label: 'Tài khoản', path: '/profile' },
        { label: 'Mục đã lưu' },
      ]}
      statBadge={{ count: page.totalCount, label: 'đã lưu' }}
      onNavigate={onNavigate}
    >
      <section className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-xs sm:p-7">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-700">
              <Bookmark size={20} aria-hidden="true" />
              <span className="text-xs font-bold uppercase tracking-wide">Thư viện cá nhân</span>
            </div>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Mục đã lưu
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
              Xem lại các công thức, bài viết, video và nhà hàng chay bạn đã đánh dấu để dùng sau.
            </p>
          </div>
          <button
            type="button"
            onClick={reload}
            disabled={loading}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-emerald-200 px-4 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Làm mới
          </button>
        </div>

        <div className="mt-5 overflow-x-auto pb-1" role="tablist" aria-label="Loại mục đã lưu">
          <div className="flex min-w-max gap-2">
            {FAVORITE_TABS.map((tab) => {
              const selected = tab.id === activeTab
              return (
                <button
                  key={tab.id}
                  id={`favorite-tab-${tab.id}`}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls="favorite-panel"
                  onClick={() => selectTab(tab.id)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    selected
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {error && <div className="mt-5"><AlertError title="Không thể tải mục đã lưu" message={error} /></div>}

        <div id="favorite-panel" role="tabpanel" aria-labelledby={`favorite-tab-${activeTab}`} className="mt-6">
          {loading ? (
            <SkeletonLoader count={3} variant="card" />
          ) : page.items.length === 0 ? (
            <EmptyState
              title={`Chưa có ${countLabel}`}
              description="Bạn có thể lưu công thức, bài viết, video hoặc nhà hàng để xem lại tại đây."
              actionLabel="Khám phá công thức"
              onAction={() => onNavigate?.('/recipes')}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {page.items.map((item) => (
                  <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition hover:-translate-y-0.5 hover:shadow-md">
                    <FavoriteVisual item={item} />
                    <div className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                            {typeLabel(item.targetType)}
                          </span>
                          <h2 className="mt-2 line-clamp-2 text-base font-bold leading-snug text-slate-900">
                            {item.targetName}
                          </h2>
                        </div>
                        <Bookmark className="mt-1 shrink-0 fill-amber-400 text-amber-500" size={18} aria-label="Đã lưu" />
                      </div>
                      <p className="text-xs text-slate-500">{formatSavedDate(item.createdAt)}</p>
                      <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                        <button
                          type="button"
                          onClick={() => onNavigate?.(targetPath(item))}
                          className="min-h-10 rounded-xl bg-emerald-700 px-3 text-xs font-bold text-white transition hover:bg-emerald-800"
                        >
                          {actionLabel(item.targetType)}
                        </button>
                        <button
                          type="button"
                          onClick={() => void remove(item)}
                          disabled={removingId === item.id}
                          className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl border border-rose-200 px-3 text-xs font-bold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 size={14} aria-hidden="true" />
                          {removingId === item.id ? 'Đang bỏ...' : 'Bỏ lưu'}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {totalPages > 1 && (
                <nav className="mt-6 flex flex-wrap items-center justify-center gap-3" aria-label="Phân trang mục đã lưu">
                  <button
                    type="button"
                    disabled={pageNumber <= 1 || loading}
                    onClick={() => changePage(Math.max(1, pageNumber - 1))}
                    className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft size={16} aria-hidden="true" /> Trước
                  </button>
                  <span className="text-sm font-medium text-slate-600">Trang {pageNumber}/{totalPages}</span>
                  <button
                    type="button"
                    disabled={pageNumber >= totalPages || loading}
                    onClick={() => changePage(Math.min(totalPages, pageNumber + 1))}
                    className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Sau <ChevronRight size={16} aria-hidden="true" />
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </section>
    </UserProfileShell>
  )
}
