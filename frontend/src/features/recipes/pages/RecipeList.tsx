import { useEffect, useMemo, useState } from 'react'
import {
  ChefHat,
  Flame,
  Heart,
  Leaf,
  RefreshCw,
  Sparkles,
  Utensils,
} from 'lucide-react'
import {
  Button,
  EmptyState,
  SkeletonLoader,
  StatusBadge,
} from '../../../shared/components'
import { getRecipes, toggleFavorite } from '../api/recipeApi'
import { RecipeCard } from '../components/RecipeCard'
import { RecipeFilterBar } from '../components/RecipeFilterBar'
import type {
  Recipe,
  RecipeListFilter,
} from '../types/recipe.types'
import { DEFAULT_RECIPE_FILTER } from '../types/recipe.types'

interface RecipeListProps {
  onNavigate?: (path: string) => void
  isLoggedIn?: boolean
}

// Router injects onNavigate, keep signature compatible.
export default function RecipeList({ onNavigate, isLoggedIn: _isLoggedIn }: RecipeListProps) {
  const [filter, setFilter] = useState<RecipeListFilter>(DEFAULT_RECIPE_FILTER)
  const [items, setItems] = useState<Recipe[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [heroToast, setHeroToast] = useState<string | null>(null)

  const loadList = async (next: Partial<RecipeListFilter> = {}) => {
    const applied: RecipeListFilter = { ...filter, ...next }
    setIsLoading(true)
    try {
      const res = await getRecipes(applied)
      setItems(res.items)
      setTotalCount(res.totalCount)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial mount
  useEffect(() => {
    void loadList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Filter change: debounced search, instant other fields
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
      // Optimistically reflect local state for instant feedback
      setItems((prev) =>
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

  const stats = useMemo(() => {
    const favs = items.filter((i) => i.isFavorite).length
    const veganCount = items.filter((i) => i.dietCategory === 'vegan').length
    const quickCount = items.filter(
      (i) => i.cookTimeMinutes <= 25 || i.dietCategory === 'quick',
    ).length
    const totalKcal = items.reduce((acc, i) => acc + i.nutrition.kcal, 0)
    return { favs, veganCount, quickCount, totalKcal }
  }, [items])

  const grid = (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((r) => (
        <RecipeCard
          key={r.id}
          recipe={r}
          onSelect={handleSelect}
          onToggleFavorite={handleToggleFavorite}
          isTogglingFavorite={togglingId === r.id}
        />
      ))}
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f6faf7] text-[#1f2937]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="mb-6 overflow-hidden rounded-[24px] border border-[#e5e7eb] bg-gradient-to-br from-[#ffffff] via-[#ffffff] to-[#e8f5e9] p-6 shadow-xs sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2e7d32] px-3 py-1 text-[11px] font-extrabold text-white shadow-sm">
                <Sparkles size={12} /> CỘNG ĐỒNG 1,000+ CÔNG THỨC
              </span>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#1f2937] sm:text-4xl">
                Khám phá kho công thức thuần thực vật thơm ngon
              </h1>
              <p className="mt-2 text-sm leading-6 text-[#6b7280]">
                Từ món cơm nhà đơn giản (đậu phụ xốt cà) đến bánh ngọt, phở, bún riêu, bánh mì… tất
                cả đều có hướng dẫn từng bước chi tiết, bạn chọn món, nấu thôi.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="md"
                variant="primary"
                leftIcon={<ChefHat size={14} />}
                onClick={() => onNavigate?.('/ai-chat')}
              >
                Hỏi AI gợi ý hôm nay ăn gì
              </Button>
              <Button
                type="button"
                size="md"
                variant="secondary"
                leftIcon={<RefreshCw size={14} />}
                onClick={() => void loadList()}
              >
                Làm mới
              </Button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            <div className="rounded-[16px] border border-[#e5e7eb] bg-white p-4">
              <div className="text-[11px] font-extrabold uppercase tracking-wide text-[#6b7280]">
                Tổng công thức
              </div>
              <div className="mt-1 flex items-end gap-2">
                <div className="text-2xl font-extrabold text-[#1f2937]">{totalCount}</div>
                <Utensils size={14} className="mb-1 text-[#2e7d32]" />
              </div>
            </div>
            <div className="rounded-[16px] border border-[#c8e6c9] bg-[#e8f5e9]/70 p-4">
              <div className="text-[11px] font-extrabold uppercase tracking-wide text-[#2e7d32]">
                Thuần thực vật
              </div>
              <div className="mt-1 flex items-end gap-2">
                <div className="text-2xl font-extrabold text-[#2e7d32]">{stats.veganCount}</div>
                <Leaf size={14} className="mb-1 text-[#2e7d32]" />
              </div>
            </div>
            <div className="rounded-[16px] border border-amber-200 bg-amber-50/80 p-4">
              <div className="text-[11px] font-extrabold uppercase tracking-wide text-amber-700">
                Nhanh ≤ 25 phút
              </div>
              <div className="mt-1 flex items-end gap-2">
                <div className="text-2xl font-extrabold text-amber-700">{stats.quickCount}</div>
                <Flame size={14} className="mb-1 text-amber-600" />
              </div>
            </div>
            <div className="rounded-[16px] border border-rose-200 bg-rose-50/80 p-4">
              <div className="text-[11px] font-extrabold uppercase tracking-wide text-rose-700">
                Yêu thích (trong bộ lọc)
              </div>
              <div className="mt-1 flex items-end gap-2">
                <div className="text-2xl font-extrabold text-rose-600">{stats.favs}</div>
                <Heart size={14} className="mb-1 fill-rose-500 stroke-rose-600 text-rose-500" />
              </div>
            </div>
          </div>
        </section>

        {/* Filter Bar */}
        <section className="mb-5">
          <RecipeFilterBar
            filter={filter}
            onChange={updateFilter}
            onReset={resetFilter}
            totalCount={totalCount}
            isLoading={isLoading}
          />
        </section>

        {/* Result */}
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <StatusBadge
                status="info"
                size="sm"
                label={`${items.length} kết quả${isLoading ? ' (đang tải)' : ''}`}
              />
              {filter.favoritesOnly && (
                <StatusBadge status="warning" size="sm" label="Chỉ xem yêu thích" />
              )}
              {filter.diet !== 'all' && (
                <StatusBadge status="suitable" size="sm" label={`Chế độ: ${filter.diet}`} />
              )}
              {filter.difficulty !== 'all' && (
                <StatusBadge status="insufficient" size="sm" label={`Độ khó: ${filter.difficulty}`} />
              )}
              {filter.search.trim() && (
                <StatusBadge
                  status="neutral"
                  size="sm"
                  label={`Từ khóa: "${filter.search.trim()}"`}
                />
              )}
            </div>
            <div className="hidden text-[11px] text-[#6b7280] sm:block">
              Tổng năng lượng trung bình bộ lọc:{' '}
              <strong className="text-[#1f2937]">
                {items.length ? Math.round(stats.totalKcal / items.length) : 0} kcal / phần
              </strong>
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              <SkeletonLoader count={6} variant="card" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              title="Không tìm thấy công thức nào phù hợp"
              description="Hãy thử từ khóa khác, nới lỏng độ khó, hoặc thay đổi chế độ ăn. Có thể nhấn nút bên dưới để quay về bộ lọc mặc định xem toàn bộ kho công thức."
              actionLabel="Xóa bộ lọc"
              onAction={resetFilter}
              icon={<Utensils size={36} className="text-[#2e7d32]" />}
            />
          ) : (
            grid
          )}
        </section>
      </div>

      {/* Hero toast feedback */}
      {heroToast && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-full bg-slate-900/90 px-4 py-2 text-[12px] font-bold text-white shadow-lg backdrop-blur">
          {heroToast}
        </div>
      )}
    </div>
  )
}
