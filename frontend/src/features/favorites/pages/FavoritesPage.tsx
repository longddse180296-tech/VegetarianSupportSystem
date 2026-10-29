// Chức năng: danh sách nội dung yêu thích. Ghép dữ liệu, thao tác và các trạng thái tải/lỗi cho màn hình.
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
import { formatVideoDuration } from '../../videos/utils/videoMetadata'
import {
  listFavorites,
  removeFavorite,
  type FavoriteItem,
  type FavoritePage,
  type FavoriteTargetType,
} from '../api/favoritesApi'

// Cấu trúc FavoriteTab quy định dữ liệu trao đổi trong danh sách nội dung yêu thích.
type FavoriteTab = 'All' | FavoriteTargetType

// Cấu trúc FavoritesPageProps quy định dữ liệu trao đổi trong danh sách nội dung yêu thích.
interface FavoritesPageProps {
  onNavigate?: (path: string) => void
  initialType?: FavoriteTargetType
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

// Thực hiện bước xử lý riêng được các thành phần trong tính năng sử dụng (typeLabel); thuộc danh sách nội dung yêu thích.
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

// Đọc dữ liệu cần thiết và trả kết quả cho bước xử lý tiếp theo (targetPath); thuộc danh sách nội dung yêu thích.
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

// Thực hiện bước xử lý riêng được các thành phần trong tính năng sử dụng (actionLabel); thuộc danh sách nội dung yêu thích.
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

// Ghi nhận thay đổi dữ liệu và cập nhật kết quả cho bên gọi (formatSavedDate); thuộc danh sách nội dung yêu thích.
function formatSavedDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Đã lưu gần đây'
  return `Đã lưu ${date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })}`
}

// Thành phần FavoriteVisual nhận dữ liệu đầu vào và hiển thị phần giao diện thuộc danh sách nội dung yêu thích.
function FavoriteVisual({ item }: { item: FavoriteItem }) {
  // Lưu dữ liệu và trạng thái thao tác của danh sách nội dung yêu thích trong vòng đời màn hình.
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const duration = item.targetType === 'Video' ? formatVideoDuration(item.durationSeconds) : null
  const Icon = item.targetType === 'Recipe'
    ? BookOpen
    : item.targetType === 'Video'
      ? Play
      : item.targetType === 'Article'
        ? FileText
        : MapPin

  // Khung ảnh cố định cho mọi loại nội dung; không tạo thời lượng giả nếu chưa có metadata.
  return <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden">
    {failedUrl === item.imageUrl || !item.imageUrl ? (
      <div className="flex h-full items-center justify-center bg-gradient-to-br from-emerald-50 to-amber-50 text-emerald-700">
        <Icon size={34} aria-hidden="true" />
      </div>
    ) : (
    <img
      src={item.imageUrl}
      alt=""
      className="h-full w-full object-cover"
      loading="lazy"
      onError={() => setFailedUrl(item.imageUrl)}
    />
    )}
    {item.targetType === 'Video' && <span className="absolute bottom-2 right-2 rounded-md bg-black/75 px-2 py-1 text-xs font-semibold text-white">
      {duration || 'Chưa có thời lượng'}
    </span>}
  </div>
}

// Lấy hoặc lọc danh sách theo điều kiện và phạm vi hiện tại (FavoritesPage); thuộc danh sách nội dung yêu thích.
export default function FavoritesPage({ onNavigate, initialType }: FavoritesPageProps) {
  // Lưu dữ liệu và trạng thái thao tác của danh sách nội dung yêu thích trong vòng đời màn hình.
  const [activeTab, setActiveTab] = useState<FavoriteTab>(initialType ?? 'All')
  const [pageNumber, setPageNumber] = useState(1)
  const [page, setPage] = useState<FavoritePage>(EMPTY_PAGE)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [removingId, setRemovingId] = useState<string | null>(null)

  // Đồng bộ trạng thái hoặc tác động bên ngoài khi các phụ thuộc thay đổi.
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

  // Xử lý lựa chọn hoặc chuyển trạng thái giao diện theo thao tác người dùng (selectTab); thuộc danh sách nội dung yêu thích.
  const selectTab = (tab: FavoriteTab) => {
    setLoading(true)
    setError(null)
    setActiveTab(tab)
    setPageNumber(1)
  }

  // Đọc dữ liệu cần thiết và trả kết quả cho bước xử lý tiếp theo (reload); thuộc danh sách nội dung yêu thích.
  const reload = () => {
    setLoading(true)
    setError(null)
    setReloadKey((current) => current + 1)
  }

  // Lấy hoặc lọc danh sách theo điều kiện và phạm vi hiện tại (changePage); thuộc danh sách nội dung yêu thích.
  const changePage = (nextPage: number) => {
    setLoading(true)
    setError(null)
    setPageNumber(nextPage)
  }

  // Xóa mục được chọn theo phạm vi và điều kiện của tính năng (remove); thuộc danh sách nội dung yêu thích.
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

  // Hiển thị giao diện danh sách nội dung yêu thích từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
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
              // Hiển thị giao diện danh sách nội dung yêu thích từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
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
                  <article key={item.id} className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition hover:-translate-y-0.5 hover:shadow-md">
                    <FavoriteVisual item={item} />
                    <div className="flex flex-1 flex-col gap-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                            {typeLabel(item.targetType)}
                          </span>
                          <h2 title={item.targetName} className="mt-2 min-h-[2.75rem] line-clamp-2 break-words text-base font-bold leading-snug text-slate-900">
                            {item.targetName}
                          </h2>
                        </div>
                        <Bookmark className="mt-1 shrink-0 fill-amber-400 text-amber-500" size={18} aria-label="Đã lưu" />
                      </div>
                      <p className="text-xs text-slate-500">{formatSavedDate(item.createdAt)}</p>
                      <div className="mt-auto grid grid-cols-2 items-stretch gap-2 border-t border-slate-100 pt-3">
                        <button
                          type="button"
                          onClick={() => onNavigate?.(targetPath(item))}
                          className="flex min-h-11 min-w-0 items-center justify-center rounded-xl bg-emerald-700 px-2 py-2 text-center text-xs font-bold leading-5 text-white transition hover:bg-emerald-800"
                        >
                          {actionLabel(item.targetType)}
                        </button>
                        <button
                          type="button"
                          onClick={() => void remove(item)}
                          disabled={removingId === item.id}
                          className="inline-flex min-h-11 min-w-0 items-center justify-center gap-1 rounded-xl border border-rose-200 px-2 py-2 text-xs font-bold leading-5 text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
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
