import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, ChefHat, Sparkles, UtensilsCrossed } from 'lucide-react'
import { Button, EmptyState, SkeletonLoader } from '../../../shared/components'
import { getRecipes, toggleFavorite } from '../api/recipeApi'
import { RecipeCard } from '../components/RecipeCard'
import { RecipeFilterBar } from '../components/RecipeFilterBar'
import type { Recipe, RecipeListFilter, RecipeSortOption } from '../types/recipe.types'
import { DEFAULT_RECIPE_FILTER } from '../types/recipe.types'

interface RecipeListProps {
  onNavigate?: (path: string) => void
  isLoggedIn?: boolean
}

const PAGE_SIZE = 8

function matchesCategory(r: Recipe, category: string) {
  if (category === 'all') return true
  const t = r.title.toLowerCase()
  switch (category) {
    case 'main':
      return /(xào|rang|kho|đậu phụ|thập cẩm|hạt sen|cháo|gạo|ộp|riêu)/.test(t)
    case 'salad':
      return /salad/.test(t)
    case 'soup':
      return /(canh|chè|nước|phở|hủ tiếu|bún|mì|súp|riêu)/.test(t)
    case 'drink':
      return /(sinh tố|sữa|nước ép|trà|chia|pudding|sữa chua)/.test(t)
    case 'dessert':
      return /(bánh|chè|ngọt|cake|quyết|puding|tiramisu)/.test(t)
    default:
      return true
  }
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

export default function RecipeList({ onNavigate, isLoggedIn: _isLoggedIn }: RecipeListProps) {
  const [filter, setFilter] = useState<RecipeListFilter>(DEFAULT_RECIPE_FILTER)
  const [allItems, setAllItems] = useState<Recipe[]>([])
  const [_totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
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
    try {
      const res = await getRecipes(applied)
      setAllItems(res.items)
      setTotalCount(res.totalCount)
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
    <div
      className="min-h-screen text-[#1F2937] font-['Inter']"
      style={{
        background:
          'linear-gradient(180deg, #F8FAFB 0%, #F0F8F2 25%, #F8FAFB 55%)',
      }}
    >
      <div className="mx-auto w-full max-w-[1232px] px-[24px] pb-14 pt-8 sm:px-[16px]">
        {/* ============== HERO ============== */}
        <section className="flex flex-col items-center text-center">
          <h1
            className="font-extrabold tracking-[-0.015em] text-[#121C2A]"
            style={{ fontSize: '38px', lineHeight: '48px' }}
          >
            Công thức món chay
          </h1>
          <p
            className="mt-3 max-w-[720px] font-normal text-[#6B7280]"
            style={{ fontSize: '16px', lineHeight: '26px' }}
          >
            Khám phá những công thức chay ngon, lành mạnh và dễ thực hiện mỗi ngày được tinh chỉnh
            khoa học theo nhu cầu dinh dưỡng.
          </p>
        </section>

        {/* ============== FILTER BAR ============== */}
        <section className="mt-8">
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
            onOpenAI={() => {
              showToast('✨ Đã chuyển đến Tủ bếp AI gợi ý món')
              onNavigate?.('/pantry')
            }}
          />
        </section>

        {/* ============== Tủ bếp AI banner ============== */}
        <section
          className="mt-6 overflow-hidden rounded-[16px] bg-[#1B5E20] text-white shadow-sm"
        >
          <div className="grid gap-6 px-6 py-6 md:grid-cols-12 md:items-center md:px-8 md:py-7">
            <div className="md:col-span-8">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11.5px] font-semibold uppercase tracking-[0.02em] text-white backdrop-blur">
                <Sparkles size={11} /> Tính năng thông minh mới
              </span>
              <h2 className="mt-2 text-[24px] font-extrabold leading-[32px] text-white">
                Bạn có sẵn nguyên liệu trong bếp?
              </h2>
              <p className="mt-1.5 text-[14px] font-normal leading-[22px] text-emerald-100">
                Thử ngay tính năng Tủ bếp AI để được gợi ý các món chay thơm ngon,
                chuẩn dinh dưỡng từ chính những gì bạn đang có!
              </p>
            </div>
            <div className="flex justify-end md:col-span-4">
              <Button
                type="button"
                size="md"
                variant="primary"
                fullWidth={false}
                className="!rounded-[12px] !bg-white !text-[#1B5E20] !px-5 hover:!bg-[#E8F5E9] font-bold"
                rightIcon={<ArrowRight size={16} />}
                leftIcon={<Sparkles size={16} />}
                onClick={() => {
                  showToast('✨ Đang mở Tủ bếp AI...')
                  onNavigate?.('/pantry')
                }}
              >
                Khám phá Tủ bếp AI -&gt;
              </Button>
            </div>
          </div>
        </section>

        {/* ============== Results header ============== */}
        <section id="recipes-list-section" className="mt-8">
          <div className="mb-5">
            <h2
              className="font-extrabold tracking-[-0.01em] text-[#121C2A]"
              style={{ fontSize: '22px', lineHeight: '30px' }}
            >
              Công thức dành cho bạn
            </h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <SkeletonLoader count={6} variant="card" />
            </div>
          ) : totalFiltered === 0 ? (
            <EmptyState
              title="Không tìm thấy công thức nào phù hợp"
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
              <div className="flex items-center justify-center gap-2 mt-8 mb-6">
                <button
                  type="button"
                  onClick={() => handlePageChange(Math.max(1, safePage - 1))}
                  disabled={safePage === 1}
                  className="flex h-9 items-center gap-1 rounded-[8px] border border-[#e5e7eb] bg-white px-3 text-[13px] font-medium text-[#374151] transition disabled:opacity-40 hover:bg-gray-50 disabled:hover:bg-white"
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
                      className={`w-9 h-9 flex items-center justify-center rounded-[8px] text-[13px] transition ${
                        active
                          ? 'bg-[#2e7d32] text-white font-medium shadow-xs'
                          : 'border border-[#e5e7eb] bg-white text-[#374151] hover:bg-gray-50'
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
                  className="flex h-9 items-center gap-1 rounded-[8px] border border-[#e5e7eb] bg-white px-3 text-[13px] font-medium text-[#374151] transition disabled:opacity-40 hover:bg-gray-50 disabled:hover:bg-white"
                >
                  Sau &gt;
                </button>
              </div>
            </>
          )}
        </section>
      </div>

      {heroToast && (
        <div
          aria-live="polite"
          className="pointer-events-none fixed bottom-10 left-1/2 z-40 -translate-x-1/2 rounded-full bg-slate-900/90 px-5 py-2 text-[14px] font-semibold text-white shadow-lg backdrop-blur"
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
