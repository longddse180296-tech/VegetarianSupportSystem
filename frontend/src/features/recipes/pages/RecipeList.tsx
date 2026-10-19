import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, ChefHat, Sparkles, UtensilsCrossed } from 'lucide-react'
import { Badge, EmptyState, PageHeading, SkeletonCard } from '../../../shared/components'
import { getRecipes, toggleFavorite } from '../api/recipeApi'
import { RecipeCard } from '../components/RecipeCard'
import { RecipeFilterBar } from '../components/RecipeFilterBar'
import type { Recipe, RecipeListFilter, RecipeSortOption } from '../types/recipe.types'
import { DEFAULT_RECIPE_FILTER } from '../types/recipe.types'

interface RecipeListProps {
  onNavigate?: (path: string) => void
  isLoggedIn?: boolean
  initialSearch?: string
}

const PAGE_SIZE = 8

// Icon tủ lạnh mở cửa với các ngăn kệ bên trong
const OpenFridgeIcon = ({ size = 28, className = '' }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-label="Tủ lạnh mở"
  >
    {/* Thân tủ chính bên trái */}
    <rect x="3" y="2" width="12" height="20" rx="2" />
    <line x1="3" y1="8.5" x2="15" y2="8.5" />
    {/* Các ngăn chứa thực phẩm bên trong */}
    <line x1="5.5" y1="5.5" x2="12.5" y2="5.5" strokeDasharray="1 1" />
    <line x1="5.5" y1="13" x2="12.5" y2="13" strokeDasharray="1 1" />
    <line x1="5.5" y1="17" x2="12.5" y2="17" strokeDasharray="1 1" />
    {/* Cánh cửa tủ mở sang bên phải */}
    <path d="M15 2.5 L20.5 4.5 V21.5 L15 19.5 Z" fill="currentColor" fillOpacity="0.15" />
    <path d="M15 2.5 L20.5 4.5 V21.5 L15 19.5" />
    {/* Tay nắm cửa */}
    <line x1="18" y1="10" x2="18" y2="14" strokeWidth="2" />
  </svg>
)

function matchesCategory(r: Recipe, category: string) {
  if (!category || category === 'all') return true
  const rCat = (r.category || '').toLowerCase().trim()
  const target = category.toLowerCase().trim()

  // 1. Exact match
  if (rCat === target) return true

  // 2. Strict category mapping (strictly compares r.category from database, never loose title keywords)
  if (target.includes('cơm') || target.includes('xôi')) {
    return rCat.includes('cơm') || rCat.includes('xôi')
  }
  if (target.includes('bún') || target.includes('phở') || target.includes('mì')) {
    return rCat.includes('bún') || rCat.includes('phở') || rCat.includes('mì')
  }
  if (target.includes('canh') || target.includes('súp')) {
    return rCat.includes('canh') || rCat.includes('súp')
  }
  if (target.includes('xào') || target.includes('rau')) {
    return rCat.includes('xào') || rCat.includes('rau')
  }
  if (target.includes('kho') || target.includes('rim')) {
    return rCat.includes('kho') || rCat.includes('rim')
  }
  if (target.includes('gỏi') || target.includes('salad')) {
    return rCat.includes('gỏi') || rCat.includes('salad')
  }
  if (target.includes('cuốn') || target.includes('chiên')) {
    return (rCat.includes('cuốn') || rCat.includes('chiên')) && !rCat.includes('cơm') && !rCat.includes('xôi')
  }
  if (target.includes('bánh') || target.includes('tráng miệng')) {
    return rCat.includes('bánh') || rCat.includes('tráng miệng')
  }
  if (target.includes('uống') || target.includes('đồ uống')) {
    return rCat.includes('uống')
  }

  return rCat.includes(target) || target.includes(rCat)
}

function matchesCook(r: Recipe, tier: string) {
  if (tier === 'all') return true
  const t = r.cookTimeMinutes
  if (tier === 'lt15') return t < 15
  if (tier === '15-30') return t >= 15 && t <= 30
  if (tier === '30-45') return t > 30 && t <= 45
  if (tier === 'gt45') return t > 45
  return true
}

function matchesKcal(r: Recipe, tier: string) {
  if (tier === 'all') return true
  const k = r.nutrition.kcal
  if (tier === 'lt200') return k < 200
  if (tier === '200-350') return k >= 200 && k <= 350
  if (tier === '350-500') return k >= 350 && k <= 500
  if (tier === 'gt500') return k > 500
  return true
}

export default function RecipeList({
  onNavigate,
  isLoggedIn: _isLoggedIn,
  initialSearch = '',
}: RecipeListProps) {
  const [filter, setFilter] = useState<RecipeListFilter>(() => ({
    ...DEFAULT_RECIPE_FILTER,
    search: initialSearch,
  }))
  const [allItems, setAllItems] = useState<Recipe[]>([])
  const [_totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [heroToast, setHeroToast] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  // UI filter states (client side)
  const [category, setCategory] = useState('all')
  const [cookTimeTier, setCookTimeTier] = useState('all')
  const [kcalTier, setKcalTier] = useState('all')
  const [dietPill, setDietPill] = useState('all')
  const [sort] = useState<RecipeSortOption>('relevance')

  const loadList = async (next: Partial<RecipeListFilter> = {}) => {
    const applied: RecipeListFilter = { ...filter, ...next }
    setIsLoading(true)
    setIsError(false)
    try {
      const res = await getRecipes(applied)
      setAllItems(res.items)
      setTotalCount(res.totalCount)
    } catch {
      setIsError(true)
      setAllItems([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => {
      void loadList()
    }, 250)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter.search, filter.diet, filter.difficulty, filter.sort, filter.favoritesOnly])

  const updateFilter = (patch: Partial<RecipeListFilter>) => {
    setFilter((prev) => ({ ...prev, ...patch }))
  }

  const resetFilter = () => {
    setFilter(DEFAULT_RECIPE_FILTER)
    setCategory('all')
    setCookTimeTier('all')
    setKcalTier('all')
    setDietPill('all')
    setPage(1)
  }

  const handleSelect = (id: string) => {
    onNavigate?.(`/recipes/${encodeURIComponent(id)}`)
  }

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage)
    const el = document.getElementById('recipes-list-section')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleToggleFavorite = async (
    id: string,
    next: boolean,
  ): Promise<{ ok: boolean; next: boolean }> => {
    setTogglingId(id)
    try {
      const res = await toggleFavorite(id, next)
      setAllItems((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, isFavorite: res.isFavorite, favoriteCount: res.favoriteCount }
            : r,
        ),
      )
      setHeroToast(next ? 'Đã lưu vào yêu thích ❤️' : 'Đã gỡ khỏi mục yêu thích')
      window.setTimeout(() => setHeroToast(null), 1500)
      return { ok: true, next: res.isFavorite }
    } finally {
      setTogglingId(null)
    }
  }

  const showToast = (msg: string) => {
    setHeroToast(msg)
    window.setTimeout(() => setHeroToast(null), 1500)
  }

  // Apply UI + base filters
  const filtered = useMemo(() => {
    let arr = allItems.filter(
      (r) =>
        matchesCategory(r, category) &&
        matchesCook(r, cookTimeTier) &&
        matchesKcal(r, kcalTier),
    )
    if (dietPill !== 'all') {
      arr = arr.filter((r) => r.dietCategory === dietPill)
    }
    if (sort === 'newest') {
      arr = [...arr].sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      )
    } else if (sort === 'cooktime_asc') {
      arr = [...arr].sort((a, b) => a.cookTimeMinutes - b.cookTimeMinutes)
    } else if (sort === 'favorite_desc') {
      arr = [...arr].sort((a, b) => b.favoriteCount - a.favoriteCount)
    }
    return arr
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allItems, category, cookTimeTier, kcalTier, dietPill, sort])

  const totalFiltered = filtered.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pagedItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <div className="ui-page-container py-8 space-y-6">
      <PageHeading
        title="Công thức món chay"
        description="Khám phá những công thức chay ngon, lành mạnh và dễ thực hiện mỗi ngày được tinh chỉnh khoa học theo nhu cầu dinh dưỡng."
        breadcrumbs={[
          { label: 'Trang chủ', onClick: () => onNavigate?.('/') },
          { label: 'Công thức' },
        ]}
        eyebrow={<Badge icon={<ChefHat size={14} />}>Bộ sưu tập món ngon</Badge>}
      />

      {/* ============== FILTER BAR ============== */}
      <section className="mt-2">
          <RecipeFilterBar
            filter={filter}
            onChange={updateFilter}
            onReset={resetFilter}
            totalCount={totalFiltered}
            isLoading={isLoading}
            category={category}
            setCategory={(c) => {
              setCategory(c)
              setPage(1)
            }}
            cookTimeTier={cookTimeTier}
            setCookTimeTier={(c) => {
              setCookTimeTier(c)
              setPage(1)
            }}
            kcalTier={kcalTier}
            setKcalTier={(c) => {
              setKcalTier(c)
              setPage(1)
            }}
            dietPill={dietPill}
            setDietPill={(c) => {
              setDietPill(c)
              setPage(1)
            }}
          />
        </section>

        {/* ============== BANNER AI TỦ BẾP (Background xanh nhạt, icon tủ lạnh mở, Card nổi bật) ============== */}
        <section
          className="mt-7 overflow-hidden rounded-[20px] border border-emerald-200/90 bg-gradient-to-r from-emerald-50 via-teal-50/70 to-green-50 shadow-xs"
        >
          <div className="grid gap-6 px-6 py-6 md:grid-cols-12 md:items-center md:px-8 md:py-6">
            <div className="md:col-span-8">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/90 px-3 py-1 text-[12px] font-bold text-emerald-800 shadow-2xs">
                <Sparkles size={13} className="text-emerald-700" /> Tính năng thông minh mới
              </span>
              <h2 className="mt-2.5 text-[22px] font-extrabold leading-[30px] text-emerald-950">
                Bạn có sẵn nguyên liệu trong bếp?
              </h2>
              <p className="mt-1 text-[14px] font-normal leading-[22px] text-emerald-800/90">
                Thử ngay tính năng Tủ bếp AI để nhận gợi ý các món chay thơm ngon,
                chuẩn dinh dưỡng từ chính những gì bạn đang có mà không lo lãng phí!
              </p>
            </div>

            {/* Nhãn "Mở tủ bếp AI" dạng Card nổi bật nhưng không lấn át danh sách món */}
            <div className="flex md:col-span-4 md:justify-end">
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  showToast('✨ Đang mở Tủ bếp AI...')
                  onNavigate?.('/pantry')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onNavigate?.('/pantry')
                  }
                }}
                className="group flex w-full cursor-pointer items-center justify-between gap-3.5 rounded-[16px] border-2 border-emerald-300 bg-white p-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-500 hover:shadow-md md:w-auto md:min-w-[240px]"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-emerald-50 text-emerald-700 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                  <OpenFridgeIcon size={24} />
                </div>
                <div className="flex flex-1 flex-col text-left">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                    Gợi ý món theo bếp
                  </span>
                  <span className="text-[15px] font-extrabold text-slate-900 group-hover:text-emerald-800">
                    Mở tủ bếp AI
                  </span>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-all group-hover:bg-emerald-50 group-hover:text-emerald-700 group-hover:translate-x-0.5">
                  <ArrowRight size={16} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============== RESULTS SECTION: TIÊU ĐỀ TONE XÁM ĐẬM/ĐEN ============== */}
        <section id="recipes-list-section" className="mt-9">
          <div className="mb-5 flex items-center justify-between">
            {/* Tiêu đề đổi màu sang tone xám đậm/đen */}
            <h2
              className="text-[24px] md:text-[26px] font-extrabold tracking-tight text-[#111827]"
              style={{ lineHeight: '32px' }}
            >
              Công thức nổi bật
            </h2>
            <span className="text-[13.5px] font-medium text-slate-500">
              {totalFiltered} công thức
            </span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : isError ? (
            <EmptyState
              title="Không thể kết nối đến máy chủ"
              description="Mất kết nối hoặc máy chủ phản hồi quá lâu, vui lòng thử lại."
              actionLabel="Thử lại"
              onAction={() => void loadList()}
              icon={<ChefHat size={40} className="text-red-500" />}
            />
          ) : totalFiltered === 0 ? (
            <EmptyState
              title="Không có công thức nào phù hợp"
              description="Hãy thử từ khóa khác, nới lỏng bộ lọc về thời gian, mức calo hoặc thay đổi chế độ ăn. Bạn cũng có thể dùng Tủ bếp AI để gợi ý theo nguyên liệu đang có."
              actionLabel="Xóa bộ lọc"
              onAction={resetFilter}
              icon={<ChefHat size={40} className="text-[#2E7D32]" />}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {pagedItems.map((r) => (
                  <RecipeCard
                    key={r.id}
                    recipe={r}
                    onSelect={handleSelect}
                    onToggleFavorite={handleToggleFavorite}
                    isTogglingFavorite={togglingId === r.id}
                  />
                ))}
              </div>

              {/* Basic Pagination */}
              <div className="flex items-center justify-center gap-2 mt-9 mb-6">
                <button
                  type="button"
                  onClick={() => handlePageChange(Math.max(1, safePage - 1))}
                  disabled={safePage === 1}
                  className="flex h-9 items-center gap-1 rounded-[10px] border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 transition disabled:opacity-40 hover:bg-slate-50 disabled:hover:bg-white"
                >
                  &lt; Trước
                </button>
                {Array.from({ length: totalPages }).map((_, i) => {
                  const idx = i + 1
                  const active = idx === safePage
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handlePageChange(idx)}
                      className={`w-9 h-9 flex items-center justify-center rounded-[10px] text-[13px] transition ${
                        active
                          ? 'bg-[#2E7D32] text-white font-bold shadow-xs'
                          : 'border border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {idx}
                    </button>
                  )
                })}
                <button
                  type="button"
                  onClick={() => handlePageChange(Math.min(totalPages, safePage + 1))}
                  disabled={safePage === totalPages}
                  className="flex h-9 items-center gap-1 rounded-[10px] border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 transition disabled:opacity-40 hover:bg-slate-50 disabled:hover:bg-white"
                >
                  Sau &gt;
                </button>
              </div>
            </>
          )}
        </section>

      {heroToast && (
        <div
          aria-live="polite"
          className="pointer-events-none fixed bottom-10 left-1/2 z-40 -translate-x-1/2 rounded-full bg-slate-900/90 px-5 py-2.5 text-[14px] font-semibold text-white shadow-lg backdrop-blur-md"
          style={{ lineHeight: '20px' }}
        >
          <span className="mr-1.5 inline-flex items-center gap-1">
            <UtensilsCrossed size={14} />
          </span>
          {heroToast}
        </div>
      )}
    </div>
  )
}

export { RecipeList, RecipeList as RecipesPage }
