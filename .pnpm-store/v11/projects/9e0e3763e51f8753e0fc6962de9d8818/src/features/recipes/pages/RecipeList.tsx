import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, ChefHat, Leaf, Sparkles, UtensilsCrossed } from 'lucide-react'
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
  const [matchProfile, setMatchProfile] = useState(true)
  const [sort, setSort] = useState<RecipeSortOption>('relevance')

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
    if (matchProfile) {
      // prefer vegan first then ovo-lacto
      arr = [...arr].sort((a, b) => {
        const order = (x: Recipe) =>
          x.dietCategory === 'vegan' ? 0 : x.dietCategory === 'ovo-lacto' ? 1 : 2
        return order(a) - order(b)
      })
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
  }, [allItems, category, cookTimeTier, kcalTier, dietPill, matchProfile, sort])

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
        {/* ============== HERO (top bar w/ profile pill) ============== */}
        <section className="flex flex-col items-center text-center">
          <div
            className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-[#E8F5E9] px-3 py-1 text-[12.5px] font-semibold text-[#2E7D32] ring-1 ring-[#C8E6C9]"
          >
            <Leaf size={12} /> Hồ sơ đang chọn: Thuần chay (Vegan)
          </div>
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
          {/* Stats 3 cards */}
          <div className="mt-6 grid w-full grid-cols-1 gap-4 md:grid-cols-3 md:max-w-[720px]">
            <div
              className="rounded-[16px] border border-[#E5E7EB] bg-white px-5 py-4 text-left"
              style={{ boxShadow: '0 1px 2px 0 rgba(15,23,42,0.04)' }}
            >
              <div className="text-[28px] font-extrabold tabular-nums text-[#2E7D32]">
                500+
              </div>
              <div className="text-[13px] font-semibold text-[#6B7280]">
                Món chay chọn lọc
              </div>
            </div>
            <div
              className="rounded-[16px] border border-[#E5E7EB] bg-white px-5 py-4 text-left"
              style={{ boxShadow: '0 1px 2px 0 rgba(15,23,42,0.04)' }}
            >
              <div className="text-[28px] font-extrabold tabular-nums text-[#2E7D32]">
                {'< 30p'}
              </div>
              <div className="text-[13px] font-semibold text-[#6B7280]">
                Chuẩn bị nhanh gọn
              </div>
            </div>
            <div
              className="rounded-[16px] border border-[#E5E7EB] bg-white px-5 py-4 text-left"
              style={{ boxShadow: '0 1px 2px 0 rgba(15,23,42,0.04)' }}
            >
              <div className="text-[28px] font-extrabold tabular-nums text-[#2E7D32]">
                100%
              </div>
              <div className="text-[13px] font-semibold text-[#6B7280]">
                Chuẩn khoa học BMI
              </div>
            </div>
          </div>
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
            matchProfile={matchProfile}
            setMatchProfile={setMatchProfile}
            sort={sort}
            setSort={setSort}
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
        <section className="mt-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2
                className="font-extrabold tracking-[-0.01em] text-[#121C2A]"
                style={{ fontSize: '22px', lineHeight: '30px' }}
              >
                Công thức dành cho bạn
              </h2>
              <span className="inline-flex items-center rounded-full bg-[#2E7D32] px-2.5 py-1 text-[12px] font-bold text-white">
                {totalFiltered} công thức
              </span>
            </div>
            <div className="hidden items-center gap-2 text-[13px] font-semibold text-[#6B7280] md:flex">
              Sắp xếp theo:
              <div className="rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-2 shadow-xs">
                Phù hợp nhất
              </div>
            </div>
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

              {/* Pagination */}
              <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-[16px] border border-[#E5E7EB] bg-white px-5 py-4 shadow-xs md:flex-row">
                <div className="text-[13px] font-medium text-[#6B7280]">
                  Đang hiển thị <strong className="text-[#1F2937]">{1 + (safePage - 1) * PAGE_SIZE}</strong>{' '}
                  - <strong className="text-[#1F2937]">{Math.min(safePage * PAGE_SIZE, totalFiltered)}</strong>{' '}
                  trong tổng số <strong className="text-[#1F2937]">{totalFiltered}</strong> công thức
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setPage((p) => Math.max(1, p - 1))
                      }
                    }}
                    disabled={safePage === 1}
                    className="flex h-9 items-center gap-1 rounded-[10px] border border-[#E5E7EB] bg-white px-3 text-[13px] font-semibold text-[#4B5563] transition disabled:opacity-40 hover:bg-[#F5FBF6] hover:border-[#C8E6C9]"
                  >
                    <ArrowLeft size={14} /> Trước
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const idx = i + 1
                    const active = idx === safePage
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPage(idx)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            setPage(idx)
                          }
                        }}
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-[10px] border text-[13px] font-bold transition ${
                          active
                            ? 'border-[#2E7D32] bg-[#2E7D32] text-white shadow-sm'
                            : 'border-[#E5E7EB] bg-white text-[#4B5563] hover:bg-[#F5FBF6] hover:border-[#C8E6C9]'
                        }`}
                      >
                        {idx}
                      </button>
                    )
                  })}
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                    }}
                    disabled={safePage === totalPages}
                    className="flex h-9 items-center gap-1 rounded-[10px] border border-[#E5E7EB] bg-white px-3 text-[13px] font-semibold text-[#4B5563] transition disabled:opacity-40 hover:bg-[#F5FBF6] hover:border-[#C8E6C9]"
                  >
                    Sau <ArrowRight size={14} />
                  </button>
                </div>
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
